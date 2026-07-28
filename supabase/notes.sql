-- ============================================================
--  LIFE OS - quick reference notes ("zametki")
--  Facts the user wants to FIND later (codes, sizes, addresses,
--  lists) - separate from diary entries. Bot actions: save_note /
--  find_note; web screen: /notes.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_idx on notes (user_id, pinned desc, created_at desc);

alter table notes enable row level security;
