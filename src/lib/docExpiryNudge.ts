import { supabaseAdmin } from "./supabaseAdmin";
import { documentExpiry, daysLeft } from "./docExpiry";

type Lang = "ru" | "en" | "uk" | "fr" | "es";

// Рубежи напоминаний: за год и далее по мере приближения. На каждом — один пуш.
export const EXPIRY_STAGES = [365, 180, 90, 30, 14, 7, 1] as const;
const OVERDUE = -1; // отдельный рубеж «уже истёк»

const T: Record<Lang, { header: string; soon: (n: number) => string; today: string; over: (n: number) => string; footer: string }> = {
  ru: { header: "⏳ <b>Приближается срок документа</b>", soon: (n) => (n >= 60 ? `через ~${Math.round(n / 30)} мес.` : `через ${n} дн.`), today: "сегодня", over: (n) => `истёк ${n} дн. назад`, footer: "Открой «Память» → «Документы», чтобы посмотреть." },
  en: { header: "⏳ <b>A document is expiring</b>", soon: (n) => (n >= 60 ? `in ~${Math.round(n / 30)} mo.` : `in ${n} d.`), today: "today", over: (n) => `expired ${n} d. ago`, footer: "Open Memory → Documents to review." },
  uk: { header: "⏳ <b>Наближається термін документа</b>", soon: (n) => (n >= 60 ? `через ~${Math.round(n / 30)} міс.` : `через ${n} дн.`), today: "сьогодні", over: (n) => `сплив ${n} дн. тому`, footer: "Відкрий «Пам'ять» → «Документи», щоб переглянути." },
  fr: { header: "⏳ <b>Un document expire bientôt</b>", soon: (n) => (n >= 60 ? `dans ~${Math.round(n / 30)} mois` : `dans ${n} j.`), today: "aujourd'hui", over: (n) => `expiré il y a ${n} j.`, footer: "Ouvre Mémoire → Documents pour vérifier." },
  es: { header: "⏳ <b>Un documento está por vencer</b>", soon: (n) => (n >= 60 ? `en ~${Math.round(n / 30)} meses` : `en ${n} d.`), today: "hoy", over: (n) => `venció hace ${n} d.`, footer: "Abre Memoria → Documentos para revisar." },
};

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Рубеж, на который «попадает» документ с данным остатком дней:
// самый большой порог, который ещё не превышен; для просроченного — OVERDUE.
function stageFor(days: number): number | null {
  if (days < 0) return OVERDUE;
  for (const t of EXPIRY_STAGES) if (days <= t) { /* ищем наименьший подходящий */ }
  // наименьший порог >= days (т.е. текущая «ступень срочности»)
  let stage: number | null = null;
  for (const t of [...EXPIRY_STAGES].sort((a, b) => a - b)) { if (days <= t) { stage = t; break; } }
  return stage; // null → до срока больше года, пока молчим
}

type DocRow = { id: string; category: string; title: string; fields?: any };

async function loadExpiring(userId: string, todayISO: string): Promise<{ id: string; title: string; days: number }[]> {
  let rows: any[] = [];
  try {
    const { data, error } = await supabaseAdmin().from("memories").select("id, category, title, fields, remind_at, remind_off").eq("user_id", userId).limit(500);
    if (error) throw error;
    rows = (data as any[]) || [];
  } catch {
    // Колонок напоминаний ещё нет — работаем по автосроку из полей.
    try {
      const { data } = await supabaseAdmin().from("memories").select("id, category, title, fields").eq("user_id", userId).limit(500);
      rows = (data as any[]) || [];
    } catch { return []; }
  }
  return rows
    .map((r) => {
      if (r.remind_off === true) return null; // пользователь снял напоминание
      const date = (typeof r.remind_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.remind_at)) ? r.remind_at : documentExpiry(r.category, r.fields)?.date;
      return date ? { id: r.id, title: String(r.title || ""), days: daysLeft(date, todayISO) } : null;
    })
    .filter((x): x is { id: string; title: string; days: number } => !!x);
}

// Самотест/предпросмотр: все документы со сроком в пределах года (и просроченные) — одним списком.
export async function docExpiryMessage(userId: string, lang: Lang, todayISO: string): Promise<string | null> {
  const found = (await loadExpiring(userId, todayISO))
    .filter((x) => x.days <= 365)
    .sort((a, b) => a.days - b.days)
    .slice(0, 12);
  if (!found.length) return null;
  const t = T[lang] || T.ru;
  const lines = [t.header, ""];
  for (const f of found) lines.push(`• <b>${esc(f.title)}</b> — ${f.days < 0 ? t.over(-f.days) : f.days === 0 ? t.today : t.soon(f.days)}`);
  lines.push("", t.footer);
  return lines.join("\n");
}

// Для крона: какие документы ПЕРЕСЕКЛИ новый рубеж (год/полгода/…/просрочен) и ещё
// не были на нём отмечены. Возвращает готовое сообщение + обновлённую карту рубежей.
export async function dueExpiryReminders(
  userId: string, lang: Lang, todayISO: string, notified: Record<string, number>
): Promise<{ message: string | null; nextNotified: Record<string, number>; changed: boolean }> {
  const docs = await loadExpiring(userId, todayISO);
  const next = { ...(notified || {}) };
  const due: { title: string; days: number }[] = [];
  let changed = false;
  for (const d of docs) {
    const stage = stageFor(d.days);
    if (stage === null) continue; // дальше года — молчим
    if (next[d.id] !== stage) { next[d.id] = stage; changed = true; due.push({ title: d.title, days: d.days }); }
  }
  // Подчистим карту от исчезнувших документов (удалённых).
  const ids = new Set(docs.map((d) => d.id));
  for (const k of Object.keys(next)) if (!ids.has(k)) { delete next[k]; changed = true; }

  if (!due.length) return { message: null, nextNotified: next, changed };
  const t = T[lang] || T.ru;
  due.sort((a, b) => a.days - b.days);
  const lines = [t.header, ""];
  for (const f of due) lines.push(`• <b>${esc(f.title)}</b> — ${f.days < 0 ? t.over(-f.days) : f.days === 0 ? t.today : t.soon(f.days)}`);
  lines.push("", t.footer);
  return { message: lines.join("\n"), nextNotified: next, changed };
}
