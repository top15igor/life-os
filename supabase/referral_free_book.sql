-- Invite-a-friend reward: free printed book ("Classic" tier).
-- A referred friend counts as active after >= 5 diary entries.
-- Every 3 active friends earn one free printed book.
-- This column tracks how many free books the user has already requested.
alter table if exists users add column if not exists free_books_used integer not null default 0;
