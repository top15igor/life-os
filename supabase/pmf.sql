-- ============================================================
--  LIFE OS - PMF survey (Sean Ellis question) via bot
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

-- Who already received the survey question (to avoid duplicates).
create table if not exists pmf_asks (
  user_id uuid primary key,
  sent_at timestamptz default now()
);

-- One answer per user; re-vote overwrites the previous answer.
-- score: very = "very disappointed", somewhat = "somewhat", no = "not disappointed"
create table if not exists pmf_responses (
  user_id uuid primary key,
  score text not null check (score in ('very','somewhat','no')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists pmf_asks enable row level security;
alter table if exists pmf_responses enable row level security;
