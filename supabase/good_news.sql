-- ============================================================
--  LIFE OS - good news of the day (morning push add-on)
--  One real positive world news per day per language, found via
--  Claude web search and cached here (one AI call per day/lang).
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists good_news (
  day  date not null,
  lang text not null,
  text text not null,
  url  text,
  created_at timestamptz default now(),
  primary key (day, lang)
);

alter table if exists good_news enable row level security;
