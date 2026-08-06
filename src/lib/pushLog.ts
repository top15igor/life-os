import { supabaseAdmin } from "./supabaseAdmin";

// Журнал пушей: факт отправки + был ли отклик. Всё мягко (try/catch) —
// если таблицы push_log ещё нет, просто ничего не делаем.
//
// Вместе с пушем сохраняем САМ ВОПРОС: без этого видно только «вечерний пуш
// ушёл», и нельзя отличить вопрос, на который людям хочется отвечать, от
// вопроса, который все молча пролистывают. Это единственный честный признак
// качества вопроса — и на нём работает недельный агент-редактор.
//
// Приватность: здесь лежат метаданные и текст НАШЕГО вопроса. Ответ человека
// не сохраняется — только его длина в символах.

export type PushMeta = { question?: string | null; qKey?: string | null; qSource?: string | null };

export async function logPush(
  userId: string,
  kind: "morning" | "evening" | "weekly" | "acquaint" | "people" | "birthday",
  meta?: PushMeta,
): Promise<void> {
  const row: any = { user_id: userId, kind };
  if (meta?.question) row.question = String(meta.question).slice(0, 500);
  if (meta?.qKey) row.q_key = String(meta.qKey).slice(0, 80);
  if (meta?.qSource) row.q_source = String(meta.qSource).slice(0, 20);
  try {
    const { error } = await supabaseAdmin().from("push_log").insert(row);
    // Колонок вопроса может не быть (question_quality.sql не применён) — тогда
    // пишем хотя бы факт пуша, иначе сломалась бы и прежняя статистика откликов.
    if (error && (row.question || row.q_key || row.q_source)) {
      await supabaseAdmin().from("push_log").insert({ user_id: userId, kind });
    }
  } catch { /* нет таблицы — не критично */ }
}

// Пользователь ответил: помечаем недавние (≤12ч) неотвеченные пуши как responded.
// Длину ответа храним как меру вовлечённости: односложное «норм» и абзац на пять
// предложений — очень разный отклик на вопрос, и это стоит различать.
export async function markPushResponded(userId: string, answerLen?: number): Promise<void> {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const patch: any = { responded: true };
  if (typeof answerLen === "number" && answerLen > 0) patch.answer_len = Math.min(100000, Math.floor(answerLen));
  try {
    const { error } = await supabaseAdmin().from("push_log").update(patch)
      .eq("user_id", userId).eq("responded", false).gte("sent_at", since);
    if (error && patch.answer_len !== undefined) {
      await supabaseAdmin().from("push_log").update({ responded: true })
        .eq("user_id", userId).eq("responded", false).gte("sent_at", since);
    }
  } catch { /* нет таблицы — не критично */ }
}
