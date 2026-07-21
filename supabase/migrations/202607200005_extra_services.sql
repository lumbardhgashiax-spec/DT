-- Diamond Tennis Academy - shërbimet shtesë
-- Ekzekutoje në Supabase SQL Editor pas migrimeve ekzistuese.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_active_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role in ('staff', 'admin', 'superadmin')
  );
$$;

create or replace function private.has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

create table if not exists public.extra_services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists extra_services_active_idx on public.extra_services (is_active, name);

alter table public.extra_services enable row level security;

drop policy if exists extra_services_staff_select on public.extra_services;
create policy extra_services_staff_select on public.extra_services
  for select to authenticated using ((select private.is_active_staff()));

drop policy if exists extra_services_admin_insert on public.extra_services;
create policy extra_services_admin_insert on public.extra_services
  for insert to authenticated with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists extra_services_admin_update on public.extra_services;
create policy extra_services_admin_update on public.extra_services
  for update to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])))
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists extra_services_admin_delete on public.extra_services;
create policy extra_services_admin_delete on public.extra_services
  for delete to authenticated using ((select private.has_role(array['admin', 'superadmin'])));

grant select, insert, update, delete on public.extra_services to authenticated;

commit;
