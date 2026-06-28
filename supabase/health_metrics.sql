-- ============================================================
--  LIFE OS - Apple Health daily metrics (steps, sleep, heart rate).
--  Filled by two routes:
--    * /api/health-sync   - Apple Shortcuts webhook (token auth)
--    * /api/health-import - manual upload of the Health export.zip
--  One row per (user, day); partial upserts keep existing fields.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists health_metrics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  day          date not null,
  steps        int,            -- total steps for the day
  active_kcal  numeric,        -- active energy burned, kcal
  distance_km  numeric,        -- walking + running distance, km
  sleep_hours  numeric,        -- total time asleep that night
  hr_avg       int,            -- average heart rate, bpm
  hr_resting   int,            -- resting heart rate, bpm
  hrv          numeric,        -- heart rate variability SDNN, ms
  source       text,           -- 'shortcut' | 'import'
  updated_at   timestamptz default now(),
  unique (user_id, day)
);
create index if not exists health_metrics_user_idx on health_metrics (user_id, day);

alter table if exists health_metrics enable row level security;
