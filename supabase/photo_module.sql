-- ============================================================
--  PHOTO MODULE, phase 1: index of the user's photo archive.
--
--  Life OS is NOT another photo cloud. Originals stay where they
--  are (NAS, disk, exported iCloud folder). A small local "scout"
--  program scans the folder and uploads ONLY: thumbnails, EXIF,
--  hashes. The cloud then describes thumbnails with AI and builds
--  a semantic index, so the user can talk to the whole archive.
--
--  Safe to run more than once.
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create extension if not exists vector;

-- 1) Connected photo storages. One row per folder/NAS/drive.
--    device_token is the ONLY credential the local scout holds:
--    it can push photo metadata for this source and nothing else.
--    read_only stays true for the whole MVP: no code path exists
--    that changes or deletes originals.
create table if not exists photo_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  kind text not null default 'folder',            -- 'folder' | 'synology' | 'drive'
  device_token text not null unique,
  read_only boolean not null default true,
  ai_policy text not null default 'cloud_ok',     -- 'cloud_ok' | 'local_only'
  photo_count int not null default 0,
  last_scan_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists photo_sources_user_idx on photo_sources (user_id);

-- 2) The photo index itself. One row per file in the source.
--    (source_id, path) is the identity: re-running the scout is
--    idempotent, it just upserts the same rows.
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_id uuid not null references photo_sources(id) on delete cascade,
  path text not null,
  file_name text,
  ext text,
  file_size bigint,
  mime_type text,

  captured_at timestamptz,                        -- EXIF date, then file date
  gps_lat double precision,
  gps_lng double precision,
  location_city text,
  location_country text,

  camera_make text,
  camera_model text,
  width int,
  height int,

  sha256 text,
  phash text,                                     -- perceptual hash for near-duplicates

  thumb_url text,                                 -- private bucket photo-thumbs

  -- filled by the cloud AI sweep:
  caption text,
  scene text,
  tags text[],
  is_screenshot boolean,
  quality text,                                   -- 'low' | 'medium' | 'high'
  embedding vector(1536),

  status text not null default 'new',             -- 'new' -> 'ok' | 'skip'
  created_at timestamptz default now(),
  unique (source_id, path)
);
create index if not exists photos_user_time_idx on photos (user_id, captured_at desc);
create index if not exists photos_sha_idx on photos (user_id, sha256);
create index if not exists photos_status_idx on photos (status) where status = 'new';

-- 3) Faces (phase: faces). Vectors come from a LOCAL face model on
--    the scout, never from an LLM. person_id links to the existing
--    "people" of the diary, so the bot already knows the names.
create table if not exists photo_faces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  photo_id uuid not null references photos(id) on delete cascade,
  person_id bigint,                               -- -> people(id), nullable until confirmed
  cluster_key text,                               -- temporary cluster before naming
  bbox jsonb,                                     -- {x,y,w,h} relative 0..1
  embedding vector(512),
  det_conf real,
  face_quality real,
  created_at timestamptz default now()
);
create index if not exists photo_faces_photo_idx on photo_faces (photo_id);
create index if not exists photo_faces_person_idx on photo_faces (user_id, person_id);

-- 4) Events and albums (phase: events). Created now so later phases
--    need no new migration. Events can link to the travel diary.
create table if not exists photo_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  trip_id uuid,
  confidence real,
  created_at timestamptz default now()
);
create table if not exists photo_event_items (
  event_id uuid not null references photo_events(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  primary key (event_id, photo_id)
);

create table if not exists photo_albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'static',            -- 'static' | 'smart' | 'ai'
  title text not null,
  query jsonb,                                    -- for smart albums
  cover_photo_id uuid,
  created_at timestamptz default now()
);
create table if not exists photo_album_items (
  album_id uuid not null references photo_albums(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade,
  position int not null default 0,
  primary key (album_id, photo_id)
);

-- 5) Audit log for ANY future change of a physical file. In MVP the
--    scout has no write code at all, so this table stays empty; it
--    exists so the cleanup phase must write here from day one.
create table if not exists photo_op_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_id uuid,
  action text not null,
  source_path text,
  destination_path text,
  initiated_by text,                              -- 'user' | 'agent'
  confirmed_by_user boolean not null default false,
  executed_at timestamptz default now(),
  result text,
  undo_available boolean not null default false,
  undo_metadata jsonb
);

-- 6) Row level security: same model as the rest of Life OS. The app
--    talks through the service key; anon access is fully blocked.
alter table if exists photo_sources     enable row level security;
alter table if exists photos            enable row level security;
alter table if exists photo_faces       enable row level security;
alter table if exists photo_events      enable row level security;
alter table if exists photo_event_items enable row level security;
alter table if exists photo_albums      enable row level security;
alter table if exists photo_album_items enable row level security;
alter table if exists photo_op_logs     enable row level security;

-- 7) Semantic search over photos, same shape as match_shelf.
create or replace function match_photos(
  query_embedding text,
  match_user uuid,
  match_count int default 24
)
returns table (id uuid, similarity float)
language sql
stable
security invoker
as $$
  select p.id, 1 - (p.embedding <=> query_embedding::vector(1536)) as similarity
    from photos p
   where p.user_id = match_user and p.embedding is not null
   order by p.embedding <=> query_embedding::vector(1536)
   limit match_count;
$$;

-- Check: sources and index size (zeros are fine before the first scan).
select
  (select count(*) from photo_sources) as sources,
  (select count(*) from photos) as photos,
  (select count(*) from photos where embedding is not null) as described;
