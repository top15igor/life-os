-- ============================================================
--  SECURITY: row level security on every table + close the doors
--
--  Why this is needed.
--  The Supabase "anon" key is public by design: it is meant to be shipped
--  to browsers. Our app never uses it (the server talks to the database
--  with the service_role key), but the key still exists and still opens
--  the REST endpoint of the project. Today most tables have no row level
--  security, which means anyone holding that public key could read them.
--
--  What this migration does.
--  1) Turns RLS on for every table in the public schema, with no policies.
--     No policies + RLS on = nobody gets in. service_role bypasses RLS,
--     so the application keeps working exactly as before.
--  2) Removes the leftover table grants from the anon / authenticated
--     roles, so even a future misconfiguration does not open anything.
--  3) Drops the storage policy that let anyone read the "voices" bucket.
--     Without dropping it, making the bucket private would not help:
--     the policy still allowed reading every voice recording.
--
--  Safe to run more than once.
-- ============================================================

-- 1) RLS everywhere in public schema.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

-- 2) Take away the default grants from the public-facing roles.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- 3) Voice recordings are not public.
drop policy if exists "voices public read" on storage.objects;

-- Check: this should return zero rows.
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;
