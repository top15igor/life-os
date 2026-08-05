-- Guard against Telegram re-delivering the same update.
--
-- Telegram resends an update if the webhook does not answer in time. Long voice
-- messages take a while to process, so the same message could be saved twice.
-- We remember every processed update_id and ignore repeats.

create table if not exists tg_updates (
  update_id  bigint primary key,
  created_at timestamptz not null default now()
);

-- old rows are useless: keep the table small
create index if not exists tg_updates_created_idx on tg_updates (created_at);
