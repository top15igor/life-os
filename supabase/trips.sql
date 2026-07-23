-- Travel diary: chronology of trips with photos and linked diary entries.
-- A trip = destination + date range + story + photos (public URLs from the
-- "memories" bucket). Entries are linked via trip_entries.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  destination text,
  country text,
  emoji text,
  date_start date,
  date_end date,
  status text not null default 'past', -- 'past' | 'planned'
  story text,
  cover_url text,
  photos jsonb, -- array of image URLs
  created_at timestamptz default now()
);
create index if not exists trips_user_idx on trips (user_id, date_start desc);

create table if not exists trip_entries (
  trip_id uuid not null references trips(id) on delete cascade,
  entry_id uuid not null references entries(id) on delete cascade,
  primary key (trip_id, entry_id)
);

-- Dismissed auto-suggestions (key = place|date_start) so they do not reappear.
create table if not exists trip_dismissed (
  user_id uuid not null,
  key text not null,
  primary key (user_id, key)
);

alter table if exists trips enable row level security;
alter table if exists trip_entries enable row level security;
alter table if exists trip_dismissed enable row level security;
