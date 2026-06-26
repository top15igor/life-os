-- "Visual memory": photos/documents/receipts -> AI extracts meaning and data.
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entry_id uuid,
  category text default 'other',  -- document/moment/thing/person/place/project/info/other
  title text,
  summary text,
  fields jsonb,                   -- [{label,value}] extracted data
  mem_date date,
  image_url text,
  status text default 'ok',       -- ok / review (low confidence)
  created_at timestamptz default now()
);
create index if not exists memories_user_idx on memories (user_id, created_at desc);
alter table if exists memories enable row level security;

-- Public image storage (uploaded with the server key).
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;
