-- ============================================================
-- ELIE AI Commerce OS — Consolidated Production Schema
-- ============================================================

-- 1. PRODUCTS (inventory-enabled catalog)
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT UNIQUE NOT NULL,
    slug                TEXT UNIQUE NOT NULL,
    category            TEXT NOT NULL, -- e.g., 'homme', 'femme', 'mixte'
    tier                TEXT NOT NULL DEFAULT 'classic' CHECK (tier IN ('classic','niche')),
    stock               INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    image_url           TEXT NOT NULL DEFAULT '/catalogues/placeholder.webp',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- 2. SHOP SETTINGS
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

-- Seed default settings
INSERT INTO shop_settings (id, shop_name, support_email, whatsapp, auto_validate, low_stock_alert)
VALUES ('global', 'ELIE PERFUMES', 'contact@elie.ma', '+212 600 000 000', false, true)
ON CONFLICT (id) DO NOTHING;

-- 3. ORDERS (Ensure all production columns exist)
-- Note: 'orders' table usually exists, these are the critical columns for ELIE OS
DO $$ 
BEGIN
    -- Add columns if missing (safe migrations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='selected_perfumes') THEN
        ALTER TABLE orders ADD COLUMN selected_perfumes TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='gift_perfume') THEN
        ALTER TABLE orders ADD COLUMN gift_perfume TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='price_mad') THEN
        ALTER TABLE orders ADD COLUMN price_mad INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='offer_mode') THEN
        ALTER TABLE orders ADD COLUMN offer_mode TEXT DEFAULT 'ramadan';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery') THEN
        ALTER TABLE orders ADD COLUMN delivery TEXT DEFAULT 'free';
    END IF;
END $$;

-- 4. ROW LEVEL SECURITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Polices
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage products" ON products;
CREATE POLICY "Auth manage products" ON products FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read settings" ON shop_settings;
CREATE POLICY "Public read settings" ON shop_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage settings" ON shop_settings;
CREATE POLICY "Auth manage settings" ON shop_settings FOR ALL USING (auth.role() = 'authenticated');

-- 5. RPC FUNCTIONS
-- Secure order creation
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

    -- Decrement stock in products table
    FOREACH v_perfume_name IN ARRAY p_perfumes
    LOOP
        UPDATE products
        SET stock = GREATEST(stock - 1, 0),
            updated_at = now()
        WHERE name = v_perfume_name AND stock > 0;
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_order_secure TO anon, authenticated;
