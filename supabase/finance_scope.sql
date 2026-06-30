-- Personal / Business / Transfer split for finance transactions.
-- Lets summaries show real personal spending, excluding business (FOP invoices)
-- and transfers (own-card top-ups, P2P, cash). Idempotent.

alter table finance_tx add column if not exists scope text;  -- 'personal' | 'business' | 'transfer' | null(=personal)
create index if not exists finance_tx_scope_idx on finance_tx (user_id, scope);
