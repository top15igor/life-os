-- ============================================================
--  LIFE OS - acquisition channels (tagged bot links)
--  Links look like t.me/<bot>?start=src_<slug>; the bot stores
--  the slug in users.source for new users.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

alter table users add column if not exists source text;

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  cost numeric default 0,
  created_at timestamptz default now()
);

alter table if exists channels enable row level security;
