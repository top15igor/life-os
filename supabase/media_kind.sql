-- Media library: turn the reading diary "books" table into a media library
-- (books / films / series). Existing rows stay as 'book'.
alter table books add column if not exists kind text not null default 'book';
create index if not exists books_user_kind_idx on books (user_id, kind);
