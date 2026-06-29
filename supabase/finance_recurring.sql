-- ============================================================
--  LIFE OS - finance: регулярные платежи (подписки, аренда, кредиты).
--  Бот НАПОМИНАЕТ в день платежа (операцию создаёт сам пользователь).
--  Run в Supabase: SQL Editor -> New query -> paste -> Run. Идемпотентно.
-- ============================================================

create table if not exists finance_recurring (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  kind         text not null default 'expense' check (kind in ('income', 'expense')),
  amount       numeric not null check (amount > 0),
  currency     text not null default 'EUR',
  category     text,
  subcategory  text,
  note         text,
  day_of_month int not null check (day_of_month between 1 and 31),
  active       boolean not null default true,
  last_reminded date,                 -- когда последний раз напомнили (анти-дубль)
  created_at   timestamptz default now()
);

create index if not exists finance_recurring_user_idx on finance_recurring (user_id);

alter table if exists finance_recurring enable row level security;
-- Доступ только через серверный ключ (service_role обходит RLS).
