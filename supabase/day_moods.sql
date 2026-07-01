-- Mood calendar: one stored mood per user per day.
-- Used for manual corrections and one-tap mood check from the bot.
-- Display precedence: this override wins over AI-extracted mood from entries.

create table if not exists day_moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  mood int not null check (mood between 1 and 10),
  source text not null default 'manual', -- 'manual' | 'bot'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists day_moods_user_day on day_moods (user_id, day);
