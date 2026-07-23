-- ⏳ Капсулы времени: письма в будущее, которые бот доставит в назначенный день.
-- Применить в Supabase (SQL editor). Без этой таблицы фича мягко отключена.
create table if not exists time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  chat_id bigint not null,
  title text,
  body text not null,
  deliver_on date not null,
  delivered boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

-- Быстрый поиск капсул к доставке (недоставленные, по дате).
create index if not exists time_capsules_due_idx on time_capsules (deliver_on) where delivered = false;
-- Список капсул пользователя.
create index if not exists time_capsules_user_idx on time_capsules (user_id, deliver_on);
