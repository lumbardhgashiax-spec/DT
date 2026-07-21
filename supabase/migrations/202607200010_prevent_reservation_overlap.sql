-- Diamond Tennis Academy - blloko rezervimet që përplasen në të njëjtën fushë
-- Nuk krijon tabelë dhe nuk ndryshon të dhëna ekzistuese.
-- Nëse ke tashmë rezervime që përplasen, zgjidh/anulo njërin prej tyre para ekzekutimit.

begin;

create extension if not exists btree_gist with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reservations'::regclass
      and conname = 'reservations_no_time_overlap'
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

commit;
