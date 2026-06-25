-- «Мой след»: добрые дела и обещания людям (AI извлекает из записей).
create table if not exists good_deeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entry_id uuid,
  text text not null,
  person text,
  created_at timestamptz default now()
);
create index if not exists good_deeds_user_idx on good_deeds (user_id, created_at desc);
alter table if exists good_deeds enable row level security;

create table if not exists promises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entry_id uuid,
  text text not null,
  person text,
  status text default 'active',
  created_at timestamptz default now()
);
create index if not exists promises_user_idx on promises (user_id, created_at desc);
alter table if exists promises enable row level security;
