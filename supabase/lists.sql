-- ============================================================
--  LIFE OS - checklists ("spiski"): shopping list etc.
--  Bot: "dobav moloko v spisok pokupok" -> add_list_item;
--  "chto v spiske?" -> show_list with check-off buttons.
--  list = 'shopping' is the default list; custom lists keyed by
--  their lowercased name. Web block lives on /notes.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run. Idempotent.
-- ============================================================

create table if not exists list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  list text not null default 'shopping',
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists list_items_user_idx on list_items (user_id, list, done, created_at);

alter table list_items enable row level security;
