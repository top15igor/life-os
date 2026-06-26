-- Book layout: which chapters are hidden and their custom order. { hidden: [], order: [] }.
alter table if exists book_meta add column if not exists layout jsonb default '{}'::jsonb;
