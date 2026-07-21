-- Geo data for places: coordinates cached once per place, so we geocode each
-- name only a single time. Also doubles as a quality signal: geo_status
-- 'notfound' usually means the extracted "place" is not a real location.
-- Idempotent.

alter table places add column if not exists lat double precision;
alter table places add column if not exists lng double precision;
alter table places add column if not exists country text;
alter table places add column if not exists formatted text;
alter table places add column if not exists geo_status text;      -- 'ok' | 'notfound' | 'error'
alter table places add column if not exists geocoded_at timestamptz;

create index if not exists places_geo_idx on places (user_id, geo_status);
