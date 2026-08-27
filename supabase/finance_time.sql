-- Operation time (HH:MM) for finance transactions.
-- Filled by bank integrations (Monobank webhook/import, PrivatBank API and
-- statement files) and editable in the operation dialog. Idempotent.

alter table finance_tx add column if not exists op_time text;
