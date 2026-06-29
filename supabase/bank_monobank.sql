-- ============================================================
--  LIFE OS - интеграция с Monobank (личный API).
--  Хранит токен пользователя и секрет вебхука. Новые транзакции
--  Monobank присылает на вебхук → создаётся операция в finance_tx.
--  Run в Supabase: SQL Editor -> New query -> paste -> Run. Идемпотентно.
-- ============================================================

create table if not exists bank_monobank (
  user_id     uuid primary key,
  token       text not null,                       -- личный токен Monobank (X-Token)
  hook_secret uuid not null default gen_random_uuid(),  -- секрет в URL вебхука
  client_name text,
  webhook_set boolean default false,
  created_at  timestamptz default now()
);

alter table if exists bank_monobank enable row level security;
-- Доступ только серверным ключом (service_role обходит RLS).

-- Внешний id операции — чтобы банковские транзакции не задваивались.
alter table if exists finance_tx add column if not exists ext_id text;
create index if not exists finance_tx_ext_idx on finance_tx (user_id, ext_id);
