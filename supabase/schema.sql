-- ============================================================
--  LIFE OS — схема базы данных (Supabase / PostgreSQL)
--  Запусти этот файл целиком в Supabase: SQL Editor → New query →
--  вставь всё → Run. Создаёт все таблицы дневника.
--  Шкалы: mood / energy / health = 1..10 (как в ТЗ).
-- ============================================================

-- Расширения
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;      -- поиск по смыслу (на будущее)

-- ------------------------------------------------------------
--  ЗАПИСИ — главная таблица дневника
-- ------------------------------------------------------------
create table if not exists entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                                  -- владелец (для будущего мультипользователя)
  created_at  timestamptz not null default now(),
  entry_date  date        not null default current_date,
  entry_time  time        not null default current_time,
  source      text        not null default 'web',    -- telegram_voice | telegram_text | web
  raw_text    text        not null,                  -- оригинал (расшифровка голоса или текст)
  summary     text,                                  -- краткое AI-резюме
  focus       text,                                  -- фокус дня
  mood        smallint check (mood    between 1 and 10),
  energy      smallint check (energy  between 1 and 10),
  health      smallint check (health  between 1 and 10),
  importance  smallint check (importance between 1 and 5),
  -- быстрые поля здоровья (опционально заполняет AI)
  sleep_hours numeric(3,1),
  weight      numeric(5,1),
  embedding   vector(1536)                           -- для семантического поиска (Блок 4)
);
create index if not exists entries_date_idx on entries (entry_date desc);
create index if not exists entries_user_idx on entries (user_id);

-- ------------------------------------------------------------
--  КАТЕГОРИИ (фиксированный справочник) + связь с записями
-- ------------------------------------------------------------
create table if not exists categories (
  id    serial primary key,
  slug  text unique not null,
  name  text not null,
  icon  text,
  color text
);

create table if not exists entry_categories (
  entry_id    uuid references entries(id) on delete cascade,
  category_id int  references categories(id) on delete cascade,
  primary key (entry_id, category_id)
);

-- стартовый набор категорий
insert into categories (slug, name, icon, color) values
  ('health',       'Здоровье',     'heartbeat', '#EF4444'),
  ('sport',        'Спорт',        'run',       '#10B981'),
  ('food',         'Питание',      'salad',     '#84CC16'),
  ('family',       'Семья',        'users',     '#EC4899'),
  ('relationship', 'Отношения',    'heart',     '#F472B6'),
  ('business',     'Бизнес',       'briefcase', '#3B82F6'),
  ('finance',      'Финансы',      'coin',      '#0EA5E9'),
  ('ideas',        'Идеи',         'bulb',      '#F59E0B'),
  ('insight',      'Инсайты',      'sparkles',  '#8B5CF6'),
  ('task',         'Задачи',       'checkbox',  '#6366F1'),
  ('gratitude',    'Благодарность','heart',     '#14B8A6'),
  ('travel',       'Путешествия',  'plane',     '#06B6D4'),
  ('emotions',     'Эмоции',       'mood-smile','#A78BFA'),
  ('problem',      'Проблемы',     'alert',     '#F97316'),
  ('decision',     'Решения',      'flag',      '#22C55E'),
  ('event',        'События',      'calendar',  '#64748B')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
--  ТЕГИ (свободные, придумывает AI или ты)
-- ------------------------------------------------------------
create table if not exists tags (
  id      serial primary key,
  user_id uuid,
  name    text not null,
  unique (user_id, name)
);
create table if not exists entry_tags (
  entry_id uuid references entries(id) on delete cascade,
  tag_id   int  references tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

-- ------------------------------------------------------------
--  ЛЮДИ / МЕСТА / ПРОЕКТЫ (сущности, которые AI вытаскивает)
-- ------------------------------------------------------------
create table if not exists people (
  id serial primary key, user_id uuid, name text not null,
  unique (user_id, name)
);
create table if not exists entry_people (
  entry_id uuid references entries(id) on delete cascade,
  person_id int references people(id) on delete cascade,
  primary key (entry_id, person_id)
);

create table if not exists places (
  id serial primary key, user_id uuid, name text not null,
  unique (user_id, name)
);
create table if not exists entry_places (
  entry_id uuid references entries(id) on delete cascade,
  place_id int references places(id) on delete cascade,
  primary key (entry_id, place_id)
);

create table if not exists projects (
  id serial primary key, user_id uuid, name text not null,
  status text default 'active', description text, color text,
  unique (user_id, name)
);
create table if not exists entry_projects (
  entry_id uuid references entries(id) on delete cascade,
  project_id int references projects(id) on delete cascade,
  primary key (entry_id, project_id)
);

-- ------------------------------------------------------------
--  ИЗВЛЕЧЁННЫЕ ЭЛЕМЕНТЫ: задачи, инсайты, благодарности
-- ------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete set null,
  user_id uuid, text text not null,
  done boolean not null default false,
  due_date date, created_at timestamptz default now()
);
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  user_id uuid, text text not null,
  importance smallint, status text default 'raw',   -- raw | reviewed | applied
  created_at timestamptz default now()
);
create table if not exists gratitude (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  user_id uuid, text text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
--  ЦЕЛИ
-- ------------------------------------------------------------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, title text not null,
  progress smallint default 0 check (progress between 0 and 100),
  year int, color text, created_at timestamptz default now()
);

-- ------------------------------------------------------------
--  ВЛОЖЕНИЯ и СВЯЗИ между записями
-- ------------------------------------------------------------
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  type text,            -- photo | file | link
  url text not null, name text, created_at timestamptz default now()
);
create table if not exists entry_links (
  entry_id uuid references entries(id) on delete cascade,
  related_entry_id uuid references entries(id) on delete cascade,
  primary key (entry_id, related_entry_id)
);

-- ------------------------------------------------------------
--  TELEGRAM: какие chat_id имеют право писать в дневник
--  (защита — бот принимает записи только от своих)
-- ------------------------------------------------------------
create table if not exists telegram_users (
  chat_id   bigint primary key,
  user_id   uuid,
  name      text,
  created_at timestamptz default now()
);

-- ============================================================
--  Готово. Дальше код приложения будет писать и читать отсюда.
-- ============================================================
