-- Personal knowledge base: saved content imported from Instagram (and later other sources).
-- AI extracts a clean title/topic/summary/key points/tags from the caption and the reel audio transcript,
-- so the user can later ask "how to build a house" and get answers from their own saved material.
create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  source text default 'instagram',  -- instagram / (future: tiktok/youtube/web)
  url text,
  shortcode text,
  author text,
  kind text default 'post',         -- post / reel
  folder text,                      -- instagram collection/folder name (used by bulk import later)
  title text,
  topic text,                       -- broad subject, e.g. "Building a house"
  summary text,                     -- 2-4 sentences: what useful info this contains
  key_points jsonb,                 -- string[] of practical takeaways
  tags text[],
  caption text,                     -- original post caption
  transcript text,                  -- Whisper transcript of the reel audio (if video)
  image_url text,                   -- thumbnail stored in the 'saved' bucket
  status text default 'ok',         -- ok / review (low confidence / empty content)
  created_at timestamptz default now()
);
create index if not exists saved_items_user_idx on saved_items (user_id, created_at desc);
alter table if exists saved_items enable row level security;

-- Public thumbnail storage (uploaded with the server key).
insert into storage.buckets (id, name, public)
values ('saved', 'saved', true)
on conflict (id) do nothing;
