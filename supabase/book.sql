-- «Моя жизнь, [год]» — мета книги: посвящение, письма, получатель, кэш AI-разделов.
-- Идемпотентно. Код деградирует gracefully, если таблицы нет (try/catch в lib/book.ts).

create table if not exists book_meta (
  user_id      uuid        not null,
  year         int         not null,            -- 0 = «вся жизнь» (автобиография)
  dedication   text,                            -- посвящение на обложке
  letter_self  text,                            -- письмо себе в следующий год
  letter_close text,                            -- письмо близким
  recipient    text,                            -- кому книга (self/parents/children/partner/family)
  book_type    text,                            -- year / gift / family / lifestory
  sections     jsonb       not null default '{}'::jsonb,  -- кэш AI-разделов { overview, self, lessons, people }
  updated_at   timestamptz not null default now(),
  primary key (user_id, year)
);

alter table book_meta enable row level security;
-- service_role (supabaseAdmin) обходит RLS; для anon доступа нет — данные приватны.
