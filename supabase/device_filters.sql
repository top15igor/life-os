-- Always-on wearables (Omi and the like) send EVERY conversation of the day.
-- Without rules that would bury the diary in noise, so the filtering happens
-- here, on our side: the device just delivers, LIFE OS decides what to keep.
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

-- Rules per device.
alter table devices add column if not exists filter_mode text not null default 'all';
-- 'all'     - keep everything (a button device: every press is intentional)
-- 'trigger' - keep only what follows a spoken trigger phrase
-- 'ai'      - a model decides whether it belongs in a diary

alter table devices add column if not exists trigger_phrases text;        -- comma separated
alter table devices add column if not exists min_words int not null default 4;
alter table devices add column if not exists only_me boolean not null default true;
alter table devices add column if not exists quiet_from int;              -- local hour, inclusive
alter table devices add column if not exists quiet_to int;                -- local hour, exclusive

-- Everything an always-on device delivered, kept or dropped, with the reason.
-- Doubles as the debug view on day one and as the quarantine shelf later.
create table if not exists device_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_id uuid not null,
  external_id text,            -- source's own id, so a redelivery is not a duplicate
  text text,
  spoken_at timestamptz,       -- when it was actually said
  decision text not null,      -- 'saved' | 'filtered'
  reason text,                 -- why it was dropped
  entry_id uuid,               -- the diary entry, when kept
  raw jsonb,                   -- what arrived, for working out the format
  created_at timestamptz default now()
);

create index if not exists device_inbox_user_idx on device_inbox (user_id, created_at desc);
create index if not exists device_inbox_device_idx on device_inbox (device_id, created_at desc);
create unique index if not exists device_inbox_ext_idx
  on device_inbox (device_id, external_id) where external_id is not null;

alter table if exists device_inbox enable row level security;
