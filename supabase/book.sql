-- "My life, [year]" - book meta: dedication, letters, recipient, AI sections cache.
-- Idempotent. Code degrades gracefully if the table is missing (try/catch in lib/book.ts).

create table if not exists book_meta (
  user_id      uuid        not null,
  year         int         not null,            -- 0 = whole life (autobiography)
  dedication   text,                            -- dedication on the cover
  letter_self  text,                            -- letter to next year's self
  letter_close text,                            -- letter to loved ones
  recipient    text,                            -- who the book is for (self/parents/children/partner/family)
  book_type    text,                            -- year / gift / family / lifestory
  sections     jsonb       not null default '{}'::jsonb,  -- AI sections cache { overview, self, lessons, people }
  updated_at   timestamptz not null default now(),
  primary key (user_id, year)
);

alter table book_meta enable row level security;
-- service_role (supabaseAdmin) bypasses RLS; no anon access - data stays private.
