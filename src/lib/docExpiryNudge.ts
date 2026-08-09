import { supabaseAdmin } from "./supabaseAdmin";
import { documentExpiry, daysLeft } from "./docExpiry";

type Lang = "ru" | "en" | "uk" | "fr" | "es";

const T: Record<Lang, { header: string; soon: (n: number) => string; today: string; over: (n: number) => string; footer: string }> = {
  ru: { header: "⏳ <b>Скоро истекают сроки</b>", soon: (n) => `через ${n} дн.`, today: "сегодня", over: (n) => `истёк ${n} дн. назад`, footer: "Открой «Память» → фильтр «Документы», чтобы посмотреть." },
  en: { header: "⏳ <b>Expiring soon</b>", soon: (n) => `in ${n} d.`, today: "today", over: (n) => `expired ${n} d. ago`, footer: "Open Memory → Documents to review." },
  uk: { header: "⏳ <b>Скоро спливають терміни</b>", soon: (n) => `через ${n} дн.`, today: "сьогодні", over: (n) => `сплив ${n} дн. тому`, footer: "Відкрий «Пам'ять» → «Документи», щоб переглянути." },
  fr: { header: "⏳ <b>Expire bientôt</b>", soon: (n) => `dans ${n} j.`, today: "aujourd'hui", over: (n) => `expiré il y a ${n} j.`, footer: "Ouvre Mémoire → Documents pour vérifier." },
  es: { header: "⏳ <b>Vencen pronto</b>", soon: (n) => `en ${n} d.`, today: "hoy", over: (n) => `venció hace ${n} d.`, footer: "Abre Memoria → Documentos para revisar." },
};

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Дайджест «скоро истекают документы»: показываем то, что в ближайшие 60 дней
// (и уже просроченное за последние 30). Молчим, если нечего. todayISO — локальное
// «сегодня» пользователя (передаёт крон по его таймзоне).
export async function docExpiryMessage(userId: string, lang: Lang, todayISO: string): Promise<string | null> {
  let rows: any[] = [];
  try {
    const { data } = await supabaseAdmin().from("memories").select("category, title, fields").eq("user_id", userId).limit(500);
    rows = (data as any[]) || [];
  } catch { return null; }

  const found = rows
    .map((r) => { const e = documentExpiry(r.category, r.fields); return e ? { title: String(r.title || ""), date: e.date, days: daysLeft(e.date, todayISO) } : null; })
    .filter((x): x is { title: string; date: string; days: number } => !!x && x.days <= 60 && x.days >= -30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);
  if (!found.length) return null;

  const t = T[lang] || T.ru;
  const lines = [t.header, ""];
  for (const f of found) {
    const when = f.days < 0 ? t.over(-f.days) : f.days === 0 ? t.today : t.soon(f.days);
    lines.push(`• <b>${esc(f.title)}</b> — ${when}`);
  }
  lines.push("", t.footer);
  return lines.join("\n");
}
