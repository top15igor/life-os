-- User control over document expiry reminders.
-- remind_at: explicit date to remind about (overrides the AI-detected expiry).
-- remind_off: user dismissed the reminder (e.g. renewed / not needed).
alter table memories add column if not exists remind_at date;
alter table memories add column if not exists remind_off boolean not null default false;
