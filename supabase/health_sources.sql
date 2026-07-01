-- ============================================================
--  LIFE OS - separate health sources (Fitbit/Google vs Apple).
--  Allow both providers to store their own row per day instead
--  of overwriting each other, and let the user pick the primary.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

-- 1) Make (user_id, day, source) the uniqueness key instead of (user_id, day).
--    Backfill any null source so the new key is valid.
update health_metrics set source = 'legacy' where source is null;

alter table health_metrics drop constraint if exists health_metrics_user_id_day_key;
alter table health_metrics add  constraint health_metrics_user_day_source_key unique (user_id, day, source);

-- 2) User preference for the primary source: null/'auto' | 'google' | 'apple'.
alter table users add column if not exists health_source text;
