-- Failure journal.
--
-- Until now every crash went to console.error and dissolved in the Vercel logs:
-- there was no way to learn that voice transcription failed for five people
-- yesterday. With this table the diagnosis agent can say "twelve users, this
-- exact step, started at 14:20" instead of "there are some errors".
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Everything degrades gracefully without it: the bot keeps working, errors keep
-- going to the Vercel logs, there is simply no history to analyse.

create table if not exists error_log (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null,          -- where it broke: bot:voice, bot:acquaint, cron:evening...
  message    text not null,
  stack      text,
  user_id    uuid,
  chat_id    bigint,
  detail     text,
  created_at timestamptz not null default now()
);

create index if not exists error_log_time_idx  on error_log (created_at desc);
create index if not exists error_log_scope_idx on error_log (scope, created_at desc);

alter table if exists error_log enable row level security;
