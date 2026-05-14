-- ============================================================
-- XXV – Domaine Vins des Cinq
-- Schéma base de données commandes
-- ============================================================

-- Extension UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: wines
-- ============================================================
create table if not exists wines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('blanc', 'rose', 'effervescent')),
  price_per_bottle decimal(10,2) not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Données initiales – gamme XXV
insert into wines (name, category, price_per_bottle, description) values
  ('La Lisière',             'blanc',        16.00, 'Assemblage Chardonnay, Müller-Thurgau et Pinot Gris'),
  ('Müller-Thurgau',         'blanc',        16.00, 'Cépage aromatique, frais et fruité'),
  ('Pinot Gris',             'blanc',        16.00, 'Blanc élégant aux notes dorées'),
  ('Chardonnay',             'blanc',        18.00, 'Élevé en fût de chêne, complexe et minéral'),
  ('Primesautier',           'rose',         16.00, 'Rosé de PN et PM, frais et gourmand'),
  ('Esprit de Famille blanc','effervescent', 22.00, 'Méthode traditionnelle, blanc de blancs'),
  ('Esprit de Famille rosé', 'effervescent', 22.00, 'Méthode traditionnelle, rosé festif');

-- ============================================================
-- TABLE: orders
-- ============================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  company text,
  company_address text,
  vat_number text,
  total_amount decimal(10,2) not null,
  status text not null default 'received' check (status in ('received','processed','delivered')),
  notes text,
  notified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABLE: order_items
-- ============================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  wine_id uuid not null references wines(id),
  wine_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price decimal(10,2) not null,
  subtotal decimal(10,2) generated always as (quantity * unit_price) stored
);

-- ============================================================
-- TABLE: order_status_history
-- ============================================================
create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz default now()
);

-- ============================================================
-- TABLE: admin_users
-- ============================================================
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null default 'admin',
  password_hash text not null,
  created_at timestamptz default now()
);

-- Mot de passe par défaut : xxv2025 (à changer après déploiement)
-- Hash bcrypt généré avec crypt('xxv2025', gen_salt('bf'))
insert into admin_users (username, password_hash)
values ('admin', crypt('xxv2025', gen_salt('bf')));

-- ============================================================
-- TRIGGER: updated_at sur orders
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: historique des changements de statut
-- ============================================================
create or replace function log_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into order_status_history (order_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger orders_status_history
  after update on orders
  for each row execute function log_status_change();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table wines enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table admin_users enable row level security;

-- Wines : lecture publique
create policy "wines_public_read" on wines for select using (true);

-- Orders : insertion publique (formulaire client)
create policy "orders_public_insert" on orders for insert with check (true);
create policy "order_items_public_insert" on order_items for insert with check (true);

-- Admin : accès complet via service_role (Supabase Edge Functions)
-- Les Edge Functions utilisent le service_role key qui bypass RLS

-- Vue aggregée pour les stats (accessible en service_role)
create or replace view v_order_stats as
select
  date_trunc('day', created_at)   as day,
  date_trunc('week', created_at)  as week,
  date_trunc('month', created_at) as month,
  date_trunc('year', created_at)  as year,
  count(*)                        as order_count,
  sum(total_amount)               as revenue
from orders
group by 1, 2, 3, 4;

