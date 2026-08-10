-- ============================================================
--  Ideas from users: dictate a suggestion, refine it in dialogue,
--  then track what happened to it.
--
--  Why a table of its own. "feedback" holds one-off complaints with no life
--  after them. An idea has a life: it is discussed, accepted or turned down,
--  queued, built. Without that history a person who suggests something is
--  talking into a void — and stops after the second time.
--
--  Safe to run more than once.
-- ============================================================

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  -- короткий номер, чтобы на идею можно было сослаться в разговоре
  num serial,
  user_id uuid not null,
  title text not null,
  -- итоговая формулировка после обсуждения
  body text not null,
  -- что она решает и для кого — заполняется в диалоге
  problem text,
  who text,
  -- как понять, что сделано
  done_when text,
  -- new | thinking | queued | doing | done | declined
  status text not null default 'new',
  -- решение владельца словами: почему отложили или отклонили
  note text,
  -- переписка, из которой родилась формулировка (для владельца)
  chat jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_user_idx on ideas (user_id, created_at desc);
create index if not exists ideas_status_idx on ideas (status, created_at desc);

alter table ideas enable row level security;

-- Check.
select count(*) as ideas from ideas;
