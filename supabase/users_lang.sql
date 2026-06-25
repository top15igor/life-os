-- Язык пользователя (для локализованных пушей: напоминания, обзоры, возвраты).
alter table if exists users add column if not exists lang text;
