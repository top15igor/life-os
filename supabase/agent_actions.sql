-- Journal of everything the agent changed or removed, with enough detail to undo it.
--
-- WHY: commands like "remove that task", "this belongs in the vault", "it was 300,
-- not 500" delete or overwrite data permanently. The router is right most of the
-- time — but we have watched it misfire, and a misfire used to mean silent,
-- irreversible loss. Now every destructive step is written down first and can be
-- taken back with "отмени последнее".
--
-- payload holds the row as it was, so restoring needs no guesswork.
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- Without this table the bot still works: it simply cannot undo, and says so.

create table if not exists agent_actions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  kind       text not null,        -- delete_task | delete_note | delete_goal | move_to_vault | move_to_diary | fix_finance | remove_finance
  summary    text not null,        -- plain words: what was done, for the journal and the undo reply
  payload    jsonb not null,       -- everything needed to put it back
  undone     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists agent_actions_user_idx on agent_actions (user_id, created_at desc);
create index if not exists agent_actions_undo_idx on agent_actions (user_id, undone, created_at desc);

alter table if exists agent_actions enable row level security;
