-- Public reviews on the landing page.
--
-- People leave a review at /reviews. Nothing goes public automatically:
-- every review waits for the owner's approval in /admin/reviews.
--
-- status: pending | approved | rejected
-- consent: person explicitly allowed publishing the text under their name

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  role        text,
  rating      int  not null default 5 check (rating between 1 and 5),
  text        text not null,
  locale      text not null default 'ru',
  status      text not null default 'pending',
  consent     boolean not null default false,
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

-- one review per person: a second submit replaces the previous one
create unique index if not exists reviews_user_uniq on reviews (user_id);

-- landing reads only approved ones, newest first
create index if not exists reviews_public_idx on reviews (status, approved_at desc);
