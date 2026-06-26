-- ============================================================
--  LIFE OS — кэш блока «Здоровье сейчас» на вкладке Самочувствие.
--  Чтобы главная проблема + цели считались AI раз в день, а не на каждый заход.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
--  (Код работает и без таблицы — просто будет считать вживую каждый раз.)
-- ============================================================

create table if not exists health_focus (
  user_id     uuid primary key,
  day         date,
  entry_count int,
  data        jsonb,
  updated_at  timestamptz default now()
);
