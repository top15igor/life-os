-- ============================================================
--  LIFE OS - self-test, daily diagnosis and weekly question review
--  via Supabase pg_cron
--
--  WHY: these three ran from GitHub Actions (selftest.yml), and GitHub
--  throttles schedules on the free tier. The "every 15 minutes" self-test
--  actually fired a handful of times a day, and the daily diagnosis only
--  arrived on mornings when GitHub happened to honour its slot. A watchdog
--  that wakes up at random is not a watchdog: a broken deploy could sit
--  unnoticed for hours.
--
--  Supabase runs pg_cron with real precision at no extra cost. This is the
--  same move that pg_cron_reminders.sql made for reminders and
--  pg_cron_morning.sql for the morning push - and it uses the SAME key.
--
--  COST. Only the full self-test and the diagnosis spend AI, and both run
--  once a day - exactly as selftest.yml intended. The light self-test uses
--  no AI. Nothing here is more frequent than the schedule already promised;
--  it just finally keeps the promise.
--
--  DOUBLE RUNS. The GitHub workflow may stay as a backup: the diagnosis and
--  the question review refuse to run twice (once per 12 h / 72 h when called
--  by schedule), and the self-test only messages the owner when something
--  breaks or recovers, so an extra run is silent.
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
  k    text := 'ВСТАВЬ_КЛЮЧ_СЮДА';
  base text := 'https://life-os.today';
  j    record;
begin
  -- Placeholder is Cyrillic and the real key is not: one place to edit, no ambiguity.
  if length(k) < 8 or k ~ '[А-яЁё]' then
    raise exception 'Сначала замени ВСТАВЬ_КЛЮЧ_СЮДА на значение переменной REMINDER_KEY из Vercel, потом запусти снова';
  end if;

  -- Re-running the file should not create second copies of the jobs.
  for j in select jobname from cron.job
            where jobname in ('lifeos-selftest-light', 'lifeos-selftest-full-0', 'lifeos-selftest-full-1',
                              'lifeos-diagnose', 'lifeos-questions')
  loop
    perform cron.unschedule(j.jobname);
  end loop;

  -- Light self-test: no AI, every 15 minutes. Catches "the bot is silent".
  perform cron.schedule('lifeos-selftest-light', '*/15 * * * *',
    format('select net.http_get(url := %L, timeout_milliseconds := 60000);',
           base || '/api/selftest?key=' || k || '&mode=light'));

  -- Full self-test: once a day, in two halves so each fits the function limit.
  perform cron.schedule('lifeos-selftest-full-0', '7 6 * * *',
    format('select net.http_get(url := %L, timeout_milliseconds := 290000);',
           base || '/api/selftest?key=' || k || '&mode=full&of=2&part=0'));
  perform cron.schedule('lifeos-selftest-full-1', '13 6 * * *',
    format('select net.http_get(url := %L, timeout_milliseconds := 290000);',
           base || '/api/selftest?key=' || k || '&mode=full&of=2&part=1'));

  -- Daily diagnosis: after both halves of the full self-test have finished.
  perform cron.schedule('lifeos-diagnose', '25 6 * * *',
    format('select net.http_get(url := %L, timeout_milliseconds := 290000);',
           base || '/api/diagnose?key=' || k || '&hours=24'));

  -- Weekly question review: Monday morning.
  perform cron.schedule('lifeos-questions', '40 7 * * 1',
    format('select net.http_get(url := %L, timeout_milliseconds := 290000);',
           base || '/api/question-coach?key=' || k || '&days=60'));
end $$;

-- Check they exist:   select jobname, schedule, active from cron.job where jobname like 'lifeos-%';
-- Last runs of one:   select status, return_message, start_time
--                       from cron.job_run_details
--                      where jobid = (select jobid from cron.job where jobname = 'lifeos-diagnose')
--                      order by start_time desc limit 10;
-- Turn one off:       select cron.unschedule('lifeos-selftest-light');
