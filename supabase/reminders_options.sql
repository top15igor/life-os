-- Calendar-like options for reminders: repeat, all-day, custom lead time.
-- Idempotent. Requires google_calendar.sql + google_calendar_multi.sql.

alter table reminders add column if not exists recurrence text;     -- daily|weekly|monthly|yearly (null = one-time)
alter table reminders add column if not exists all_day boolean default false;
alter table reminders add column if not exists remind_min int;       -- minutes before to alert (null = default 10)
