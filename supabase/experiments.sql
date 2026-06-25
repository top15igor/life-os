-- ============================================================
--  LIFE OS — LIFE LAB: эксперименты над собственной жизнью
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists experiments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  title         text not null,
  hypothesis    text,
  duration_days int default 21,
  start_date    date default current_date,
  status        text default 'active',   -- active | done
  result        jsonb,
  created_at    timestamptz default now()
);
create index if not exists experiments_user_idx on experiments (user_id, status, created_at desc);
