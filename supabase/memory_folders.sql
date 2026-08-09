-- Subfolders inside Visual Memory categories.
-- folder = short bucket name (e.g. "Passports", "Receipts") set by the AI on
-- import; existing rows are backfilled by a heuristic. Null = no subfolder.
alter table memories add column if not exists folder text;
