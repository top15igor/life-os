-- Wishlist: user's wish items (products added by link, with photo and price).
-- Friends can secretly reserve a gift so two people don't buy the same thing.
create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  url text,
  source text,
  title text not null,
  description text,
  image_url text,
  price text,
  currency text,
  note text,
  priority integer default 0,
  status text default 'active',   -- active / bought / archived
  reserved_token text,            -- secret guest-browser token; the owner never sees this
  reserved_name text,
  reserved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists wishes_user_idx on wishes (user_id, priority desc, created_at desc);
alter table if exists wishes enable row level security;

-- Public wishlist toggle (separate from full-profile publish).
alter table if exists public_profile add column if not exists wish_public boolean default false;

-- Public bucket for wishlist images (uploads go through the server key).
insert into storage.buckets (id, name, public)
values ('wishes', 'wishes', true)
on conflict (id) do nothing;
