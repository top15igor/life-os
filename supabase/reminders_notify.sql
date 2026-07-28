-- ============================================================
--  LIFE OS - bot-delivered reminders (Telegram ping at due time)
--  notified_at: when the bot pinged the user about this reminder.
--  Recurring reminders roll due_at forward and keep notified_at null.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

alter table reminders add column if not exists notified_at timestamptz;

create index if not exists reminders_due_pending_idx
  on reminders (due_at)
  where done = false and notified_at is null;
