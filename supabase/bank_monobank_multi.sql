-- Multiple Monobank accounts per user (e.g. two clients / family members).
-- Before: user_id was the PRIMARY KEY - one connection per user, a second
-- token silently overwrote the first. Now: surrogate id PK, user_id indexed,
-- client_id remembers which Monobank client a row belongs to. Idempotent.

alter table bank_monobank add column if not exists id uuid not null default gen_random_uuid();
alter table bank_monobank add column if not exists client_id text;

do $$ begin
  if exists (
    select 1 from information_schema.key_column_usage
    where table_name = 'bank_monobank'
      and constraint_name = 'bank_monobank_pkey'
      and column_name = 'user_id'
  ) then
    alter table bank_monobank drop constraint bank_monobank_pkey;
    alter table bank_monobank add constraint bank_monobank_pkey primary key (id);
  end if;
end $$;

create index if not exists bank_monobank_user_idx on bank_monobank (user_id);
create unique index if not exists bank_monobank_hook_idx on bank_monobank (hook_secret);
