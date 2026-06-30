-- Anticipation nudges (proactive "Jarvis noticed ..."). One per user per day,
-- cached so we don't recompute or spam. Idempotent.

create table if not exists anticipations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day date not null,
  kind text,
  text text,            -- null = computed, nothing worth sending today
  dismissed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, day)
);
create index if not exists anticipations_user_idx on anticipations (user_id, day);
alter table anticipations enable row level security;
