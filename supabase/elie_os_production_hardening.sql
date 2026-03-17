-- ============================================================
-- ELIE AI Commerce OS — Production Hardening Migration
-- Target: Existing perfumes and inventory tables
-- ============================================================

-- 1. HARDEN PERFUMES (Catalog Metadata)
DO $$ 
BEGIN
    -- Add slug if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfumes' AND column_name='slug') THEN
        ALTER TABLE perfumes ADD COLUMN slug TEXT;
        UPDATE perfumes SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
        ALTER TABLE perfumes ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE perfumes ADD CONSTRAINT perfumes_slug_key UNIQUE (slug);
    END IF;

    -- Add tier if missing (already exists in probe, but for safety)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfumes' AND column_name='tier') THEN
        ALTER TABLE perfumes ADD COLUMN tier TEXT DEFAULT 'classic' CHECK (tier IN ('classic','niche'));
    END IF;

    -- Add image_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfumes' AND column_name='image_url') THEN
        ALTER TABLE perfumes ADD COLUMN image_url TEXT DEFAULT '/catalogues/placeholder.webp';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='perfumes' AND column_name='updated_at') THEN
        ALTER TABLE perfumes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. HARDEN INVENTORY
DO $$
BEGIN
    -- Ensure low_stock_threshold exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='low_stock_threshold') THEN
        ALTER TABLE inventory ADD COLUMN low_stock_threshold INT DEFAULT 5;
    END IF;
END $$;

-- 3. SHOP SETTINGS (Missing in Production)
CREATE TABLE IF NOT EXISTS shop_settings (
    id              TEXT PRIMARY KEY DEFAULT 'global',
    shop_name       TEXT DEFAULT 'ELIE PERFUMES',
    support_email   TEXT DEFAULT 'contact@elie.ma',
    whatsapp        TEXT DEFAULT '+212 600 000 000',
    auto_validate   BOOLEAN DEFAULT false,
    low_stock_alert BOOLEAN DEFAULT true,
    currency        TEXT DEFAULT 'MAD',
    timezone        TEXT DEFAULT 'Africa/Casablanca',
    updated_at      TIMESTAMPTZ DEFAULT now()
);

INSERT INTO shop_settings (id, shop_name, support_email, whatsapp)
VALUES ('global', 'ELIE PERFUMES', 'contact@elie.ma', '+212 600 000 000')
ON CONFLICT (id) DO NOTHING;

-- 4. RLS & SECURITY
ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read perfumes" ON perfumes;
CREATE POLICY "Public read perfumes" ON perfumes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage perfumes" ON perfumes;
CREATE POLICY "Auth manage perfumes" ON perfumes FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read inventory" ON inventory;
CREATE POLICY "Public read inventory" ON inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage inventory" ON inventory;
CREATE POLICY "Auth manage inventory" ON inventory FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read settings" ON shop_settings;
CREATE POLICY "Public read settings" ON shop_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage settings" ON shop_settings;
CREATE POLICY "Auth manage settings" ON shop_settings FOR ALL USING (auth.role() = 'authenticated');

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

-- 5. RPC FUNCTIONS
-- Secure order creation tied to perfumes/inventory
CREATE OR REPLACE FUNCTION create_order_secure(
    p_customer_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_address TEXT,
    p_pack_type TEXT,
    p_total_price INT,
    p_source TEXT,
    p_perfumes TEXT[],
    p_offer_mode TEXT DEFAULT 'ramadan',
    p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_perfume_name TEXT;
    v_existing_order_id UUID;
    v_idempotency_key TEXT;
BEGIN
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

    INSERT INTO orders (
        customer_name, phone, city, address, pack_type, 
        selected_perfumes, gift_perfume, 
        price, price_mad, offer_mode, delivery,
        source, status, meta, created_at, updated_at
    )
    VALUES (
        btrim(p_customer_name), btrim(p_phone), btrim(p_city), COALESCE(NULLIF(btrim(p_address), ''), btrim(p_city)), btrim(p_pack_type), 
        p_perfumes[1:5], btrim(p_perfumes[6]),
        p_total_price, p_total_price, COALESCE(NULLIF(btrim(p_offer_mode), ''), 'ramadan'), 'free',
        btrim(p_source), 'new', COALESCE(p_meta, '{}'::jsonb), now(), now()
    )
    RETURNING id INTO v_order_id;

    -- Decrement stock in inventory table
    FOREACH v_perfume_name IN ARRAY p_perfumes
    LOOP
        UPDATE inventory
        SET stock = GREATEST(stock - 1, 0),
            updated_at = now()
        WHERE perfume_id = (SELECT id FROM perfumes WHERE name = v_perfume_name LIMIT 1);
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_order_secure TO anon, authenticated;
