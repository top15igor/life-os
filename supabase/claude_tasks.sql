-- Tasks dictated to Claude through LIFE OS.
--
-- Deliberate boundary: a spoken phrase NEVER runs anything by itself. It only
-- lands here as 'new'. The owner taps a button in Telegram, and only then does
-- the task leave for GitHub. The microphone is always on; the trigger is not.
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists claude_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  repo text,                   -- owner/name; null means the default repo
  status text not null default 'new',  -- 'new' | 'sent' | 'cancelled' | 'failed'
  source text,                 -- 'bot' | 'omi' | 'device'
  issue_url text,
  issue_number int,
  error text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create index if not exists claude_tasks_user_idx on claude_tasks (user_id, created_at desc);

alter table if exists claude_tasks enable row level security;
