-- Ensure production public bookings always have a customer-facing reference.
begin;

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

commit;
