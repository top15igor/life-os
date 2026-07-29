-- Wearable devices: a button on the wrist / on a neck strap, an Apple Watch
-- shortcut, a future LTE keyfob. One press -> a voice note lands in LIFE OS
-- even when the phone is not at hand.
--
-- Every device carries its OWN token, so a lost keyfob can be revoked
-- without touching the personal sign-in link of the account.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  kind text not null default 'other', -- 'watch' | 'keyfob' | 'phone' | 'other'
  token text not null unique,
  battery int,                        -- percent, reported by the device
  last_seen timestamptz,
  sent_count int not null default 0,
  created_at timestamptz default now()
);

create index if not exists devices_user_idx on devices (user_id, created_at desc);
create index if not exists devices_token_idx on devices (token);

alter table if exists devices enable row level security;
