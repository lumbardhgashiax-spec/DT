-- Diamond Tennis Academy - galeria private e fushave
-- Ekzekutoje ne Supabase SQL Editor pas migrimeve ekzistuese.

begin;

-- Migrimi mund të zbatohet edhe kur migrimi fillestar i dashboard-it
-- nuk është ekzekutuar ende.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role in ('staff', 'admin', 'superadmin')
  );
$$;

create or replace function private.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

create table if not exists public.court_images (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  storage_path text not null unique,
  original_name text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists court_images_court_sort_idx
  on public.court_images (court_id, sort_order, created_at);

alter table public.court_images enable row level security;

drop policy if exists court_images_staff_select on public.court_images;
create policy court_images_staff_select on public.court_images
  for select to authenticated
  using ((select private.is_active_staff()));

drop policy if exists court_images_admin_insert on public.court_images;
create policy court_images_admin_insert on public.court_images
  for insert to authenticated
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists court_images_admin_update on public.court_images;
create policy court_images_admin_update on public.court_images
  for update to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])))
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists court_images_admin_delete on public.court_images;
create policy court_images_admin_delete on public.court_images
  for delete to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])));

grant select, insert, update, delete on public.court_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'court-images',
  'court-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists court_images_storage_select on storage.objects;
create policy court_images_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'court-images'
    and (select private.is_active_staff())
  );

drop policy if exists court_images_storage_insert on storage.objects;
create policy court_images_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'court-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and (select private.has_role(array['admin', 'superadmin']))
  );

drop policy if exists court_images_storage_update on storage.objects;
create policy court_images_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'court-images'
    and (select private.has_role(array['admin', 'superadmin']))
  )
  with check (
    bucket_id = 'court-images'
    and (select private.has_role(array['admin', 'superadmin']))
  );

drop policy if exists court_images_storage_delete on storage.objects;
create policy court_images_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'court-images'
    and (select private.has_role(array['admin', 'superadmin']))
  );

commit;
