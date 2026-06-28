-- ============================================================
--  LIFE OS - fx: кэш исторических курсов валют (помесячно).
--  usd_per_unit — сколько USD стоит 1 единица валюты в этом месяце.
--  Источник 'nbu' — Национальный банк Украины. Общая на всех таблица
--  (курсы одинаковы для всех пользователей).
--  Run в Supabase: SQL Editor -> New query -> paste -> Run. Идемпотентно.
-- ============================================================

create table if not exists fx_monthly (
  month        text not null,           -- 'YYYY-MM'
  currency     text not null,           -- ISO-код валюты: 'UAH', 'EUR', ...
  usd_per_unit numeric not null check (usd_per_unit > 0),
  source       text,                    -- 'nbu' | 'manual'
  updated_at   timestamptz default now(),
  primary key (month, currency)
);

alter table if exists fx_monthly enable row level security;
-- Пишет и читает только серверный ключ (service_role обходит RLS),
-- поэтому отдельные политики не нужны: для anon доступа нет.
