-- Individual bug reports from testers. Owner rates each ($5 / $10 / reject).
-- Run in Supabase after tester_mode.sql.

create table if not exists tester_bugs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  day        date,
  text       text not null,
  status     text not null default 'new',   -- new | paid | rejected
  payout     int  not null default 0,        -- 0 / 5 / 10 (set by owner)
  created_at timestamptz default now(),
  reviewed_at timestamptz
);
create index if not exists tester_bugs_user_idx on tester_bugs (user_id, created_at desc);
alter table if exists tester_bugs enable row level security;
