-- «Собрать свою»: список блоков главной, выбранных пользователем (JSON-массив ключей).
alter table if exists users add column if not exists home_blocks text;
