-- One-time token to bind a web/email account to the Telegram bot.
-- Web generates it, puts it in a t.me deep link (?start=link_<token>);
-- the bot consumes it and sets users.chat_id, then clears the token.

alter table users add column if not exists tg_link_token text;
create index if not exists users_tg_link_token_idx on users (tg_link_token) where tg_link_token is not null;
