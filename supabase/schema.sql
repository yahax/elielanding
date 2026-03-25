-- ============================================================
-- ELIE AI Commerce OS v2 — Production Schema
-- ============================================================

-- 0. Clean slate
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_moves CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- 1. PROFILES (admin auth)
-- ============================================================
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','agent','viewer')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PRODUCTS (inventory-enabled catalog)
-- ============================================================
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT UNIQUE NOT NULL,
    slug                TEXT UNIQUE NOT NULL,
    category            TEXT NOT NULL, -- e.g., 'homme', 'femme'
    tier                TEXT NOT NULL CHECK (tier IN ('classic','niche')),
    stock               INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    image_url           TEXT NOT NULL DEFAULT '/catalogues/placeholder.webp',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_active ON products (is_active);
CREATE INDEX idx_products_category ON products (category);

-- ============================================================
-- 3. CUSTOMERS (CRM)
-- ============================================================
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    phone           TEXT UNIQUE NOT NULL,
    city            TEXT,
    address         TEXT,
    last_order_at   TIMESTAMPTZ,
    total_orders    INT DEFAULT 0,
    total_spent     INT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_phone ON customers (phone);

-- ============================================================
-- 4. ORDERS
-- ============================================================
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name       TEXT, -- Snapshot for speed/history
    phone               TEXT,
    city                TEXT,
    address             TEXT,
    pack_type           TEXT NOT NULL CHECK (pack_type IN ('homme','femme','mixte')),
    total_price         INT NOT NULL DEFAULT 199,
    status              TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','to_confirm','confirmed','shipped','delivered','canceled')),
    source              TEXT NOT NULL DEFAULT 'direct'
                        CHECK (source IN ('whatsapp','direct','meta_ads','organic','other')),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ,
    shipped_at          TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    canceled_at         TIMESTAMPTZ
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- ============================================================
-- 5. EVENTS (Audit & Analytics)
-- ============================================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL, -- 'order_created', 'stock_out', etc.
    entity_type     TEXT NOT NULL, -- 'order', 'product', 'customer'
    entity_id       UUID NOT NULL,
    payload         JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Polices simplified (Admins can do everything)
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth events" ON events FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. FUNCTIONS & RPC
-- ============================================================

-- Safely decrement stock by product name
CREATE OR REPLACE FUNCTION decrement_stock_by_name(p_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock - 1,
        updated_at = now()
    WHERE name = p_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: Public order insertion should be handled via a secure API or specific RLS policies if direct.
-- For now, assuming direct Supabase client with restricted permissions or service role for creation.
