-- ============================================================
--  FIX: the vector indexes were built on empty tables.
--
--  What went wrong. An ivfflat index learns "centroids" from the data that
--  exists AT BUILD TIME. We created the indexes in the same migration that
--  added the columns, so they were built on nothing but NULLs. Such an index
--  has no usable centroids: the search still runs, but it looks in the wrong
--  buckets and quietly misses the rows it should have found. Found live —
--  a freshly uploaded rental contract was not returned for "housing papers"
--  even though its vector was stored correctly.
--
--  The fix. At this size (hundreds to a few thousand rows per person) an
--  exact scan is both correct and fast — milliseconds. So we drop ivfflat.
--  Where the server supports HNSW, we create that instead: unlike ivfflat it
--  builds incrementally and needs no training data, so it cannot go stale
--  the same way.
--
--  Safe to run more than once.
-- ============================================================

drop index if exists entries_embedding_idx;
drop index if exists memories_embedding_idx;
drop index if exists notes_embedding_idx;
drop index if exists saved_items_embedding_idx;
drop index if exists books_embedding_idx;

-- HNSW if this Postgres has it; otherwise no index at all (exact search).
do $$
declare
  t text;
begin
  foreach t in array array['entries', 'memories', 'notes', 'saved_items', 'books'] loop
    begin
      execute format('create index if not exists %I on %I using hnsw (embedding vector_cosine_ops)', t || '_embedding_hnsw', t);
    exception when others then
      -- Нет HNSW или нет колонки — живём без индекса: на наших объёмах
      -- точный перебор быстрее, чем кажется, и главное — не врёт.
      raise notice 'skip hnsw for %: %', t, sqlerrm;
    end;
  end loop;
end $$;

-- Check: which vector indexes exist now.
select tablename, indexname
from pg_indexes
where indexdef like '%vector_cosine_ops%'
order by tablename;
