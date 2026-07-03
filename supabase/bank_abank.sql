-- A-Bank Open Banking (AIS) connection per user.
-- Consent-based read access: we store the consent id + account resource id after the
-- user approves access in the àbank24 app (SCA DECOUPLED).

create table if not exists bank_abank (
  user_id       uuid primary key,
  iban          text not null,
  corporate     boolean not null default false,   -- ФОП/юрлицо → PSU-Corporate-ID
  currency      text not null default 'UAH',
  consent_id    text,
  consent_valid_to date,
  resource_id   text,                              -- account resourceId (для чтения операций)
  connected     boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table if exists bank_abank enable row level security;
