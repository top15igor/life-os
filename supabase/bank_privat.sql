-- PrivatBank (business / FOP) integration via AutoClient API.
-- Stores AutoClient credentials per connection; several connections per user.
-- Operations are pulled by the hourly cron and by the manual 30-day import
-- (PrivatBank has no webhooks). account_id links to finance_accounts so a
-- connection can be viewed separately in Money. Idempotent.

create table if not exists bank_privat (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  client_id  text not null,
  token      text not null,
  name       text,
  account_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists bank_privat_user_idx on bank_privat (user_id);
alter table if exists bank_privat enable row level security;
