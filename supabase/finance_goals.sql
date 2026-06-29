-- ============================================================
--  LIFE OS - finance: цели по накоплениям (копилки).
--  current_amount — сколько накоплено, target_amount — цель.
--  Run в Supabase: SQL Editor -> New query -> paste -> Run. Идемпотентно.
-- ============================================================

create table if not exists finance_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  title          text not null,
  target_amount  numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  currency       text not null default 'EUR',
  deadline       date,
  achieved       boolean default false,
  created_at     timestamptz default now()
);

create index if not exists finance_goals_user_idx on finance_goals (user_id);

alter table if exists finance_goals enable row level security;
-- Доступ только серверным ключом (service_role обходит RLS).
