-- ============================================================
--  LIFE OS - public showcase profile (opt-in).
--  A user can turn on a public page /p/<slug> showing selected
--  aggregate achievements. Off by default. No diary content.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists public_profile (
  user_id    uuid primary key,
  slug       text unique,
  enabled    boolean default false,
  bio        text,
  blocks     jsonb,
  updated_at timestamptz default now()
);
create index if not exists public_profile_slug_idx on public_profile (slug);

alter table if exists public_profile enable row level security;
