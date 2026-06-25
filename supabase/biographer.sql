-- ============================================================
--  LIFE OS — история AI-Биографа (вопросы и ответы)
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists biographer_chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  question   text not null,
  answer     text,
  created_at timestamptz default now()
);
create index if not exists biographer_chats_user_idx on biographer_chats (user_id, created_at desc);
