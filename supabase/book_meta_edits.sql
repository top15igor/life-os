-- Правки глав книги пользователем: { chapterKey: "его текст" }.
-- Хранится отдельно от sections (кэш AI), чтобы правка НЕ терялась при пересборке главы.
alter table if exists book_meta add column if not exists edits jsonb default '{}'::jsonb;
