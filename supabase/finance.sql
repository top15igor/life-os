-- ============================================================
--  LIFE OS - finance: expenses & income log.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
--  Безопасно запускать повторно.
-- ============================================================

create table if not exists finance_tx (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  entry_id   uuid,                       -- если операция извлечена AI из записи дневника
  day        date not null,
  kind       text not null check (kind in ('income', 'expense')),
  amount     numeric not null check (amount > 0),
  currency   text not null default 'USD',
  category   text,
  note       text,
  created_at timestamptz default now()
);

-- Для уже существующих установок: добавить колонку связи с записью.
alter table if exists finance_tx add column if not exists entry_id uuid;

-- Источник операции: NULL — добавлено вручную, 'moneyok' — импорт из MoneyOK.
-- Нужно, чтобы откатить импорт одним действием.
alter table if exists finance_tx add column if not exists source text;

create index if not exists finance_tx_user_idx  on finance_tx (user_id, day desc);
create index if not exists finance_tx_entry_idx on finance_tx (entry_id);

-- Месячные лимиты (бюджеты) по категориям расходов. Сумма — в основной валюте.
create table if not exists finance_budget (
  user_id    uuid not null,
  category   text not null,
  amount     numeric not null check (amount > 0),
  updated_at timestamptz default now(),
  primary key (user_id, category)
);

-- Настройки финансов: основная валюта + курсы остальных валют к ней (jsonb: {"USD": 41.5, ...}).
create table if not exists finance_settings (
  user_id       uuid primary key,
  base_currency text not null default 'USD',
  rates         jsonb not null default '{}'::jsonb,
  updated_at    timestamptz default now()
);

alter table if exists finance_tx       enable row level security;
alter table if exists finance_budget   enable row level security;
alter table if exists finance_settings enable row level security;
