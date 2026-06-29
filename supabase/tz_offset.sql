-- User timezone offset in minutes to ADD to UTC to get local time (e.g. Kyiv = +180).
-- Captured from the web client; used to stamp bot/server entries in the user's local time.
alter table if exists users add column if not exists tz_offset int;
