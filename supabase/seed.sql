-- ============================================================
-- ELIE Sales OS — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ── Women (Classic) ─────────────────────────────────────────
INSERT INTO perfumes (name, gender, tier, tags) VALUES
    ('Dior Hypnotic Poison',             'femme', 'classic', '{"oriental","sweet","vanilla"}'),
    ('Jean Paul Gaultier Scandal',       'femme', 'classic', '{"sweet","floral","honey"}'),
    ('Dolce & Gabbana L''Impératrice',   'femme', 'classic', '{"fruity","fresh","watermelon"}'),
    ('Carolina Herrera Good Girl',       'femme', 'classic', '{"oriental","jasmine","cocoa"}'),
    ('Giorgio Armani My Way',            'femme', 'classic', '{"floral","white flowers","tuberose"}'),
    ('Paco Rabanne Olympea',             'femme', 'classic', '{"oriental","salty","vanilla"}'),
    ('Burberry Her',                     'femme', 'classic', '{"fruity","berry","musk"}'),
    ('Guerlain Mon Guerlain',            'femme', 'classic', '{"oriental","lavender","vanilla"}'),
    ('Lattafa Yara',                     'femme', 'classic', '{"gourmand","tropical","orchid"}'),
    ('Dior Poison Girl',                 'femme', 'classic', '{"oriental","bitter almond","rose"}'),
    ('Yves Saint Laurent Libre Intense', 'femme', 'classic', '{"oriental","lavender","orange blossom"}'),
    ('Yves Rocher Evidence',             'femme', 'classic', '{"floral","rose","green"}'),
    ('Gissah Imperial Valley',           'femme', 'classic', '{"oriental","oud","amber"}'),
    ('Gucci Flora',                      'femme', 'classic', '{"floral","peony","rose"}'),
    ('Elie Saab Le Parfum',              'femme', 'classic', '{"floral","orange blossom","jasmine"}'),
    ('Francis Kurkdjian Baccarat Rouge 540', 'femme', 'classic', '{"amber","saffron","cedar"}'),
    ('Alam Otur Taj',                    'femme', 'classic', '{"oriental","oud","musk"}'),
    ('Dolce & Gabbana The One Femme',    'femme', 'classic', '{"oriental","peach","plum"}'),
    ('Dior J''adore',                    'femme', 'classic', '{"floral","ylang","rose"}');

-- ── Women (Niche) ───────────────────────────────────────────
INSERT INTO perfumes (name, gender, tier, tags) VALUES
    ('Kayali 28',                        'femme', 'niche', '{"gourmand","vanilla","musk"}'),
    ('Kayali Utopia Vanilla',            'femme', 'niche', '{"vanilla","amber","brown sugar"}'),
    ('Kayali Marshmallow',               'femme', 'niche', '{"gourmand","marshmallow","sugar"}'),
    ('MFK Baccarat Rouge 540 Extrait',   'femme', 'niche', '{"amber","saffron","jasmine"}'),
    ('Maison Marly Delina',              'femme', 'niche', '{"floral","rose","lychee"}');

-- ── Men (Classic) ───────────────────────────────────────────
INSERT INTO perfumes (name, gender, tier, tags) VALUES
    ('Dior Sauvage Elixir',              'homme', 'classic', '{"spicy","amber","lavender"}'),
    ('Armani Stronger With You',         'homme', 'classic', '{"sweet","chestnut","vanilla"}'),
    ('Tom Ford Black Orchid',            'homme', 'classic', '{"floral","dark","truffle"}'),
    ('Dior Homme Intense',               'homme', 'classic', '{"iris","amber","leather"}'),
    ('Dunhill Desire',                   'homme', 'classic', '{"citrus","apple","amber"}'),
    ('Dunhill Desire Blue',              'homme', 'classic', '{"aquatic","fresh","musk"}'),
    ('JPG Ultra Male',                   'homme', 'classic', '{"sweet","pear","vanilla"}'),
    ('Dior Sauvage',                     'homme', 'classic', '{"fresh","spicy","ambroxan"}'),
    ('Chanel Bleu',                      'homme', 'classic', '{"woody","cedar","incense"}'),
    ('JPG Le Male Elixir',               'homme', 'classic', '{"oriental","vanilla","lavender"}'),
    ('Mont Blanc Legend',                'homme', 'classic', '{"fresh","fruity","woody"}'),
    ('Armani You Intensely',             'homme', 'classic', '{"sweet","cardamom","leather"}'),
    ('Lancôme Oud Bouquet',              'homme', 'classic', '{"oud","rose","saffron"}'),
    ('Paco Rabanne One Million',         'homme', 'classic', '{"sweet","spicy","leather"}'),
    ('Paco Rabanne Black XS',            'homme', 'classic', '{"sweet","dark","coffee"}'),
    ('Azzaro Wanted',                    'homme', 'classic', '{"fresh","ginger","lemon"}'),
    ('Paco Rabanne XS L''Exces',         'homme', 'classic', '{"oriental","spicy","leather"}'),
    ('YSL La Nuit de L''Homme',          'homme', 'classic', '{"sweet","cardamom","cedar"}'),
    ('Alan Bray L''Homme Legend',        'homme', 'classic', '{"woody","aromatic","leather"}');

-- ── Men (Niche) ─────────────────────────────────────────────
INSERT INTO perfumes (name, gender, tier, tags) VALUES
    ('LV Ombre Nomade',                  'homme', 'niche', '{"oud","rose","incense"}'),
    ('LV Imagination',                   'homme', 'niche', '{"citrus","tea","musk"}'),
    ('Xerjoff Erba Pura',                'homme', 'niche', '{"fruity","amber","musk"}'),
    ('Xerjoff Naxos',                    'homme', 'niche', '{"tobacco","honey","lavender"}'),
    ('Tom Ford Tobacco Vanille',         'homme', 'niche', '{"tobacco","vanilla","spice"}');

-- ── Create inventory row for each perfume (stock = 10) ──────
INSERT INTO inventory (perfume_id, stock, low_stock_threshold)
SELECT id, 10, 5
FROM perfumes;
