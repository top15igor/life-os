-- ============================================================
--  LIFE OS - hourly morning push via Supabase pg_cron
--
--  WHY: "choose your own morning time" needs an alarm clock that rings
--  every hour. That clock was GitHub Actions (morning-hourly.yml), but on
--  the free tier GitHub throttles schedules hard: instead of every hour the
--  workflow actually fired about once every 8 hours. The endpoint compares
--  the user's chosen hour with the current one, so a user who picked 7:00
--  simply never got a message - no run landed inside their hour.
--
--  Supabase runs pg_cron next to the data with real precision and at no
--  extra cost. Once an hour it pings the endpoint, which itself decides who
--  is due and sends at most one message per person per day.
--
--  This is the same fix that pg_cron_reminders.sql applied to reminders,
--  and it uses the SAME key - nothing new to invent.
--
--  BEFORE RUNNING:
--   1. REMINDER_KEY must already be set in Vercel (it is, if reminders
--      arrive on time).
--   2. Replace ВСТАВЬ_КЛЮЧ_СЮДА below with that same value.
--
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  k text := 'ВСТАВЬ_КЛЮЧ_СЮДА';
begin
  -- Placeholder is Cyrillic and the real key is not: one place to edit, no ambiguity.
  if length(k) < 8 or k ~ '[А-яЁё]' then
    raise exception 'Сначала замени ВСТАВЬ_КЛЮЧ_СЮДА на значение переменной REMINDER_KEY из Vercel, потом запусти снова';
  end if;

  -- Re-running the file should not create a second job.
  if exists (select 1 from cron.job where jobname = 'lifeos-morning') then
    perform cron.unschedule('lifeos-morning');
  end if;

  perform cron.schedule(
    'lifeos-morning',
    '2 * * * *',   -- every hour, two minutes past: the hour has surely started everywhere
    format('select net.http_get(url := %L, timeout_milliseconds := 60000);',
           'https://life-os.today/api/cron-morning?key=' || k)
  );
end $$;

-- Check it exists:            select jobname, schedule, active from cron.job;
-- Check the last runs:        select status, return_message, start_time
--                               from cron.job_run_details
--                              where jobid = (select jobid from cron.job where jobname = 'lifeos-morning')
--                              order by start_time desc limit 10;
-- Turn it off:                select cron.unschedule('lifeos-morning');
