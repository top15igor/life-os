-- Store the user's real Telegram @username (from message.from.username) so that
-- /send @their_telegram_name works and contacts show a recognizable handle.
alter table if exists users add column if not exists tg_username text;
create index if not exists users_tg_username_idx on users (lower(tg_username));
