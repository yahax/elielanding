-- ============================================================
-- ELIE AI Commerce OS v2.2 — Hardening & Transactional Logic
-- ============================================================

-- 1. Secure Transactional Order Creation
-- Handles CRM, Order, Items, and Stock in one atomic step.
-- Drop legacy signatures first to avoid stale schema-cache behavior.
DROP FUNCTION IF EXISTS create_order_secure(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS create_order_secure(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT[], TEXT, JSONB);

-- Database-level safeguards: refuse incomplete ELIE 5+1 orders.
DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_selected_perfumes_len_chk;
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_gift_perfume_nonempty_chk;
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_selected_gift_unique_chk;

        ALTER TABLE orders
            ADD CONSTRAINT orders_selected_perfumes_len_chk
                CHECK (COALESCE(array_length(selected_perfumes, 1), 0) = 5) NOT VALID,
            ADD CONSTRAINT orders_gift_perfume_nonempty_chk
                CHECK (gift_perfume IS NOT NULL AND btrim(gift_perfume) <> '') NOT VALID;

        CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key
            ON orders ((meta->>'idempotency_key'))
            WHERE (meta->>'idempotency_key') IS NOT NULL AND btrim(meta->>'idempotency_key') <> '';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION create_order_secure(
    p_customer_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_address TEXT,
    p_pack_type TEXT,
    p_total_price INT,
    p_source TEXT,
    p_perfumes TEXT[], -- Expecting exactly 6 perfume names
    p_offer_mode TEXT DEFAULT 'ramadan',
    p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_perfume_name TEXT;
    v_perfume_id UUID;
    v_existing_order_id UUID;
    v_idempotency_key TEXT;
    v_has_perfume_inventory BOOLEAN := to_regclass('public.inventory') IS NOT NULL AND to_regclass('public.perfumes') IS NOT NULL;
    v_has_products BOOLEAN := to_regclass('public.products') IS NOT NULL;
BEGIN
    -- 1. Validate Input
    IF p_customer_name IS NULL OR btrim(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Le nom client est obligatoire.';
    END IF;

    IF p_phone IS NULL OR btrim(p_phone) = '' THEN
        RAISE EXCEPTION 'Le téléphone client est obligatoire.';
    END IF;

    IF p_city IS NULL OR btrim(p_city) = '' THEN
        RAISE EXCEPTION 'La ville client est obligatoire.';
    END IF;

    IF p_pack_type IS NULL OR btrim(p_pack_type) NOT IN ('homme', 'femme', 'mixte') THEN
        RAISE EXCEPTION 'Pack invalide.';
    END IF;

    IF p_source IS NULL OR btrim(p_source) = '' THEN
        RAISE EXCEPTION 'Source obligatoire.';
    END IF;

    IF p_total_price <> 199 THEN
        RAISE EXCEPTION 'Prix invalide pour l''offre ELIE.';
    END IF;

    IF COALESCE(array_length(p_perfumes, 1), 0) <> 6 THEN
        RAISE EXCEPTION 'Une commande ELIE nécessite exactement 6 parfums.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(p_perfumes) AS perfume_name
        WHERE perfume_name IS NULL OR btrim(perfume_name) = ''
    ) THEN
        RAISE EXCEPTION 'Les slots parfum sont incomplets.';
    END IF;

    -- Idempotency: return existing order for repeated payload key.
    v_idempotency_key := NULLIF(btrim(COALESCE(p_meta->>'idempotency_key', '')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT id
        INTO v_existing_order_id
        FROM orders
        WHERE meta->>'idempotency_key' = v_idempotency_key
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_existing_order_id IS NOT NULL THEN
            RETURN v_existing_order_id;
        END IF;
    END IF;

    -- 2. Create the Order
    -- Use verified production columns: selected_perfumes (text[]), gift_perfume (text), price (int), price_mad (int), offer_mode (text), delivery (text), meta (jsonb)
    INSERT INTO orders (
        customer_name, 
        phone, 
        city, 
        address, 
        pack_type, 
        selected_perfumes, 
        gift_perfume, 
        price,
        price_mad, 
        offer_mode,
        delivery,
        source, 
        status, 
        meta,
        created_at, 
        updated_at
    )
    VALUES (
        btrim(p_customer_name), 
        btrim(p_phone), 
        btrim(p_city), 
        COALESCE(NULLIF(btrim(p_address), ''), btrim(p_city)), 
        btrim(p_pack_type), 
        p_perfumes[1:5],  -- Indices 1-5 (first 5)
        btrim(p_perfumes[6]),    -- Index 6 (last)
        p_total_price, 
        p_total_price,
        COALESCE(NULLIF(btrim(p_offer_mode), ''), 'ramadan'),
        'free',
        btrim(p_source), 
        'new', 
        COALESCE(p_meta, '{}'::jsonb),
        now(), 
        now()
    )
    RETURNING id INTO v_order_id;

    -- 3. Process Perfumes (Stock decrement)
    FOREACH v_perfume_name IN ARRAY p_perfumes
    LOOP
        -- Production schema (perfumes + inventory)
        IF v_has_perfume_inventory THEN
            SELECT id INTO v_perfume_id
            FROM perfumes
            WHERE name = v_perfume_name
            LIMIT 1;

            IF v_perfume_id IS NOT NULL THEN
                UPDATE inventory
                SET stock = GREATEST(stock - 1, 0),
                    updated_at = now()
                WHERE perfume_id = v_perfume_id AND stock > 0;
            END IF;
        -- Legacy schema fallback (products table only)
        ELSIF v_has_products THEN
            UPDATE products
            SET stock = GREATEST(stock - 1, 0),
                updated_at = now()
            WHERE name = v_perfume_name AND stock > 0;
        END IF;
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to ensure anyone can call the secure order logic
GRANT EXECUTE ON FUNCTION create_order_secure(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT, TEXT[], TEXT, JSONB) TO anon, authenticated;

-- 2. Secure Status Transitions
-- Prevents invalid state changes and updates timestamps.
CREATE OR REPLACE FUNCTION update_order_status_secure(
    p_order_id UUID,
    p_new_status TEXT
) RETURNS VOID AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    SELECT status INTO v_current_status FROM orders WHERE id = p_order_id;
    
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Commande non trouvée.';
    END IF;

    -- Business Rules for Transitions
    IF v_current_status = 'canceled' AND p_new_status != 'canceled' THEN
        RAISE EXCEPTION 'Impossible de restaurer une commande annulée.';
    END IF;
    
    IF v_current_status = 'delivered' AND p_new_status NOT IN ('delivered', 'canceled') THEN
        RAISE EXCEPTION 'La commande est déjà livrée au client.';
    END IF;

    -- Update Order
    UPDATE orders 
    SET 
        status = p_new_status,
        updated_at = now(),
        confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END,
        shipped_at = CASE WHEN p_new_status = 'shipped' AND shipped_at IS NULL THEN now() ELSE shipped_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
        canceled_at = CASE WHEN p_new_status = 'canceled' AND canceled_at IS NULL THEN now() ELSE canceled_at END
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bulk Status Update Helper
CREATE OR REPLACE FUNCTION bulk_update_order_status(
    p_order_ids UUID[],
    p_new_status TEXT
) RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_oid UUID;
BEGIN
    FOREACH v_oid IN ARRAY p_order_ids
    LOOP
        BEGIN
            PERFORM update_order_status_secure(v_oid, p_new_status);
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Skip failed ones (audit logs could go here)
            CONTINUE;
        END;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Public Access for Ordering (if needed)
-- Note: In Production, you should use a Service Role or limited API access.
-- GRANT EXECUTE ON FUNCTION create_order_secure TO anon, authenticated;
