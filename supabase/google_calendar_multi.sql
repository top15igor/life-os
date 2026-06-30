-- Multi-calendar support: remember which Google calendar each item went to,
-- so deletion targets the right calendar (work / family / personal ...).
-- Idempotent. Safe to run multiple times. Requires google_calendar.sql first.

alter table reminders add column if not exists gcal_calendar_id text;
alter table calendar_links add column if not exists calendar_id text;
