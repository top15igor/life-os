-- Google Calendar integration (LIFE OS -> Google Calendar, one-way).
-- Idempotent. Safe to run multiple times.

-- Per-user Google Calendar connection (offline refresh token).
alter table users add column if not exists google_refresh_token text;

-- Manual reminders created inside LIFE OS. They live here regardless of
-- calendar connection; when connected they also become a Google Calendar event.
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  due_at timestamptz not null,
  gcal_event_id text,
  gcal_link text,
  done boolean default false,
  created_at timestamptz default now()
);
create index if not exists reminders_user_due_idx on reminders (user_id, due_at);

-- Generic link table: maps an existing LIFE OS item (task / deed / promise)
-- to the Google Calendar event created for it, so we can show "in calendar"
-- and remove it later. One event per (user, kind, ref).
create table if not exists calendar_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,            -- 'task' | 'deed' | 'promise'
  ref_id text not null,
  event_id text not null,
  html_link text,
  due_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, kind, ref_id)
);
create index if not exists calendar_links_user_idx on calendar_links (user_id, kind);

-- RLS on (service_role bypasses; no public policies = no anon access).
alter table reminders enable row level security;
alter table calendar_links enable row level security;
