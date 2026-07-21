-- Diamond Tennis Academy - koordinatat gjeografike të fushave
-- Ekzekutoje pas migrimeve ekzistuese në Supabase SQL Editor.

begin;

alter table public.courts
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);

alter table public.courts
  drop constraint if exists courts_latitude_range,
  add constraint courts_latitude_range
    check (latitude is null or latitude between -90 and 90),
  drop constraint if exists courts_longitude_range,
  add constraint courts_longitude_range
    check (longitude is null or longitude between -180 and 180),
  drop constraint if exists courts_coordinates_pair,
  add constraint courts_coordinates_pair
    check ((latitude is null) = (longitude is null));

commit;
