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

create index if not exists finance_tx_user_idx  on finance_tx (user_id, day desc);
create index if not exists finance_tx_entry_idx on finance_tx (entry_id);

alter table if exists finance_tx enable row level security;
