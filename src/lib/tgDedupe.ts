import { supabaseAdmin } from "./supabaseAdmin";

// Telegram присылает обновление заново, если вебхук не ответил вовремя.
// Длинные голосовые обрабатываются долго — без этой защиты одно и то же
// сообщение могло сохраниться в дневник дважды.
//
// Возвращает true, если это обновление мы уже обрабатывали.
export async function alreadyHandled(updateId: unknown): Promise<boolean> {
  const id = Number(updateId);
  if (!Number.isFinite(id)) return false;
  try {
    const { error } = await supabaseAdmin().from("tg_updates").insert({ update_id: id });
    // Ключ уже есть — значит повтор.
    if (error && (error.code === "23505" || /duplicate key/i.test(error.message || ""))) return true;
    return false;
  } catch {
    // Таблицы ещё нет или база недоступна — не блокируем сообщение,
    // лучше редкий дубль, чем потерянная запись.
    return false;
  }
}

/** Чистка старых отметок — вызывается из крона, чтобы таблица не росла. */
export async function pruneHandledUpdates(days = 3): Promise<void> {
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
  try {
    await supabaseAdmin().from("tg_updates").delete().lt("created_at", cutoff);
  } catch {}
}
