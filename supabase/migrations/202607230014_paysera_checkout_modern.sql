-- Paysera Checkout Modern payment state, idempotency, and verified webhook processing.

begin;

-- Keep this migration self-contained so an environment that predates public
-- booking references can apply the Paysera checkout schema in one transaction.
create sequence if not exists public.reservation_reference_seq;

alter table public.reservations
  add column if not exists booking_reference text;

update public.reservations
set booking_reference = 'DT-' || lpad(nextval('public.reservation_reference_seq')::text, 8, '0')
where booking_reference is null;

alter table public.reservations
  alter column booking_reference
    set default ('DT-' || lpad(nextval('public.reservation_reference_seq')::text, 8, '0')),
  alter column booking_reference set not null;

create unique index if not exists reservations_booking_reference_key
  on public.reservations (booking_reference);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique
    references public.reservations(id) on delete restrict,
  checkout_request_id uuid not null unique,
  request_fingerprint text not null
    check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  provider text not null default 'paysera'
    check (provider = 'paysera'),
  provider_order_id text unique,
  provider_link_id text unique,
  checkout_url text,
  status text not null default 'initializing'
    check (status in (
      'initializing', 'pending', 'paid', 'failed', 'cancelled',
      'expired', 'refunded', 'chargeback', 'review'
    )),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  expires_at timestamptz not null,
  paid_at timestamptz,
  provider_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  callback_id text not null unique,
  request_id text,
  provider_order_id text not null,
  event_type text not null,
  event_name text not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  provider_created_at timestamptz,
  processed_status text not null,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_transactions_status_expires_idx
  on public.payment_transactions (status, expires_at);
create index if not exists payment_transactions_provider_order_idx
  on public.payment_transactions (provider_order_id);
create index if not exists payment_webhook_events_order_idx
  on public.payment_webhook_events (provider_order_id, created_at desc);

alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on public.payment_transactions from public, anon, authenticated;
revoke all on public.payment_webhook_events from public, anon, authenticated;
grant select, insert, update on public.payment_transactions to service_role;
grant select, insert on public.payment_webhook_events to service_role;

drop trigger if exists set_updated_at on public.payment_transactions;
create trigger set_updated_at
  before update on public.payment_transactions
  for each row execute procedure private.set_updated_at();

create or replace function public.release_expired_paysera_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  released_count integer;
begin
  with expired as (
    update public.payment_transactions
    set status = 'expired'
    where status in ('initializing', 'pending')
      and expires_at <= now()
    returning reservation_id
  ),
  released as (
    update public.reservations r
    set status = 'cancelled'
    where r.status = 'pending'
      and r.id in (select reservation_id from expired)
    returning r.id
  )
  select count(*)::integer into released_count from released;

  return released_count;
end;
$$;

create or replace function public.register_paysera_checkout(
  p_checkout_request_id uuid,
  p_request_fingerprint text,
  p_booking_reference text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_court_id uuid,
  p_season_id uuid,
  p_price_rule_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_total_price numeric,
  p_amount_minor integer,
  p_currency text,
  p_extra_service_ids uuid[],
  p_expires_at timestamptz
)
returns table (
  reservation_id uuid,
  booking_reference text,
  payment_id uuid,
  payment_status text,
  provider_order_id text,
  provider_link_id text,
  checkout_url text,
  created_at timestamptz,
  created_new boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_payment public.payment_transactions%rowtype;
  new_customer_id uuid;
  new_reservation_id uuid;
  new_payment_id uuid;
  reservation_created_at timestamptz;
begin
  if p_request_fingerprint !~ '^[0-9a-f]{64}$'
    or p_amount_minor <= 0
    or p_currency !~ '^[A-Z]{3}$'
    or p_end_at <= p_start_at
    or p_expires_at <= now() then
    raise exception 'Invalid checkout data.' using errcode = '22023';
  end if;

  select * into existing_payment
  from public.payment_transactions
  where checkout_request_id = p_checkout_request_id;

  if found then
    if existing_payment.request_fingerprint <> p_request_fingerprint then
      raise exception 'Checkout request cannot be reused.' using errcode = '22023';
    end if;

    return query
    select
      r.id,
      r.booking_reference,
      existing_payment.id,
      existing_payment.status,
      existing_payment.provider_order_id,
      existing_payment.provider_link_id,
      existing_payment.checkout_url,
      r.created_at,
      false
    from public.reservations r
    where r.id = existing_payment.reservation_id;
    return;
  end if;

  insert into public.customers (
    first_name, last_name, phone, email, created_by
  )
  values (
    trim(p_first_name), trim(p_last_name), trim(p_phone),
    nullif(trim(p_email), ''), null
  )
  returning id into new_customer_id;

  insert into public.reservations as r (
    booking_reference, customer_id, court_id, season_id, price_rule_id,
    start_at, end_at, with_heating, status, price, notes, created_by
  )
  values (
    p_booking_reference, new_customer_id, p_court_id, p_season_id,
    p_price_rule_id, p_start_at, p_end_at, false, 'pending',
    p_total_price, null, null
  )
  returning r.id, r.created_at
  into new_reservation_id, reservation_created_at;

  insert into public.reservation_extra_services (
    reservation_id, extra_service_id, service_name, unit_price
  )
  select
    new_reservation_id, es.id, es.name, es.price
  from public.extra_services es
  where es.id = any(coalesce(p_extra_service_ids, array[]::uuid[]))
    and es.is_active = true;

  insert into public.payment_transactions (
    reservation_id, checkout_request_id, request_fingerprint,
    amount_minor, currency, expires_at
  )
  values (
    new_reservation_id, p_checkout_request_id, p_request_fingerprint,
    p_amount_minor, upper(p_currency), p_expires_at
  )
  returning id into new_payment_id;

  return query
  select
    new_reservation_id,
    p_booking_reference,
    new_payment_id,
    'initializing'::text,
    null::text,
    null::text,
    null::text,
    reservation_created_at,
    true;
exception
  when exclusion_violation then
    raise exception 'The selected court is no longer available.'
      using errcode = '23P01';
end;
$$;

create or replace function public.set_paysera_checkout_details(
  p_payment_id uuid,
  p_provider_order_id text,
  p_provider_link_id text,
  p_checkout_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payment_transactions
  set provider_order_id = p_provider_order_id,
      provider_link_id = p_provider_link_id,
      checkout_url = p_checkout_url,
      status = 'pending',
      provider_updated_at = now()
  where id = p_payment_id
    and status = 'initializing';

  if not found then
    raise exception 'Checkout session is not available.'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function public.fail_paysera_checkout(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_reservation_id uuid;
begin
  update public.payment_transactions
  set status = 'failed',
      provider_updated_at = now()
  where id = p_payment_id
    and status in ('initializing', 'pending')
  returning reservation_id into linked_reservation_id;

  if linked_reservation_id is not null then
    update public.reservations
    set status = 'cancelled'
    where id = linked_reservation_id
      and status = 'pending';
  end if;
end;
$$;

create or replace function public.process_paysera_webhook(
  p_callback_id text,
  p_request_id text,
  p_provider_order_id text,
  p_merchant_order_id text,
  p_event_type text,
  p_event_name text,
  p_payload_sha256 text,
  p_provider_created_at timestamptz,
  p_provider_status text,
  p_amount_minor integer,
  p_amount_paid_minor integer,
  p_currency text,
  p_is_test boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_row public.payment_transactions%rowtype;
  reservation_row public.reservations%rowtype;
  result_status text;
begin
  select * into payment_row
  from public.payment_transactions
  where provider_order_id = p_provider_order_id
  for update;

  if not found then
    raise exception 'Payment order was not found.' using errcode = 'P0002';
  end if;

  select * into reservation_row
  from public.reservations
  where id = payment_row.reservation_id
  for update;

  if reservation_row.booking_reference <> p_merchant_order_id
    or payment_row.amount_minor <> p_amount_minor
    or payment_row.currency <> upper(p_currency) then
    raise exception 'Payment order verification failed.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.payment_webhook_events
    where callback_id = p_callback_id
  ) then
    return payment_row.status;
  end if;

  result_status := payment_row.status;

  if p_provider_status = 'paid'
    and p_amount_paid_minor >= payment_row.amount_minor then
    if reservation_row.status = 'pending' then
      update public.reservations
      set status = 'confirmed'
      where id = reservation_row.id;
      result_status := 'paid';
    elsif reservation_row.status in ('confirmed', 'completed') then
      result_status := 'paid';
    else
      result_status := 'review';
    end if;

    update public.payment_transactions
    set status = result_status,
        paid_at = case when result_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
        provider_updated_at = now()
    where id = payment_row.id;
  elsif p_provider_status in ('canceled', 'closed') then
    result_status := 'cancelled';
    update public.payment_transactions
    set status = result_status,
        provider_updated_at = now()
    where id = payment_row.id
      and status <> 'paid';

    update public.reservations
    set status = 'cancelled'
    where id = reservation_row.id
      and status = 'pending';
  elsif p_provider_status in ('refunded', 'chargeback') then
    result_status := p_provider_status;
    update public.payment_transactions
    set status = result_status,
        provider_updated_at = now()
    where id = payment_row.id;

    update public.reservations
    set status = 'cancelled'
    where id = reservation_row.id
      and status in ('pending', 'confirmed');
  end if;

  insert into public.payment_webhook_events (
    callback_id, request_id, provider_order_id, event_type, event_name,
    payload_sha256, provider_created_at, processed_status, is_test
  )
  values (
    p_callback_id, nullif(p_request_id, ''), p_provider_order_id,
    p_event_type, p_event_name, p_payload_sha256, p_provider_created_at,
    result_status, coalesce(p_is_test, false)
  );

  return result_status;
end;
$$;

revoke all on function public.release_expired_paysera_holds() from public, anon, authenticated;
revoke all on function public.register_paysera_checkout(
  uuid, text, text, text, text, text, text, uuid, uuid, uuid,
  timestamptz, timestamptz, numeric, integer, text, uuid[], timestamptz
) from public, anon, authenticated;
revoke all on function public.set_paysera_checkout_details(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.fail_paysera_checkout(uuid)
  from public, anon, authenticated;
revoke all on function public.process_paysera_webhook(
  text, text, text, text, text, text, text, timestamptz,
  text, integer, integer, text, boolean
) from public, anon, authenticated;

grant execute on function public.release_expired_paysera_holds() to service_role;
grant execute on function public.register_paysera_checkout(
  uuid, text, text, text, text, text, text, uuid, uuid, uuid,
  timestamptz, timestamptz, numeric, integer, text, uuid[], timestamptz
) to service_role;
grant execute on function public.set_paysera_checkout_details(uuid, text, text, text)
  to service_role;
grant execute on function public.fail_paysera_checkout(uuid) to service_role;
grant execute on function public.process_paysera_webhook(
  text, text, text, text, text, text, text, timestamptz,
  text, integer, integer, text, boolean
) to service_role;

commit;
