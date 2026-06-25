-- ============================================================
--  LIFE OS — учёт расхода AI (для экономики/подписки)
--  Логирует токены и примерную стоимость каждого AI-вызова.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  kind       text,                 -- analyze | transcribe | biographer | overview | intent | intelligence | summarize
  tokens_in  int default 0,
  tokens_out int default 0,
  cost_cents numeric default 0,
  created_at timestamptz default now()
);
create index if not exists usage_user_idx on usage (user_id, created_at desc);

alter table if exists usage enable row level security;
