-- 🎙 Голос навсегда: хранение оригинальных голосовых.
-- Применить в Supabase (SQL editor + Storage). Без этого фича мягко отключена.

-- 1) Колонка со ссылкой на аудио у записи.
alter table entries add column if not exists voice_url text;

-- 2) Публичный бакет для голосовых (если создаёшь через SQL).
--    Можно и через UI: Storage → New bucket → name "voices" → Public.
insert into storage.buckets (id, name, public)
values ('voices', 'voices', true)
on conflict (id) do nothing;

-- 3) Разрешить публичное чтение файлов бакета "voices" (запись идёт service-ключом).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'voices public read'
  ) then
    create policy "voices public read" on storage.objects
      for select using (bucket_id = 'voices');
  end if;
end $$;
