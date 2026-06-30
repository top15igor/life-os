-- Reading log: books a user wants to read / is reading / has read, with rating,
-- mini-review, notes and favorite quotes. Library can be shared publicly.
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  author text,
  cover_url text,
  description text,
  genre text,
  year integer,
  isbn text,
  ol_key text,
  pages integer,
  status text default 'want',     -- want / reading / read
  rating integer,                 -- 1..5
  liked boolean,                  -- true = liked, false = not, null = no verdict
  review text,                    -- short review
  notes text,                     -- longer reflections
  current_page integer,
  started_at date,
  finished_at date,
  favorite boolean default false,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists books_user_idx on books (user_id, status, updated_at desc);
alter table if exists books enable row level security;

create table if not exists book_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  book_id uuid not null,
  text text not null,
  page integer,
  created_at timestamptz default now()
);
create index if not exists book_quotes_book_idx on book_quotes (book_id, created_at desc);
alter table if exists book_quotes enable row level security;

-- Public library toggle + yearly reading goal on the profile.
alter table if exists public_profile add column if not exists books_public boolean default false;
alter table if exists public_profile add column if not exists book_goal integer default 0;
