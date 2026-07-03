-- Theme preference for the web app: 'auto' (follow system) | 'light' | 'dark'.
-- Mirrored into a cookie for server-side rendering; synced across devices via account.

alter table users add column if not exists theme text default 'auto';
