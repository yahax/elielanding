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
BEGIN
    INSERT INTO orders (
        customer_name, phone, city, address, pack_type, 
        selected_perfumes, gift_perfume, 
        price, price_mad, offer_mode, delivery,
        source, status, meta, created_at, updated_at
    )
    VALUES (
        p_customer_name, p_phone, p_city, p_address, p_pack_type, 
        p_perfumes[1:5], p_perfumes[6],
        p_total_price, p_total_price, COALESCE(p_offer_mode, 'ramadan'), 'free',
        p_source, 'new', p_meta, now(), now()
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
