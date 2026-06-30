-- One-time login links: separate the persistent session secret (kept in the cookie)
-- from the login token (in the /u/<token> URL, which becomes single-use and rotates on open).
-- Existing sessions keep working: their cookie currently holds the token, so we seed
-- session_secret = token for everyone (getCurrentUser then finds them by session_secret).
alter table if exists users add column if not exists session_secret text;
update users set session_secret = token where session_secret is null;
create index if not exists users_session_secret_idx on users (session_secret);
