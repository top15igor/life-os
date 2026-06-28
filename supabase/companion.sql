-- AI companion: chat mode flag + conversation memory for the Telegram bot.

-- Per-user flag: is the user currently in /chat conversation mode?
alter table if exists users add column if not exists chat_mode boolean default false;

-- Rolling conversation history (one row per turn).
create table if not exists companion_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists companion_messages_user_idx on companion_messages (user_id, created_at);

alter table if exists companion_messages enable row level security;
