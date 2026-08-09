-- ============================================================
--  "Sort it out" shelf: remember the corrections a person makes.
--
--  Why. The agent files things automatically and is sometimes wrong. Today a
--  correction is a one-off: the person fixes the category, and the next
--  identical receipt lands in the wrong place again. That is the difference
--  between a wardrobe that learns and a wardrobe that only looks tidy.
--
--  A rule is deliberately small: "things that look like THIS go THERE".
--  It is written when a person corrects the agent, and it is fed back into
--  the analysis prompt so the same mistake stops repeating.
--
--  Safe to run more than once.
-- ============================================================

create table if not exists sort_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- what the rule is about: 'category' (filed on the wrong shelf) for now
  kind text not null default 'category',
  -- short human description of the thing, taken from what was corrected
  subject text not null,
  -- what the agent chose and what the person actually wanted
  was text,
  should_be text not null,
  times integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sort_rules_user_idx on sort_rules (user_id, updated_at desc);

alter table sort_rules enable row level security;

-- Check.
select count(*) as rules from sort_rules;
