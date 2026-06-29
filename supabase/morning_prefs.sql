-- ============================================================
--  LIFE OS — персональные настройки утренних пуш-уведомлений.
--  Пользователь сам выбирает тон и темы (что ИИ присылает утром).
--  Запусти в Supabase: SQL Editor → New query → вставь → Run.
-- ============================================================

alter table if exists users add column if not exists morning_prefs jsonb default null;

-- Формат значения (пример):
-- { "tone": "friend", "topics": ["motivation","goals","tasks","diary","insight","gratitude","movement"] }
-- null / отсутствие колонки = поведение по умолчанию (дружеский тон, все темы).
