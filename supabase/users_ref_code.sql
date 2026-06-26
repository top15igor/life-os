-- Short referral code for friendly invite links /i/<code>.
-- Generated lazily in code; legacy ?ref=<UUID> links keep working.
alter table if exists users add column if not exists ref_code text;
create unique index if not exists users_ref_code_idx on users (ref_code);
