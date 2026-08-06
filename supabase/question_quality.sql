-- Question quality loop: measure -> propose -> approve -> serve.
--
-- Until now push_log only recorded THAT an evening push was sent, not WHICH
-- question was asked. So there was no way to tell a question people answer from
-- one everybody ignores. These columns add exactly that — and nothing else:
-- no diary content ever leaves the user's account, only "asked / answered / how long".
--
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

alter table push_log add column if not exists question   text;   -- the question text as sent
alter table push_log add column if not exists q_key      text;   -- stable key: theme + source id
alter table push_log add column if not exists q_source   text;   -- bank | ai | custom | daily | db
alter table push_log add column if not exists answer_len int;    -- length of the reply, characters

create index if not exists push_log_qkey_idx on push_log (q_key, sent_at desc);

-- Questions approved by the owner. They join the rotation next to the ones
-- hardcoded in the app, so a good question can be added without a deploy.
create table if not exists question_bank (
  id         uuid primary key default gen_random_uuid(),
  lang       text not null default 'ru',
  theme      text not null,
  text       text not null,
  source     text not null default 'agent',  -- agent | owner
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists question_bank_pick_idx on question_bank (lang, theme, active);

-- What the weekly agent proposes. Nothing reaches people from here: the owner
-- approves each line by hand, and only then it moves into question_bank.
create table if not exists question_candidates (
  id          uuid primary key default gen_random_uuid(),
  lang        text not null default 'ru',
  theme       text not null,
  text        text not null,
  reason      text,                            -- why the agent proposes it
  replaces    text,                            -- the weak question it is meant to replace
  stats       jsonb,                           -- what the numbers looked like
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists question_candidates_status_idx on question_candidates (status, created_at desc);

alter table if exists question_bank       enable row level security;
alter table if exists question_candidates enable row level security;
