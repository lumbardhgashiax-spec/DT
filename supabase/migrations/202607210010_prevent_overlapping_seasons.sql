-- Seasons may touch at their boundaries only when their dates do not overlap.
-- The inclusive range reflects that both starts_on and ends_on are bookable dates.
begin;

create extension if not exists btree_gist;

do $$
begin
  if exists (
    select 1
    from public.seasons left_season
    join public.seasons right_season
      on left_season.id < right_season.id
     and daterange(left_season.starts_on, left_season.ends_on, '[]')
         && daterange(right_season.starts_on, right_season.ends_on, '[]')
  ) then
    raise exception 'Sezonet ekzistuese mbivendosen. Rregullo datat para se te shtosh kufizimin.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'seasons_no_overlapping_date_ranges'
      and conrelid = 'public.seasons'::regclass
  ) then
    alter table public.seasons
      add constraint seasons_no_overlapping_date_ranges
      exclude using gist (
        daterange(starts_on, ends_on, '[]') with &&
      );
  end if;
end;
$$;

commit;
