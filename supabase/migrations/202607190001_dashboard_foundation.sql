-- Diamond Tennis Academy - dashboard security and business rules
-- REVIEW BEFORE RUNNING in Supabase SQL Editor.
-- This migration is intentionally not executed by the application.

begin;

create extension if not exists btree_gist with schema extensions;
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

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email, 'Përdorues'),
    'staff'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

insert into public.profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), email, 'Përdorues'),
  'staff'
from auth.users
on conflict (id) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'customers', 'courts', 'seasons', 'price_rules', 'reservations'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute procedure private.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

alter table public.customers alter column created_by set default auth.uid();
alter table public.reservations alter column created_by set default auth.uid();

create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_name_idx on public.customers (last_name, first_name);
create index if not exists reservations_start_at_idx on public.reservations (start_at);
create index if not exists reservations_court_start_idx on public.reservations (court_id, start_at);
create index if not exists reservations_customer_idx on public.reservations (customer_id);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists price_rules_lookup_idx
  on public.price_rules (season_id, court_type, with_heating, duration_minutes)
  where is_active = true;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reservations_no_time_overlap'
  ) then
    alter table public.reservations
      add constraint reservations_no_time_overlap
      exclude using gist (
        court_id with =,
        tstzrange(start_at, end_at, '[)') with &&
      )
      where (status <> 'cancelled');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'active_seasons_no_overlap'
  ) then
    alter table public.seasons
      add constraint active_seasons_no_overlap
      exclude using gist (daterange(starts_on, ends_on, '[]') with &&)
      where (is_active = true);
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.courts enable row level security;
alter table public.seasons enable row level security;
alter table public.price_rules enable row level security;
alter table public.reservations enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.has_role(array['admin', 'superadmin']))
  );

drop policy if exists profiles_superadmin_update on public.profiles;
create policy profiles_superadmin_update on public.profiles
  for update to authenticated
  using ((select private.has_role(array['superadmin'])))
  with check ((select private.has_role(array['superadmin'])));

drop policy if exists customers_staff_select on public.customers;
create policy customers_staff_select on public.customers
  for select to authenticated using ((select private.is_active_staff()));
drop policy if exists customers_staff_insert on public.customers;
create policy customers_staff_insert on public.customers
  for insert to authenticated with check ((select private.is_active_staff()));
drop policy if exists customers_staff_update on public.customers;
create policy customers_staff_update on public.customers
  for update to authenticated
  using ((select private.is_active_staff()))
  with check ((select private.is_active_staff()));

drop policy if exists courts_staff_select on public.courts;
create policy courts_staff_select on public.courts
  for select to authenticated using ((select private.is_active_staff()));
drop policy if exists courts_admin_insert on public.courts;
create policy courts_admin_insert on public.courts
  for insert to authenticated with check ((select private.has_role(array['admin', 'superadmin'])));
drop policy if exists courts_admin_update on public.courts;
create policy courts_admin_update on public.courts
  for update to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])))
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists seasons_staff_select on public.seasons;
create policy seasons_staff_select on public.seasons
  for select to authenticated using ((select private.is_active_staff()));
drop policy if exists seasons_admin_insert on public.seasons;
create policy seasons_admin_insert on public.seasons
  for insert to authenticated with check ((select private.has_role(array['admin', 'superadmin'])));
drop policy if exists seasons_admin_update on public.seasons;
create policy seasons_admin_update on public.seasons
  for update to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])))
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists price_rules_staff_select on public.price_rules;
create policy price_rules_staff_select on public.price_rules
  for select to authenticated using ((select private.is_active_staff()));
drop policy if exists price_rules_admin_insert on public.price_rules;
create policy price_rules_admin_insert on public.price_rules
  for insert to authenticated with check ((select private.has_role(array['admin', 'superadmin'])));
drop policy if exists price_rules_admin_update on public.price_rules;
create policy price_rules_admin_update on public.price_rules
  for update to authenticated
  using ((select private.has_role(array['admin', 'superadmin'])))
  with check ((select private.has_role(array['admin', 'superadmin'])));

drop policy if exists reservations_staff_select on public.reservations;
create policy reservations_staff_select on public.reservations
  for select to authenticated using ((select private.is_active_staff()));

revoke all on all tables in schema public from anon;
grant select on public.profiles, public.customers, public.courts, public.seasons,
  public.price_rules, public.reservations to authenticated;
grant insert, update on public.customers, public.courts, public.seasons,
  public.price_rules to authenticated;
grant update on public.profiles to authenticated;
revoke insert, update, delete on public.reservations from authenticated;

create or replace function public.upsert_reservation(
  p_reservation_id uuid,
  p_customer_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_court_id uuid,
  p_start_at timestamptz,
  p_duration_minutes integer,
  p_with_heating boolean,
  p_status text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_customer_id uuid;
  resolved_season_id uuid;
  resolved_price_rule_id uuid;
  resolved_price numeric(10,2);
  resolved_end_at timestamptz;
  selected_court public.courts%rowtype;
  result_id uuid;
begin
  if not private.is_active_staff() then
    raise exception 'Nuk keni qasje aktive në dashboard.' using errcode = '42501';
  end if;

  if nullif(trim(p_first_name), '') is null
    or nullif(trim(p_last_name), '') is null
    or nullif(trim(p_phone), '') is null then
    raise exception 'Emri, mbiemri dhe telefoni janë të detyrueshëm.' using errcode = '22023';
  end if;

  if p_duration_minutes <= 0 then
    raise exception 'Kohëzgjatja nuk është valide.' using errcode = '22023';
  end if;

  if p_status not in ('pending', 'confirmed', 'completed', 'cancelled') then
    raise exception 'Statusi nuk është valid.' using errcode = '22023';
  end if;

  select * into selected_court
  from public.courts
  where id = p_court_id and is_active = true;

  if not found then
    raise exception 'Fusha nuk ekziston ose nuk është aktive.' using errcode = '22023';
  end if;

  if p_with_heating and (
    selected_court.court_type <> 'indoor' or selected_court.supports_heating = false
  ) then
    raise exception 'Kjo fushë nuk mbështet ngrohje.' using errcode = '22023';
  end if;

  resolved_end_at := p_start_at + make_interval(mins => p_duration_minutes);

  select id into resolved_season_id
  from public.seasons
  where is_active = true
    and (p_start_at at time zone 'Europe/Belgrade')::date between starts_on and ends_on
  limit 1;

  if resolved_season_id is null then
    raise exception 'Nuk ka sezon aktiv për datën e zgjedhur.' using errcode = '22023';
  end if;

  if p_customer_id is null then
    insert into public.customers (first_name, last_name, phone, email, created_by)
    values (
      trim(p_first_name), trim(p_last_name), trim(p_phone),
      nullif(trim(p_email), ''), auth.uid()
    )
    returning id into resolved_customer_id;
  else
    update public.customers
    set first_name = trim(p_first_name),
        last_name = trim(p_last_name),
        phone = trim(p_phone),
        email = nullif(trim(p_email), '')
    where id = p_customer_id
    returning id into resolved_customer_id;

    if resolved_customer_id is null then
      raise exception 'Klienti nuk ekziston.' using errcode = '22023';
    end if;
  end if;

  select id, price into resolved_price_rule_id, resolved_price
  from public.price_rules
  where season_id = resolved_season_id
    and court_type = selected_court.court_type
    and with_heating = p_with_heating
    and duration_minutes = p_duration_minutes
    and is_active = true
  limit 1;

  if resolved_price_rule_id is null then
    raise exception 'Nuk ka çmim aktiv për këtë kombinim.' using errcode = '22023';
  end if;

  if p_reservation_id is null then
    insert into public.reservations (
      customer_id, court_id, season_id, price_rule_id,
      start_at, end_at, with_heating, status, price, notes, created_by
    )
    values (
      resolved_customer_id, p_court_id, resolved_season_id,
      resolved_price_rule_id, p_start_at,
      resolved_end_at, p_with_heating, p_status, resolved_price,
      nullif(trim(p_notes), ''), auth.uid()
    )
    returning id into result_id;
  else
    update public.reservations
    set customer_id = resolved_customer_id,
        court_id = p_court_id,
        season_id = resolved_season_id,
        price_rule_id = resolved_price_rule_id,
        start_at = p_start_at,
        end_at = resolved_end_at,
        with_heating = p_with_heating,
        status = p_status,
        price = resolved_price,
        notes = nullif(trim(p_notes), '')
    where id = p_reservation_id
    returning id into result_id;

    if result_id is null then
      raise exception 'Rezervimi nuk ekziston.' using errcode = '22023';
    end if;
  end if;

  return result_id;
exception
  when exclusion_violation then
    raise exception 'Fusha është e rezervuar në këtë interval.' using errcode = '23P01';
end;
$$;

revoke all on function public.upsert_reservation(
  uuid, uuid, text, text, text, text, uuid, timestamptz,
  integer, boolean, text, text
) from public, anon;
grant execute on function public.upsert_reservation(
  uuid, uuid, text, text, text, text, uuid, timestamptz,
  integer, boolean, text, text
) to authenticated;

create or replace function public.cancel_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_active_staff() then
    raise exception 'Nuk keni qasje aktive në dashboard.' using errcode = '42501';
  end if;

  update public.reservations
  set status = 'cancelled'
  where id = p_reservation_id
    and status <> 'cancelled';

  if not found then
    raise exception 'Rezervimi nuk ekziston ose është anuluar.' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.cancel_reservation(uuid) from public, anon;
grant execute on function public.cancel_reservation(uuid) to authenticated;

commit;
