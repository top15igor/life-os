// ============================================================
//  ⏳ Капсулы времени: письмо себе/близким в будущее.
//  Бот доставит его в назначенный день (проверка в дневном кроне).
//  Хранение — таблица time_capsules (см. supabase/time_capsules.sql).
//  Без таблицы всё мягко деградирует (create/list вернут пусто/ошибку).
// ============================================================

import { supabaseAdmin } from "./supabaseAdmin";

export type Capsule = { id: string; title: string | null; body: string; deliver_on: string; delivered: boolean; created_at: string };

// Прибавить к дате N лет/месяцев/дней (ISO YYYY-MM-DD → ISO).
function shift(iso: string, unit: "y" | "m" | "d", n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  if (unit === "y") d.setUTCFullYear(d.getUTCFullYear() + n);
  else if (unit === "m") d.setUTCMonth(d.getUTCMonth() + n);
  else d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Разобрать «когда доставить» из начала текста команды. Возвращает дату + остаток (тело).
// Поддержка: 2035-01-01 / 01.01.2035 / «через N лет|год|месяцев|месяц|дней|день».
export function parseCapsule(input: string, todayISO: string): { deliverOn: string; body: string } | { error: "when" | "empty" | "past" } {
  const raw = (input || "").trim();
  if (!raw) return { error: "empty" };

  // ISO: 2035-01-01
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s+([\s\S]+)$/);
  if (m) return finalize(`${m[1]}-${m[2]}-${m[3]}`, m[4], todayISO);

  // DD.MM.YYYY или DD/MM/YYYY
  m = raw.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\s+([\s\S]+)$/);
  if (m) {
    const dd = m[1].padStart(2, "0"), mm = m[2].padStart(2, "0");
    return finalize(`${m[3]}-${mm}-${dd}`, m[4], todayISO);
  }

  // «через N лет|год|года|месяц(ев)|дн(ей|я)|день»
  m = raw.match(/^через\s+(\d+)?\s*(год|года|лет|месяц|месяца|месяцев|дн(?:ей|я)|день|недел(?:ю|и|ь))\s+([\s\S]+)$/i)
    || raw.match(/^in\s+(\d+)?\s*(year|years|month|months|day|days|week|weeks)\s+([\s\S]+)$/i);
  if (m) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    const w = m[2].toLowerCase();
    let unit: "y" | "m" | "d" = "y"; let mult = n;
    if (/^(год|года|лет|year|years)/.test(w)) unit = "y";
    else if (/^(месяц|месяца|месяцев|month|months)/.test(w)) unit = "m";
    else if (/^(недел|week)/.test(w)) { unit = "d"; mult = n * 7; }
    else unit = "d";
    return finalize(shift(todayISO, unit, mult), m[3], todayISO);
  }

  return { error: "when" };
}

function finalize(deliverOn: string, body: string, todayISO: string): { deliverOn: string; body: string } | { error: "past" | "empty" } {
  const b = (body || "").trim();
  if (!b) return { error: "empty" };
  if (deliverOn <= todayISO) return { error: "past" };
  return { deliverOn, body: b.slice(0, 6000) };
}

export async function createCapsule(userId: string, chatId: number, deliverOn: string, body: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from("time_capsules").insert({ user_id: userId, chat_id: chatId, body, deliver_on: deliverOn });
    return !error;
  } catch {
    return false;
  }
}

// Будущие (недоставленные) капсулы пользователя — для списка.
export async function listCapsules(userId: string): Promise<Capsule[]> {
  try {
    const { data } = await supabaseAdmin().from("time_capsules").select("id, title, body, deliver_on, delivered, created_at").eq("user_id", userId).eq("delivered", false).order("deliver_on", { ascending: true }).limit(50);
    return (data as Capsule[]) || [];
  } catch {
    return [];
  }
}

// Капсулы к доставке на сегодня (по всем пользователям) — вызывается кроном.
export async function dueCapsules(todayISO: string): Promise<{ id: string; chat_id: number; body: string; created_at: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("time_capsules").select("id, chat_id, body, created_at").eq("delivered", false).lte("deliver_on", todayISO).limit(200);
    return (data as any[]) || [];
  } catch {
    return [];
  }
}

export async function markCapsuleDelivered(id: string): Promise<void> {
  try { await supabaseAdmin().from("time_capsules").update({ delivered: true, delivered_at: new Date().toISOString() }).eq("id", id); } catch { /* ignore */ }
}
