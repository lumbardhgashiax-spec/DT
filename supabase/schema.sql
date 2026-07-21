-- Diamond Tennis Academy
-- Snapshot i skemes ekzistuese ne Supabase, ruajtur me 2026-07-18.
-- Ky skedar eshte reference e struktures aktuale dhe nuk duhet ekzekutuar
-- mbi databazen ekzistuese si migration, sepse tabelat jane krijuar tashme.
-- Pa triggers, functions, RPC ose RLS policies.

begin;

-- 1. Perdoruesit e dashboard-it
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  phone text,
  role text not null default 'staff'
    check (role in ('staff', 'admin', 'superadmin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Klientet
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Fushat e tenisit
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  court_type text not null
    check (court_type in ('outdoor', 'indoor')),
  supports_heating boolean not null default false,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (court_type = 'indoor' or supports_heating = false),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180),
  check ((latitude is null) = (longitude is null))
);

-- 4. Fotografite e fushave; skedaret ruhen ne bucket-in privat court-images
create table public.court_images (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  storage_path text not null unique,
  original_name text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. Sherbimet shtese, p.sh. ngrohja ose pajisjet
create table public.extra_services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Sezonat e cmimeve
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  season_type text not null
    check (season_type in ('summer', 'winter')),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (ends_on >= starts_on),
  exclude using gist (
    daterange(starts_on, ends_on, '[]') with &&
  )
);

-- 7. Cmimet sipas sezonit, llojit te fushes dhe nxemjes
create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  court_type text not null
    check (court_type in ('outdoor', 'indoor')),
  with_heating boolean not null default false,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (season_id, court_type, with_heating, duration_minutes),
  check (court_type = 'indoor' or with_heating = false)
);

-- 8. Rezervimet
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id uuid not null
    references public.customers(id) on delete restrict,
  court_id uuid not null
    references public.courts(id) on delete restrict,
  season_id uuid not null
    references public.seasons(id) on delete restrict,
  price_rule_id uuid
    references public.price_rules(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  with_heating boolean not null default false,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  price numeric(10,2) not null default 0 check (price >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (end_at > start_at)
);

commit;
