// ============================================================
//  🎙 Голос навсегда: сохраняем ОРИГИНАЛЬНОЕ голосовое (.ogg) в Supabase
//  Storage и привязываем к записи (entries.voice_url). Потом его можно
//  переслушать в записи и в Книге жизни — «твой голос для потомков».
//  Требует: колонку entries.voice_url и публичный бакет "voices"
//  (см. supabase/voice_archive.sql). Без них — мягко деградирует.
// ============================================================

import { supabaseAdmin } from "./supabaseAdmin";

const BUCKET = "voices";

// Скачать .ogg из Telegram и положить в Storage; записать публичную ссылку в запись.
// Работает «в фоне» (fire-and-forget) — не задерживает ответ пользователю.
export async function archiveVoice(userId: string, entryId: string, telegramFileUrl: string): Promise<void> {
  if (!userId || !entryId || !telegramFileUrl) return;
  try {
    const res = await fetch(telegramFileUrl);
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return;

    const path = `${userId}/${entryId}.ogg`;
    const db = supabaseAdmin();
    const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: "audio/ogg", upsert: true });
    if (up.error) return; // нет бакета / нет прав — тихо выходим

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) return;

    await db.from("entries").update({ voice_url: publicUrl }).eq("id", entryId).eq("user_id", userId);
  } catch {
    // колонки/бакета может не быть — фича просто выключена, диалог не ломаем
  }
}
