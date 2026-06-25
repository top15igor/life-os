-- ============================================================
--  LIFE OS — таблица пользователей (мультипользовательский режим)
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  chat_id    bigint unique,          -- Telegram chat_id пользователя
  name       text,                   -- имя из Telegram
  token      text unique not null,   -- секрет для входа по личной ссылке
  created_at timestamptz default now()
);
create index if not exists users_token_idx on users (token);

-- Привязываем владельца (Игоря) к его существующим записям:
-- его chat_id = 115629292, его записи лежат под нулевым uuid.
insert into users (id, chat_id, name, token)
values ('00000000-0000-0000-0000-000000000000', 115629292, 'Игорь', gen_random_uuid()::text)
on conflict (chat_id) do nothing;
