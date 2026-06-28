-- Файлы в «Визуальной памяти»: помимо фото (image_url) теперь храним любые файлы (PDF и т.п.).
-- Безопасно запускать повторно.
alter table memories add column if not exists file_url  text;
alter table memories add column if not exists file_name text;
alter table memories add column if not exists mime_type text;
