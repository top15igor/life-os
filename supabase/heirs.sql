-- 👨‍👩‍👧 Наследники: кому однажды откроется твоя Книга жизни.
-- Применить в Supabase (SQL editor). Без таблицы фича мягко отключена.
create table if not exists heirs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  relation text,
  email text,
  token text not null unique,
  status text not null default 'sealed',      -- sealed | released
  auto_release_days int not null default 365,  -- авто-раскрытие при долгом молчании (0 = никогда)
  released_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists heirs_user_idx on heirs (user_id);
create index if not exists heirs_token_idx on heirs (token);
