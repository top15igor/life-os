-- ============================================================
--  LIFE OS — Row Level Security (защита на уровне базы)
--  Включает RLS на всех таблицах. Наш сервер ходит через
--  service_role, который RLS обходит, поэтому приложение
--  продолжит работать как прежде. А вот прямой доступ извне
--  (анонимный ключ / публичный REST) будет закрыт.
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

alter table if exists users            enable row level security;
alter table if exists entries          enable row level security;
alter table if exists categories       enable row level security;
alter table if exists tags             enable row level security;
alter table if exists people           enable row level security;
alter table if exists places           enable row level security;
alter table if exists projects         enable row level security;
alter table if exists entry_categories enable row level security;
alter table if exists entry_tags       enable row level security;
alter table if exists entry_people     enable row level security;
alter table if exists entry_places     enable row level security;
alter table if exists entry_projects   enable row level security;
alter table if exists tasks            enable row level security;
alter table if exists insights         enable row level security;
alter table if exists gratitude        enable row level security;
alter table if exists goals            enable row level security;
alter table if exists biographer_chats enable row level security;
alter table if exists life_overview    enable row level security;
alter table if exists experiments      enable row level security;
