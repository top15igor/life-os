-- «Визуальная память»: фото/документы/квитанции → AI извлекает смысл и данные.
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entry_id uuid,
  category text default 'other',  -- document/moment/thing/person/place/project/info/other
  title text,
  summary text,
  fields jsonb,                   -- [{label,value}] извлечённые данные
  mem_date date,
  image_url text,
  status text default 'ok',       -- ok / review (низкая уверенность)
  created_at timestamptz default now()
);
create index if not exists memories_user_idx on memories (user_id, created_at desc);
alter table if exists memories enable row level security;

-- Публичное хранилище картинок (загрузка серверным ключом).
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;
