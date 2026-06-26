-- ============================================================
--  LIFE OS - cache for the "Health now" block on the Wellness tab.
--  So the main issue + goals are computed by AI once a day, not every visit.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
--  (Works without the table too - it just recomputes live each time.)
-- ============================================================

create table if not exists health_focus (
  user_id     uuid primary key,
  day         date,
  entry_count int,
  data        jsonb,
  updated_at  timestamptz default now()
);
