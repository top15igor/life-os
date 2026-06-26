-- «Мечты» / Карта желаний. AI кладёт мечты из записей + ручное добавление, с фото.
create table if not exists dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entry_id uuid,
  sphere text default 'other',
  text text not null,
  emoji text,
  image_url text,
  status text default 'dream',   -- dream / progress / done
  done_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists dreams_user_idx on dreams (user_id, created_at desc);
alter table if exists dreams enable row level security;

-- Публичное хранилище картинок мечт (загрузка идёт серверным ключом).
insert into storage.buckets (id, name, public)
values ('dreams', 'dreams', true)
on conflict (id) do nothing;
