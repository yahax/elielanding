-- ============================================================
-- ELIE AI Commerce OS v2.3 — Settings Persistence
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_settings (
    id          TEXT PRIMARY KEY DEFAULT 'global',
    shop_name   TEXT DEFAULT 'ELIE PERFUMES',
    support_email TEXT DEFAULT 'contact@elie.ma',
    whatsapp    TEXT DEFAULT '+212 600 000 000',
    auto_validate BOOLEAN DEFAULT false,
    low_stock_alert BOOLEAN DEFAULT true,
    currency    TEXT DEFAULT 'MAD',
    timezone    TEXT DEFAULT 'Africa/Casablanca',
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed defaults
INSERT INTO shop_settings (id, shop_name, support_email, whatsapp, auto_validate, low_stock_alert)
VALUES ('global', 'ELIE PERFUMES', 'contact@elie.ma', '+212 600 000 000', false, true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON shop_settings;
DROP POLICY IF EXISTS "Auth manage settings" ON shop_settings;
CREATE POLICY "Public read settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "Auth manage settings" ON shop_settings FOR ALL USING (auth.role() = 'authenticated');
