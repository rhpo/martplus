CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT,
  accent TEXT,                       -- 'navy'|'red'|'caramel'|'navy-soft'
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category_slug TEXT NOT NULL REFERENCES categories(slug),
  description TEXT,
  price REAL NOT NULL,               -- DZD
  original_price REAL,               -- DZD, nullable; > price => on promo
  rating REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image TEXT,                        -- S3 OBJECT KEY, e.g. 'products/buldak-carbo.jpg'
  badge TEXT,                        -- 'BESTSELLER' | 'PROMO' | 'NOUVEAU' | NULL
  stock INTEGER NOT NULL DEFAULT 0,
  is_flash INTEGER NOT NULL DEFAULT 0,
  flash_reserved_pct INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category_slug);
CREATE INDEX idx_products_flash ON products(is_flash);

CREATE TABLE coupons (
  code TEXT PRIMARY KEY,             -- 'MARTPLUS10'
  percent INTEGER NOT NULL,          -- 10 = -10%
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref TEXT UNIQUE NOT NULL,        -- 'MP-7F3A9C'
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_lat REAL NOT NULL,             -- pinned on the map (mandatory)
  customer_lng REAL NOT NULL,
  distance_km REAL NOT NULL,              -- haversine store -> pin, used for the fee
  customer_email TEXT,                    -- optional
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,  -- consent for offers/discounts emails
  payment_method TEXT NOT NULL,           -- 'cod' | 'cib' | 'edahabia'
  coupon_code TEXT,
  subtotal REAL NOT NULL,                 -- DZD
  discount REAL NOT NULL DEFAULT 0,
  delivery_fee REAL NOT NULL DEFAULT 0,   -- clamp(300 + 30*distance_km, 300, 700), or 0 if free
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|preparing|out_for_delivery|delivered|cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT                          -- set when admin edits the order
);

CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  name_snapshot TEXT NOT NULL,            -- copy at the moment it was added
  price_snapshot REAL NOT NULL,           -- DZD at the moment it was added
  quantity INTEGER NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
