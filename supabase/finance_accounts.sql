-- Accounts (cards, wallets, cash) for the Money section.
-- Each account: name, emoji, its own currency, and a starting balance
-- ("how much is on the card right now"). Balance = opening_balance +
-- all linked operations on/after opening_date, converted to the
-- account currency by monthly NBU rates. Idempotent.

create table if not exists finance_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  name            text not null,
  emoji           text,
  currency        text not null default 'UAH',
  opening_balance numeric not null default 0,
  opening_date    date not null default current_date,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists finance_accounts_user_idx on finance_accounts (user_id);
alter table if exists finance_accounts enable row level security;

-- Link operations to accounts.
-- account_id  - the account of the operation (for transfers: source).
-- account2_id - transfer destination (only for single-row transfers).
alter table finance_tx add column if not exists account_id uuid;
alter table finance_tx add column if not exists account2_id uuid;
create index if not exists finance_tx_account_idx on finance_tx (user_id, account_id);
