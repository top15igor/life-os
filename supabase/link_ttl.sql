-- One-time login link TTL.
-- token_at = when the current login token was issued (rotated).
-- The web login /u/<token> rejects tokens older than 1 hour.
-- Null means "expired" - a safe default for all existing rows:
-- fresh tokens are issued by the /link command in the bot.
alter table users add column if not exists token_at timestamptz;
