-- Управление Базой знаний: заметки, избранное, отметка «применил», ручной порядок.
-- Запусти в Supabase → SQL Editor → Run (повторный запуск безопасен).
alter table if exists saved_items add column if not exists note text;
alter table if exists saved_items add column if not exists favorite boolean default false;
alter table if exists saved_items add column if not exists done boolean default false;
alter table if exists saved_items add column if not exists position int default 0;
