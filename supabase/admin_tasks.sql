-- Owner-only backlog: things postponed "for later", jotted down to implement later.
create table if not exists admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  done boolean default false,
  created_at timestamptz default now(),
  done_at timestamptz
);
create index if not exists admin_tasks_idx on admin_tasks (done, created_at desc);
alter table if exists admin_tasks enable row level security;
