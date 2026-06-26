-- Photos attached to book chapters: { chapterKey: ["imageUrl", ...] }.
alter table if exists book_meta add column if not exists photos jsonb default '{}'::jsonb;
