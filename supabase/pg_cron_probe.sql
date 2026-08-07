-- ============================================================
--  LIFE OS - continuous probe agent
--
--  The agent invents fresh user phrasings, sends them to the bot and has a
--  second model check whether the bot understood. Unlike the fixed self-test
--  (which catches regressions in known paths), this finds the wordings nobody
--  thought of at the desk - and that is exactly where every recent bug lived.
--
--  CADENCE IS A BUDGET DIAL, NOT A TECHNICAL LIMIT.
--  One run = ~10 probes = roughly 40-50 cheap model calls. Every 2 hours is a
--  sane starting point: frequent enough to catch a bad deploy the same day,
--  cheap enough not to notice. Watch the real number in /admin -> AI spend and
--  turn the dial from there.
--
--  BEFORE RUNNING:
--   1. REMINDER_KEY must already exist in Vercel (it does, if reminders work).
--   2. Replace PUT_YOUR_REMINDER_KEY_HERE below with that same value.
--
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  k text := 'PUT_YOUR_REMINDER_KEY_HERE';
begin
  if k = 'PUT_YOUR_REMINDER_KEY_HERE' or length(k) < 8 then
    raise exception 'Сначала замени PUT_YOUR_REMINDER_KEY_HERE на значение переменной REMINDER_KEY из Vercel, потом запусти снова';
  end if;

  if exists (select 1 from cron.job where jobname = 'lifeos-probe') then
    perform cron.unschedule('lifeos-probe');
  end if;

  perform cron.schedule(
    'lifeos-probe',
    '13 */2 * * *',   -- каждые 2 часа; '13 */4 * * *' вдвое дешевле, '13 * * * *' — каждый час
    format('select net.http_get(url := %L, timeout_milliseconds := 280000);',
           'https://life-os.today/api/probe?key=' || k || '&n=1')
  );
end $$;

-- Посмотреть находки:  select mode, ok, failed, failures, started_at
--                        from selftest_runs where mode = 'probe'
--                       order by started_at desc limit 10;
-- Выключить:           select cron.unschedule('lifeos-probe');
