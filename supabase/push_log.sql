-- ============================================================
--  LIFE OS — журнал пушей и отклика на них (аналитика вовлечённости).
--  Пишем факт отправки; когда пользователь отвечает (любым сообщением)
--  в течение 12 часов — помечаем responded=true. Данные копятся для
--  будущей авто-подстройки тем/времени.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists push_log (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null,
  kind      text not null,                 -- 'morning' | 'evening' | 'weekly'
  sent_at   timestamptz default now(),
  responded boolean default false
);

create index if not exists push_log_user_idx on push_log (user_id, sent_at desc);
