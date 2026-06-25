-- Обратная связь от пользователей (идеи, проблемы, отзывы).
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  kind text default 'other',
  text text not null,
  created_at timestamptz default now()
);

create index if not exists feedback_created_idx on feedback (created_at desc);

alter table if exists feedback enable row level security;
