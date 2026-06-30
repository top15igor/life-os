-- Personal nicknames for relay: a user can call a contact by their own name
-- (e.g. "Котик") and use it in /send. Private to the owner.
create table if not exists relay_aliases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  target_id uuid not null,
  alias text not null,
  created_at timestamptz default now()
);
create index if not exists relay_aliases_owner_idx on relay_aliases (owner_id);
alter table if exists relay_aliases enable row level security;
