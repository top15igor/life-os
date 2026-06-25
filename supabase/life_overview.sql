-- ============================================================
--  LIFE OS — кэш раздела «Что заметил AI» (Life Intelligence)
--  Чтобы страница открывалась мгновенно, а не считалась заново.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists life_overview (
  user_id     uuid primary key,
  day         date,
  entry_count int,
  data        jsonb,
  updated_at  timestamptz default now()
);
