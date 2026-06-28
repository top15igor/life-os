-- Email + password sign-in for web users without Telegram.
-- Reuses the existing users table and the lifeos_token cookie system:
-- an email account is a normal user row with a generated token but no chat_id.
alter table users add column if not exists email text;
alter table users add column if not exists password_hash text;

-- One account per email (case-insensitive). Telegram-only users (email is null) are not affected.
create unique index if not exists users_email_unique on users (lower(email)) where email is not null;
