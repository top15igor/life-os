import { supabaseAdmin } from "./supabaseAdmin";

// Журнал пушей: факт отправки + был ли отклик. Всё мягко (try/catch) —
// если таблицы push_log ещё нет, просто ничего не делаем.

export async function logPush(userId: string, kind: "morning" | "evening" | "weekly" | "acquaint"): Promise<void> {
  try {
    await supabaseAdmin().from("push_log").insert({ user_id: userId, kind });
  } catch { /* нет таблицы — не критично */ }
}

// Пользователь ответил: помечаем недавние (≤12ч) неотвеченные пуши как responded.
export async function markPushResponded(userId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    await supabaseAdmin().from("push_log").update({ responded: true })
      .eq("user_id", userId).eq("responded", false).gte("sent_at", since);
  } catch { /* нет таблицы — не критично */ }
}
