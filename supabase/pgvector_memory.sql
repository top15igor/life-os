-- Semantic memory: embed diary entries and search by meaning (pgvector).
-- Run in Supabase SQL editor. Idempotent.

-- 1) Enable the vector extension.
create extension if not exists vector;

-- 2) Store an embedding per entry (OpenAI text-embedding-3-small = 1536 dims).
alter table entries add column if not exists embedding vector(1536);

-- 3) Approximate-nearest-neighbour index for cosine distance.
create index if not exists entries_embedding_idx
  on entries using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 4) Search function: most semantically similar entries for a user.
--    query_embedding is passed as a text literal like '[0.1,0.2,...]' and cast
--    to vector inside (robust through PostgREST rpc).
create or replace function match_entries(query_embedding text, match_user uuid, match_count int default 8)
returns table (id uuid, entry_date date, summary text, raw_text text, similarity float)
language sql stable as $$
  select e.id, e.entry_date, e.summary, e.raw_text,
         1 - (e.embedding <=> (query_embedding)::vector(1536)) as similarity
  from entries e
  where e.user_id = match_user and e.embedding is not null
  order by e.embedding <=> (query_embedding)::vector(1536)
  limit match_count;
$$;
