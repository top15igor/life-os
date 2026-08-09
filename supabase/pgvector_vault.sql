-- ============================================================
--  Semantic search for the WHOLE vault, not just the diary.
--
--  Why. Diary entries already have embeddings (pgvector_memory.sql), so
--  "what was that about my back in spring" finds the entry even if the
--  entry says "lower back". Everything else — documents, notes, saved
--  articles, books — was searched by letters only. Put a rental contract
--  in and ask about "housing papers" a year later: nothing is found,
--  because the word "housing" never appears in the document.
--
--  This migration gives the other shelves the same sense of meaning.
--
--  Safe to run more than once.
-- ============================================================

create extension if not exists vector;

-- 1) One embedding column per shelf (OpenAI text-embedding-3-small = 1536).
alter table memories    add column if not exists embedding vector(1536);
alter table notes       add column if not exists embedding vector(1536);
alter table saved_items add column if not exists embedding vector(1536);
alter table books       add column if not exists embedding vector(1536);

-- 2) Approximate-nearest-neighbour indexes (cosine distance).
create index if not exists memories_embedding_idx    on memories    using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists notes_embedding_idx       on notes       using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists saved_items_embedding_idx on saved_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists books_embedding_idx       on books       using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3) One search function for every shelf.
--    The table name is passed in, so adding a shelf later needs no new
--    function — only a line in the whitelist below. The whitelist is the
--    security boundary: without it this would be an open door to any table.
create or replace function match_shelf(
  shelf text,
  query_embedding text,
  match_user uuid,
  match_count int default 8
)
returns table (id uuid, similarity float)
language plpgsql
stable
security invoker
as $$
begin
  if shelf not in ('memories', 'notes', 'saved_items', 'books') then
    raise exception 'match_shelf: unknown shelf %', shelf;
  end if;

  return query execute format(
    'select t.id, 1 - (t.embedding <=> $1::vector(1536)) as similarity
       from %I t
      where t.user_id = $2 and t.embedding is not null
      order by t.embedding <=> $1::vector(1536)
      limit $3',
    shelf
  ) using query_embedding, match_user, match_count;
end;
$$;

-- Check: how much is already indexed (zeros are fine before the backfill).
select 'memories' as shelf, count(*) filter (where embedding is not null) as indexed, count(*) as total from memories
union all select 'notes', count(*) filter (where embedding is not null), count(*) from notes
union all select 'saved_items', count(*) filter (where embedding is not null), count(*) from saved_items
union all select 'books', count(*) filter (where embedding is not null), count(*) from books
union all select 'entries', count(*) filter (where embedding is not null), count(*) from entries;
