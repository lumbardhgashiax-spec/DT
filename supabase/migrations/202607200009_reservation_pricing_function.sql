-- Diamond Tennis Academy - funksioni i rezervimeve me çmime direkte
-- Ky SQL NUK krijon, fshin ose ndryshon asnjë tabelë.

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

create or replace function public.upsert_reservation(
  p_reservation_id uuid, p_customer_id uuid, p_first_name text, p_last_name text,
  p_phone text, p_email text, p_court_id uuid, p_start_at timestamptz,
  p_duration_minutes integer, p_with_heating boolean, p_status text, p_notes text,
  p_extra_service_ids uuid[] default array[]::uuid[]
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  resolved_customer_id uuid;
  resolved_season_id uuid;
  resolved_price_rule_id uuid;
  hourly_court_price numeric(10,2);
  hourly_services_price numeric(10,2) := 0;
  resolved_end_at timestamptz;
  result_id uuid;
  selected_count integer;
  active_count integer;
  booked_hours numeric(5,2);
begin
  if not private.is_active_staff() then
    raise exception 'Nuk keni qasje aktive ne dashboard.' using errcode = '42501';
  end if;
  if nullif(trim(p_first_name), '') is null or nullif(trim(p_last_name), '') is null or nullif(trim(p_phone), '') is null then
    raise exception 'Emri, mbiemri dhe telefoni jane te detyrueshem.' using errcode = '22023';
  end if;
  if p_duration_minutes < 60 or p_duration_minutes > 300 or mod(p_duration_minutes, 30) <> 0 then
    raise exception 'Kohezgjatja duhet te jete nga 1 deri ne 5 ore, me intervale prej 30 minutash.' using errcode = '22023';
  end if;
  if p_status not in ('pending', 'confirmed', 'completed', 'cancelled') then
    raise exception 'Statusi nuk eshte valid.' using errcode = '22023';
  end if;
  if p_with_heating then
    raise exception 'Ngrohja zgjidhet te sherbimet shtese.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.courts where id = p_court_id and is_active = true) then
    raise exception 'Fusha nuk ekziston ose nuk eshte aktive.' using errcode = '22023';
  end if;

  booked_hours := p_duration_minutes::numeric / 60;
  resolved_end_at := p_start_at + make_interval(mins => p_duration_minutes);
  select id into resolved_season_id from public.seasons
  where is_active = true and (p_start_at at time zone 'Europe/Belgrade')::date between starts_on and ends_on
  limit 1;
  if resolved_season_id is null then
    raise exception 'Nuk ka sezon aktiv per daten e zgjedhur.' using errcode = '22023';
  end if;

  select pr.id, pr.price into resolved_price_rule_id, hourly_court_price
  from public.price_rules pr join public.courts c on c.id = p_court_id
  where pr.season_id = resolved_season_id and pr.court_type = c.court_type
    and pr.with_heating = false and pr.duration_minutes = 60 and pr.is_active = true
  limit 1;
  if resolved_price_rule_id is null then
    raise exception 'Nuk ka cmim baze aktiv per kete sezon dhe fushe.' using errcode = '22023';
  end if;

  select cardinality(array(select distinct id from unnest(coalesce(p_extra_service_ids, array[]::uuid[])) as id)) into selected_count;
  select count(*), coalesce(sum(price), 0) into active_count, hourly_services_price
  from public.extra_services
  where id = any(coalesce(p_extra_service_ids, array[]::uuid[])) and is_active = true;
  if active_count <> selected_count then
    raise exception 'Nje nga sherbimet e zgjedhura nuk ekziston ose nuk eshte aktiv.' using errcode = '22023';
  end if;

  if p_customer_id is null then
    insert into public.customers (first_name, last_name, phone, email, created_by)
    values (trim(p_first_name), trim(p_last_name), trim(p_phone), nullif(trim(p_email), ''), auth.uid())
    returning id into resolved_customer_id;
  else
    update public.customers
    set first_name = trim(p_first_name), last_name = trim(p_last_name), phone = trim(p_phone), email = nullif(trim(p_email), '')
    where id = p_customer_id returning id into resolved_customer_id;
    if resolved_customer_id is null then raise exception 'Klienti nuk ekziston.' using errcode = '22023'; end if;
  end if;

  if p_reservation_id is null then
    insert into public.reservations (customer_id, court_id, season_id, price_rule_id, start_at, end_at, with_heating, status, price, notes, created_by)
    values (resolved_customer_id, p_court_id, resolved_season_id, resolved_price_rule_id, p_start_at, resolved_end_at, false, p_status, (hourly_court_price + hourly_services_price) * booked_hours, nullif(trim(p_notes), ''), auth.uid())
    returning id into result_id;
  else
    update public.reservations
    set customer_id = resolved_customer_id, court_id = p_court_id, season_id = resolved_season_id, price_rule_id = resolved_price_rule_id,
      start_at = p_start_at, end_at = resolved_end_at, with_heating = false, status = p_status,
      price = (hourly_court_price + hourly_services_price) * booked_hours, notes = nullif(trim(p_notes), '')
    where id = p_reservation_id returning id into result_id;
    if result_id is null then raise exception 'Rezervimi nuk ekziston.' using errcode = '22023'; end if;
  end if;
  return result_id;
exception when exclusion_violation then
  raise exception 'Fusha eshte e rezervuar ne kete interval.' using errcode = '23P01';
end;
$$;

revoke all on function public.upsert_reservation(uuid, uuid, text, text, text, text, uuid, timestamptz, integer, boolean, text, text, uuid[]) from public, anon;
grant execute on function public.upsert_reservation(uuid, uuid, text, text, text, text, uuid, timestamptz, integer, boolean, text, text, uuid[]) to authenticated;

commit;
