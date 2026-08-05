-- History of bot self-test runs.
--
-- Each run of /api/selftest stores its result here. Two reasons:
--   1) the owner is alerted only when the status CHANGES (broke / recovered),
--      so a broken bot does not spam the same alert every 15 minutes;
--   2) the daily diagnosis agent needs history: what fails, how often, since when.
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- The feature degrades gracefully without this table: tests still run and
-- failures are still reported, just without history and change detection.

create table if not exists selftest_runs (
  id         uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  mode       text not null default 'light',   -- light | full
  ok         int  not null default 0,
  failed     int  not null default 0,
  ms         int,
  failures   jsonb,                            -- [{ name, why }]
  created_at timestamptz default now()
);

create index if not exists selftest_runs_time_idx on selftest_runs (started_at desc);

alter table if exists selftest_runs enable row level security;
