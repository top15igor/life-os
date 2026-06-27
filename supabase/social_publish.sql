-- ============================================================
--  LIFE OS Social - Phase 1: published pages (public book).
--  An entry the user chose to publish (with an AI-prepared public
--  version). Separate table -> core entry queries are untouched.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists public_pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  entry_id   uuid not null,
  title      text,
  text       text,
  privacy    text default 'public',   -- 'link' | 'public'
  created_at timestamptz default now(),
  unique (entry_id)
);
create index if not exists public_pages_user_idx on public_pages (user_id, created_at desc);

alter table if exists public_pages enable row level security;
