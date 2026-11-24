-- PRM B2B Marketplace — Supabase schema
-- Run this once in the Supabase SQL editor (SQL Editor → New query → paste → Run).

create extension if not exists "pgcrypto";

-- ============ ORGANIZATIONS ============
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null,
  type text not null check (type in ('producer','retailer')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending','in-review','verified','rejected','suspended')),
  registration_number text not null unique,
  tax_number text,
  phone text not null,
  email text not null,
  region text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ USERS ============
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('producer','retailer','platform-admin')),
  status text not null default 'pending' check (status in ('pending','active','suspended','terminated')),
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

-- ============ SESSIONS ============
create table if not exists sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ============ CATEGORIES ============
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);

-- ============ PRODUCTS ============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  producer_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references categories(id),
  brand text not null,
  description text not null,
  unit text not null default 'case',
  wholesale_price numeric(12,2) not null check (wholesale_price >= 0),
  minimum_order_quantity integer not null default 1 check (minimum_order_quantity >= 1),
  stock integer not null default 0 check (stock >= 0),
  lead_time_days integer not null default 0,
  delivery_regions text[] default '{}',
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected','suspended','archived')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_producer_idx on products(producer_id);
create index if not exists products_status_idx on products(approval_status, active);

-- ============ ORDERS ============
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references organizations(id),
  producer_id uuid not null references organizations(id),
  status text not null default 'pending'
    check (status in ('pending','quotation','confirmed','preparing','dispatched','in-transit','delivered','completed','cancelled','rejected','disputed')),
  total numeric(12,2) not null default 0,
  delivery_address text not null,
  requested_delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_buyer_idx on orders(buyer_id);
create index if not exists orders_producer_idx on orders(producer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity >= 1),
  unit_price numeric(12,2) not null
);

create table if not exists order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

-- ============ MESSAGING ============
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  producer_id uuid not null references organizations(id),
  retailer_id uuid not null references organizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references app_users(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on messages(conversation_id);

-- ============ REVIEWS ============
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  producer_id uuid not null references organizations(id) on delete cascade,
  retailer_id uuid not null references organizations(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ DISPUTES ============
create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  order_id uuid not null references orders(id) on delete cascade,
  opened_by uuid not null references app_users(id),
  status text not null default 'open' check (status in ('open','investigating','awaiting-response','resolved','closed')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  description text not null,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ NOTIFICATIONS ============
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind text not null default 'system' check (kind in ('system','order','verification','announcement','dispute')),
  user_id uuid references app_users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_org_idx on notifications(organization_id, read);

-- ============ SEED CATEGORIES ============
insert into categories (name) values
  ('Beverages'), ('Water'), ('Food & Agriculture'), ('Consumer Goods'), ('Household Products')
on conflict (name) do nothing;

-- ============ PLATFORM ADMIN (password: admin123 — change after first login) ============
insert into app_users (name, email, password_hash, role, status)
select 'Platform Administrator', 'admin@nexusone.local',
       crypt('admin123', gen_salt('bf')), 'platform-admin', 'active'
where not exists (
  select 1 from app_users where email = 'admin@nexusone.local'
);
