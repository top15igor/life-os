-- ============================================================
--  LIFE OS - finance: expenses & income log.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists finance_tx (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  day        date not null,
  kind       text not null check (kind in ('income', 'expense')),
  amount     numeric not null check (amount > 0),
  currency   text not null default 'USD',
  category   text,
  note       text,
  created_at timestamptz default now()
);
create index if not exists finance_tx_user_idx on finance_tx (user_id, day desc);

alter table if exists finance_tx enable row level security;
