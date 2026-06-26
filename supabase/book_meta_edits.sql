-- User edits of book chapters: { chapterKey: "their text" }.
-- Stored separately from sections (AI cache) so edits are NOT lost on chapter rebuild.
alter table if exists book_meta add column if not exists edits jsonb default '{}'::jsonb;
