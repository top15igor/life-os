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

-- Replace PUT_YOUR_REMINDER_KEY_HERE on the line below. Nothing else to edit.
--
-- The check exists because a forgotten placeholder installs a job that silently
-- gets 401 every minute and delivers nothing — the failure looks exactly like
-- success. Better to refuse loudly right here than to debug it an hour later.
do $$
declare
  k text := 'PUT_YOUR_REMINDER_KEY_HERE';
begin
  if k = 'PUT_YOUR_REMINDER_KEY_HERE' or length(k) < 8 then
    raise exception 'Сначала замени PUT_YOUR_REMINDER_KEY_HERE на значение переменной REMINDER_KEY из Vercel, потом запусти снова';
  end if;

  -- Re-running the file should not create a second job.
  if exists (select 1 from cron.job where jobname = 'lifeos-reminders') then
    perform cron.unschedule('lifeos-reminders');
  end if;

  perform cron.schedule(
    'lifeos-reminders',
    '* * * * *',
    format('select net.http_get(url := %L, timeout_milliseconds := 20000);',
           'https://life-os.today/api/cron-reminders?key=' || k)
  );
end $$;

-- Check it exists:            select jobname, schedule, active from cron.job;
-- Check the last runs:        select status, return_message, start_time
--                               from cron.job_run_details
--                              where jobid = (select jobid from cron.job where jobname = 'lifeos-reminders')
--                              order by start_time desc limit 10;
-- Turn it off if ever needed: select cron.unschedule('lifeos-reminders');
