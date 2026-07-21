begin;

-- Ky migration fshin në mënyrë të pakthyeshme modulet komerciale dhe të dhënat e tyre.
drop function if exists public.sell_customer_package(uuid, uuid, date, uuid[]);
drop function if exists public.upsert_reservation(
  uuid, uuid, text, text, text, text, uuid, timestamptz,
  integer, boolean, uuid, text, text
);

alter table public.reservations drop column if exists customer_package_id;
drop table if exists public.package_members cascade;
drop table if exists public.customer_packages cascade;
drop table if exists public.offers cascade;

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

  if p_customer_id is null then
    insert into public.customers (first_name, last_name, phone, email, created_by)
    values (
      trim(p_first_name), trim(p_last_name), trim(p_phone),
      nullif(trim(p_email), ''), auth.uid()
    ) returning id into resolved_customer_id;
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

  if p_reservation_id is null then
    insert into public.reservations (
      customer_id, court_id, season_id, price_rule_id,
      start_at, end_at, with_heating, status, price, notes, created_by
    ) values (
      resolved_customer_id, p_court_id, resolved_season_id, resolved_price_rule_id,
      p_start_at, resolved_end_at, p_with_heating, p_status, resolved_price,
      nullif(trim(p_notes), ''), auth.uid()
    ) returning id into result_id;
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

commit;
