-- Direct message relay between LIFE OS users via the bot.
-- relay_off lets a user turn off incoming relayed messages.
alter table if exists users add column if not exists relay_off boolean default false;

-- Log of relayed messages (for rate-limiting and abuse audit).
create table if not exists message_relays (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null,
  to_user uuid not null,
  body text,
  created_at timestamptz default now()
);
create index if not exists message_relays_from_idx on message_relays (from_user, created_at desc);
alter table if exists message_relays enable row level security;
