-- ############################################################
-- SUPABASE SCHEMA - CARDÁPIO DIGITAL SAAS
-- ############################################################

-- 0. CLEANUP (RECONSTRUÇÃO DO ZERO)
DROP TABLE IF EXISTS public.restaurants, public.categories, public.products, public.orders, public.views, public.system_settings CASCADE;
DROP TYPE IF EXISTS user_plan, order_status CASCADE;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_plan as enum ('free', 'basico', 'pro');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');

-- 3. TABLES

-- 3.1 RESTAURANTS (Perfil do Lojista)
create table public.restaurants (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    slug text unique not null,
    whatsapp_number text not null,
    logo_url text,
    banner_url text,
    accent_color text default '#f59e0b',
    social_links jsonb default '[]'::jsonb,
    bio text,
    address text,
    theme_color text default '#18181b',
    plan user_plan default 'free',
    trial_ends_at timestamp with time zone,
    business_hours jsonb default '[]'::jsonb,
    is_active boolean default true,
    last_txid text,
    pending_plan_id text,
    pending_plan_period text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    constraint restaurant_user_unique unique(user_id)
);

-- 3.2 CATEGORIES
create table public.categories (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    name text not null,
    sort_order integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3.3 PRODUCTS
create table public.products (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete cascade not null,
    name text not null,
    description text,
    price numeric(10,2) not null default 0.00,
    original_price numeric(10,2),
    image_url text,
    is_available boolean default true,
    is_upsell boolean default false,
    tags jsonb default '[]'::jsonb,
    sort_order integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3.4 ORDERS
create table public.orders (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    total_amount numeric(10,2) not null default 0.00,
    customer_name text,
    customer_phone text,
    customer_address text,
    items jsonb not null default '[]'::jsonb,
    status order_status default 'pending',
    items_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3.5 VIEWS (Analytics)
create table public.views (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    ip_address text,
    created_at timestamp with time zone default now()
);

-- 3.6 SYSTEM SETTINGS (Global Admin)
create table public.system_settings (
    key text primary key,
    value text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. ROW LEVEL SECURITY (RLS) policies

-- Enable RLS
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.views enable row level security;
alter table public.system_settings enable row level security;

-- 4.1 RESTAURANTS policies
create policy "Restaurants are viewable by everyone" on public.restaurants
    for select using (true);

create policy "Users can update their own restaurant" on public.restaurants
    for update using (auth.uid() = user_id);

create policy "Users can insert their own restaurant" on public.restaurants
    for insert with check (auth.uid() = user_id);

-- 4.2 CATEGORIES policies
create policy "Categories are viewable by everyone" on public.categories
    for select using (true);

create policy "Owners can manage categories" on public.categories
    for all using (
        restaurant_id in (select id from public.restaurants where user_id = auth.uid())
    );

-- 4.3 PRODUCTS policies
create policy "Products are viewable by everyone" on public.products
    for select using (true);

create policy "Owners can manage products" on public.products
    for all using (
        restaurant_id in (select id from public.restaurants where user_id = auth.uid())
    );

-- 4.4 ORDERS policies
create policy "Anyone can create orders" on public.orders
    for insert with check (true);

create policy "Owners can view their orders" on public.orders
    for select using (
        restaurant_id in (select id from public.restaurants where user_id = auth.uid())
    );

create policy "Owners can update order status" on public.orders
    for update using (
        restaurant_id in (select id from public.restaurants where user_id = auth.uid())
    );

-- 4.5 VIEWS policies
create policy "Anyone can record views" on public.views
    for insert with check (true);

create policy "Owners can see views" on public.views
    for select using (
        restaurant_id in (select id from public.restaurants where user_id = auth.uid())
    );

-- 4.6 SYSTEM SETTINGS policies (Admin Only)
create policy "Public can view settings" on public.system_settings
    for select using (true);

-- 5. FUNCTIONS & TRIGGERS

-- Function to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply updated_at to all tables
create trigger set_updated_at before update on public.restaurants for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on public.categories for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on public.products for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on public.orders for each row execute procedure handle_updated_at();
create trigger set_updated_at before update on public.system_settings for each row execute procedure handle_updated_at();
-- Force refresh
