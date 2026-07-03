-- User-defined expense/income categories (variant A: user manages their own).
-- Built-in categories stay in code; these are per-user additions like "Штрафы", "Дети".
-- slug — machine key used in finance_tx.category; label/emoji — for display.

create table if not exists finance_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  slug       text not null,
  label      text not null,
  emoji      text,
  kind       text not null default 'expense',   -- expense | income
  created_at timestamptz default now()
);
create unique index if not exists finance_categories_user_slug on finance_categories (user_id, kind, slug);
alter table if exists finance_categories enable row level security;
