-- Tester mode: opt-in flag + daily test reports.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

alter table users add column if not exists tester boolean not null default false;

create table if not exists tester_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  day        date not null,
  entries    int,              -- how many diary entries that day
  checklist  jsonb,            -- [{ key, result: 'ok' | 'bug' | 'skip' }]
  bugs       text,             -- free-text bugs found
  notes      text,             -- anything else
  updated_at timestamptz default now(),
  unique (user_id, day)
);
create index if not exists tester_reports_day_idx on tester_reports (day desc);
alter table if exists tester_reports enable row level security;
