-- 🎙 Голос навсегда: хранение оригинальных голосовых.
-- Применить в Supabase (SQL editor + Storage). Без этого фича мягко отключена.

-- 1) Колонка со ссылкой на аудио у записи.
alter table entries add column if not exists voice_url text;

-- 2) Публичный бакет для голосовых (если создаёшь через SQL).
--    Можно и через UI: Storage → New bucket → name "voices" → БЕЗ галочки Public.
insert into storage.buckets (id, name, public)
values ('voices', 'voices', false)
on conflict (id) do nothing;

-- 3) Бакет "voices" закрытый: политику публичного чтения НЕ создаём.
--    Ссылки выписываются подписанными на час (src/lib/fileLink.ts).
--    См. supabase/security_rls.sql — там старая политика удаляется.
