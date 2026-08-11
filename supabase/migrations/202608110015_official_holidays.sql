-- Official holiday closures managed by active dashboard staff.
-- Public bookings are rejected transactionally, including requests that bypass the UI.

begin;

create table public.official_holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  starts_on date not null,
  ends_on date not null,
  notes text check (notes is null or char_length(notes) <= 500),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_holidays_valid_range check (
    ends_on >= starts_on and ends_on - starts_on <= 30
  ),
  constraint official_holidays_active_no_overlap exclude using gist (
    daterange(starts_on, ends_on, '[]') with &&
  ) where (is_active = true)
);

create index official_holidays_active_dates_idx
  on public.official_holidays (starts_on, ends_on)
  where is_active = true;

create trigger set_updated_at
  before update on public.official_holidays
  for each row execute procedure private.set_updated_at();

alter table public.official_holidays enable row level security;

create policy official_holidays_staff_select on public.official_holidays
  for select to authenticated
  using ((select private.is_active_staff()));

create policy official_holidays_staff_insert on public.official_holidays
  for insert to authenticated
  with check ((select private.is_active_staff()));

create policy official_holidays_staff_update on public.official_holidays
  for update to authenticated
  using ((select private.is_active_staff()))
  with check ((select private.is_active_staff()));

create policy official_holidays_staff_delete on public.official_holidays
  for delete to authenticated
  using ((select private.is_active_staff()));

grant select, insert, update, delete on public.official_holidays to authenticated;
revoke all on public.official_holidays from anon;

create or replace function private.reject_holiday_with_public_reservations()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active and exists (
    select 1
    from public.reservations r
    where r.created_by is null
      and r.status <> 'cancelled'
      and (r.start_at at time zone 'Europe/Belgrade')::date
          between new.starts_on and new.ends_on
  ) then
    raise exception 'HOLIDAY_HAS_PUBLIC_RESERVATIONS'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger reject_holiday_with_public_reservations
  before insert or update of starts_on, ends_on, is_active
  on public.official_holidays
  for each row execute function private.reject_holiday_with_public_reservations();

create or replace function private.block_public_reservation_on_official_holiday()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  holiday_name text;
begin
  if new.created_by is null and new.status <> 'cancelled' then
    select h.name into holiday_name
    from public.official_holidays h
    where h.is_active = true
      and (new.start_at at time zone 'Europe/Belgrade')::date
          between h.starts_on and h.ends_on
    order by h.starts_on
    limit 1;

    if holiday_name is not null then
      raise exception 'OFFICIAL_HOLIDAY:%', holiday_name
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger block_public_reservation_on_official_holiday
  before insert or update of start_at, end_at, status, created_by
  on public.reservations
  for each row execute function private.block_public_reservation_on_official_holiday();

commit;
