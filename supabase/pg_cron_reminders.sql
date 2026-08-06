-- ============================================================
--  LIFE OS - punctual reminder delivery via Supabase pg_cron
--
--  WHY: GitHub Actions was the alarm clock, but on the free tier GitHub
--  throttles frequent schedules hard - a "*/5 * * * *" cron actually fired
--  once every 1-3 hours and sometimes got cancelled outright. A reminder
--  set "in two minutes" could never arrive on time.
--
--  Supabase runs pg_cron next to the data, with real minute precision and
--  no extra cost. Every minute it pings the delivery endpoint, which sends
--  whatever is due. Nothing else changes.
--
--  BEFORE RUNNING:
--   1. In Vercel add env var  REMINDER_KEY  with a value YOU invent
--      (any long random string, e.g. r7k2-life-os-9x4m). Redeploy.
--   2. Replace PUT_YOUR_REMINDER_KEY_HERE below with that same value.
--
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-running the file should not create a second job.
select cron.unschedule('lifeos-reminders')
where exists (select 1 from cron.job where jobname = 'lifeos-reminders');

select cron.schedule(
  'lifeos-reminders',
  '* * * * *',
  $$
    select net.http_get(
      url := 'https://life-os.today/api/cron-reminders?key=PUT_YOUR_REMINDER_KEY_HERE',
      timeout_milliseconds := 20000
    );
  $$
);

-- Check it exists:            select jobname, schedule, active from cron.job;
-- Check the last runs:        select status, return_message, start_time
--                               from cron.job_run_details
--                              where jobid = (select jobid from cron.job where jobname = 'lifeos-reminders')
--                              order by start_time desc limit 10;
-- Turn it off if ever needed: select cron.unschedule('lifeos-reminders');
