-- MART+ · Supabase (Postgres) schema, seed and RPCs.
-- Run this once in the Supabase SQL editor (or `supabase db` tooling).
-- Everything the app does at runtime goes through @supabase/supabase-js;
-- this file is the one-time DDL the JS client cannot perform itself.

-- ---------- tables ----------
create table if not exists categories (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  label       text not null,
  emoji       text,
  accent      text,
  sort_order  integer default 0
);

create table if not exists products (
  id                 bigint generated always as identity primary key,
  slug               text unique not null,
  name               text not null,
  brand              text,
  category_slug      text not null references categories(slug),
  description        text,
  price              numeric not null,
  original_price     numeric,
  rating             numeric default 0,
  review_count       integer default 0,
  image              text,
  badge              text,
  stock              integer not null default 0,
  is_flash           boolean not null default false,
  flash_reserved_pct integer default 0,
  created_at         timestamptz not null default now()
);
create index if not exists idx_products_category on products(category_slug);
create index if not exists idx_products_flash on products(is_flash);

create table if not exists coupons (
  code    text primary key,
  percent integer not null,
  active  boolean not null default true
);

create table if not exists orders (
  id               bigint generated always as identity primary key,
  public_ref       text unique not null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text not null,
  customer_lat     double precision not null,
  customer_lng     double precision not null,
  distance_km      double precision not null,
  customer_email   text,
  marketing_opt_in boolean not null default false,
  payment_method   text not null,
  coupon_code      text,
  subtotal         numeric not null,
  discount         numeric not null default 0,
  delivery_fee     numeric not null default 0,
  total            numeric not null,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items (
  id             bigint generated always as identity primary key,
  order_id       bigint not null references orders(id) on delete cascade,
  product_id     bigint not null references products(id),
  name_snapshot  text not null,
  price_snapshot numeric not null,
  quantity       integer not null
);
create index if not exists idx_order_items_order on order_items(order_id);

-- ---------- seed (categories + coupon) ----------
insert into categories (slug, label, emoji, accent, sort_order) values
  ('chocolats',  'Chocolats & Coffrets',  '🍫', 'navy',      1),
  ('bonbons',    'Bonbons & Confiserie',  '🍬', 'red',       2),
  ('fromages',   'Fromages & Crémerie',   '🧀', 'navy',      3),
  ('chips',      'Chips & Snacking',      '🥔', 'caramel',   4),
  ('maison',     'Détergents & Maison',   '🧼', 'navy-soft', 5),
  ('boissons',   'Boissons',              '🥤', 'red',       6),
  ('epicerie',   'Épicerie Fine',         '🍯', 'caramel',   7),
  ('nouveautes', 'Nouveautés',            '✨', 'red',       8)
on conflict (slug) do nothing;

insert into coupons (code, percent, active) values ('MARTPLUS10', 10, true)
on conflict (code) do nothing;

-- ---------- RPC: atomic order placement ----------
-- Business math (subtotal, coupon, distance, fee, total) is computed in TypeScript
-- and passed in; this function only performs the atomic writes + a stock re-check.
create or replace function place_order(p_order jsonb, p_items jsonb)
returns bigint
language plpgsql
as $$
declare
  v_order_id bigint;
  v_item     jsonb;
  v_updated  integer;
begin
  insert into orders (
    public_ref, customer_name, customer_phone, customer_address,
    customer_lat, customer_lng, distance_km, customer_email, marketing_opt_in,
    payment_method, coupon_code, subtotal, discount, delivery_fee, total, status
  ) values (
    p_order->>'public_ref', p_order->>'customer_name', p_order->>'customer_phone',
    p_order->>'customer_address', (p_order->>'customer_lat')::double precision,
    (p_order->>'customer_lng')::double precision, (p_order->>'distance_km')::double precision,
    nullif(p_order->>'customer_email',''), coalesce((p_order->>'marketing_opt_in')::boolean,false),
    p_order->>'payment_method', nullif(p_order->>'coupon_code',''),
    (p_order->>'subtotal')::numeric, (p_order->>'discount')::numeric,
    (p_order->>'delivery_fee')::numeric, (p_order->>'total')::numeric, 'pending'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    update products
       set stock = stock - (v_item->>'quantity')::integer
     where id = (v_item->>'product_id')::bigint
       and stock >= (v_item->>'quantity')::integer;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'STOCK_INSUFFISANT pour le produit %', v_item->>'product_id';
    end if;

    insert into order_items (order_id, product_id, name_snapshot, price_snapshot, quantity)
    values (
      v_order_id, (v_item->>'product_id')::bigint, v_item->>'name_snapshot',
      (v_item->>'price_snapshot')::numeric, (v_item->>'quantity')::integer
    );
  end loop;

  return v_order_id;
end;
$$;

-- ---------- RPC: atomic admin order edit ----------
create or replace function admin_update_order(
  p_order_id bigint, p_customer jsonb, p_items jsonb, p_totals jsonb
)
returns void
language plpgsql
as $$
declare
  v_item    jsonb;
  v_updated integer;
begin
  -- return all current stock, then re-deduct for the new item set (atomic).
  update products p
     set stock = p.stock + oi.quantity
    from order_items oi
   where oi.order_id = p_order_id and oi.product_id = p.id;

  delete from order_items where order_id = p_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    update products
       set stock = stock - (v_item->>'quantity')::integer
     where id = (v_item->>'product_id')::bigint
       and stock >= (v_item->>'quantity')::integer;
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'STOCK_INSUFFISANT pour le produit %', v_item->>'product_id';
    end if;

    insert into order_items (order_id, product_id, name_snapshot, price_snapshot, quantity)
    values (
      p_order_id, (v_item->>'product_id')::bigint, v_item->>'name_snapshot',
      (v_item->>'price_snapshot')::numeric, (v_item->>'quantity')::integer
    );
  end loop;

  update orders set
    customer_name    = coalesce(nullif(p_customer->>'customer_name',''), customer_name),
    customer_phone   = coalesce(nullif(p_customer->>'customer_phone',''), customer_phone),
    customer_address = coalesce(nullif(p_customer->>'customer_address',''), customer_address),
    customer_email   = case when p_customer ? 'customer_email'
                            then nullif(p_customer->>'customer_email','') else customer_email end,
    subtotal     = (p_totals->>'subtotal')::numeric,
    discount     = (p_totals->>'discount')::numeric,
    delivery_fee = (p_totals->>'delivery_fee')::numeric,
    total        = (p_totals->>'total')::numeric,
    updated_at   = now()
  where id = p_order_id;
end;
$$;

-- ---------- RPC: adjust stock (admin, with floor at 0) ----------
create or replace function adjust_stock(p_product_id bigint, p_delta integer)
returns void
language plpgsql
as $$
declare v_updated integer;
begin
  update products set stock = stock + p_delta
   where id = p_product_id and stock + p_delta >= 0;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'STOCK_INSUFFISANT pour le produit %', p_product_id;
  end if;
end;
$$;
