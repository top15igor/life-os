-- Per-user toggle for Telegram push notifications (morning + evening).
-- Default true = existing behavior unchanged; users can opt out in Profile.
alter table if exists users add column if not exists push_enabled boolean default true;
