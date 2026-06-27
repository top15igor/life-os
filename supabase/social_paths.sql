-- ============================================================
--  LIFE OS Social - Phase 2: Paths (long-running journeys).
--  A path groups published pages into a story with a timeline.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists paths (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  description text,
  emoji       text,
  accent      text default 'indigo',
  status      text default 'active',   -- active | done
  public      boolean default false,
  created_at  timestamptz default now()
);
create index if not exists paths_user_idx on paths (user_id, created_at desc);

-- связь опубликованной страницы с путём
alter table if exists public_pages add column if not exists path_id uuid;
create index if not exists public_pages_path_idx on public_pages (path_id);

alter table if exists paths enable row level security;
