INSERT INTO categories (slug, label, emoji, accent, sort_order) VALUES
  ('chocolats',  'Chocolats & Coffrets',    '🍫', 'navy',      1),
  ('bonbons',    'Bonbons & Confiserie',    '🍬', 'red',       2),
  ('fromages',   'Fromages & Crémerie',     '🧀', 'navy',      3),
  ('chips',      'Chips & Snacking',        '🥔', 'caramel',   4),
  ('maison',     'Détergents & Maison',     '🧼', 'navy-soft', 5),
  ('boissons',   'Boissons',                '🥤', 'red',       6),
  ('epicerie',   'Épicerie Fine',           '🍯', 'caramel',   7),
  ('nouveautes', 'Nouveautés',              '✨', 'red',       8);

INSERT INTO coupons (code, percent, active) VALUES
  ('MARTPLUS10', 10, 1);
