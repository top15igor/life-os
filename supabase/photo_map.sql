-- ============================================================
--  LIFE MAP: photos become points on a map.
--
--  A photo already lives in "memories". Here we add the three
--  things a map needs: where it was taken, how that place is
--  called, and when the shutter clicked (EXIF time, which can
--  be much older than the upload time).
--
--  geo_source says where the coordinates came from:
--    'exif'     - read from the file itself (photo sent as a
--                 file, or uploaded on the web);
--    'telegram' - the user sent a location pin next to it;
--    'caption'  - the place was named in the caption and
--                 geocoded;
--    'manual'   - set by hand.
--
--  Safe to run more than once.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

alter table if exists memories add column if not exists lat double precision;
alter table if exists memories add column if not exists lng double precision;
alter table if exists memories add column if not exists place_name text;
alter table if exists memories add column if not exists geo_source text;
alter table if exists memories add column if not exists shot_at timestamptz;

-- The map asks one question only: "give me every point of mine".
create index if not exists memories_map_idx on memories (user_id, shot_at desc) where lat is not null;

-- Photo archive (photo module, optional): the same personal comment
-- as on a memory, so a point behaves the same way wherever it came from.
alter table if exists photos add column if not exists note text;
