-- ============================================================
--  LIFE OS — реферальная связь (кто кого пригласил)
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

alter table users add column if not exists referred_by uuid;
create index if not exists users_referred_by_idx on users (referred_by);
