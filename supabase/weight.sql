-- ============================================================
--  LIFE OS — трекер веса: замеры по датам + цель.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists weight_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  day        date not null,
  kg         numeric not null,
  created_at timestamptz default now(),
  unique (user_id, day)
);
create index if not exists weight_log_user_idx on weight_log (user_id, day);

create table if not exists weight_goal (
  user_id     uuid primary key,
  target_kg   numeric,
  target_date date,
  start_kg    numeric,
  start_date  date,
  updated_at  timestamptz default now()
);

alter table if exists weight_log  enable row level security;
alter table if exists weight_goal enable row level security;
