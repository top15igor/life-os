-- Insights management: add a nullable category column for grouping.
-- Stable language-independent keys: growth | health | relationships | work | emotions | habits | other.
-- Existing rows stay NULL (shown as "uncategorized") until sorted manually or via auto-sort.
alter table if exists insights add column if not exists category text;
