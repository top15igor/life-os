-- ============================================================
--  LIFE OS - Google Health API OAuth tokens (one per user).
--  Reads Fitbit / Pixel data via Google Health API v4.
--  Synced data lands in health_metrics (source = 'googlehealth').
--  Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- ============================================================

create table if not exists googlehealth_tokens (
  user_id        uuid primary key,
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,   -- access token expiry
  scope          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table if exists googlehealth_tokens enable row level security;
