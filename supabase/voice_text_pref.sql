-- Per-user setting: show recognized voice transcription under the bot reply.
-- Default TRUE (keeps current behavior; helps catch misrecognized text like amounts).
alter table users add column if not exists show_voice_text boolean not null default true;
