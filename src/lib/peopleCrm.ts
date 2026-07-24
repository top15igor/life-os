import { supabaseAdmin } from "./supabaseAdmin";

// ===== «Люди» как личная CRM отношений =====
// Всё строится на уже существующих данных: entry_people (упоминания в записях),
// promises.person и good_deeds.person (свободный текст имени). Новых таблиц нет.

// Нормализованный ключ имени — ТА ЖЕ логика, что в saveEntry.linkNames
// («Аня», «аня!» и «А-ня» — один человек).
export function normNameKey(s: string): string {
  return (s || "").toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, "");
}

export type PersonAgg = { id: number | null; name: string; count: number; lastDate: string; firstDate: string; hidden: boolean };

// Агрегат по людям из последних записей: сколько упоминаний, первое и последнее.
export async function getPeopleAgg(userId: string, limit = 400): Promise<PersonAgg[]> {
  const db = supabaseAdmin();
  let rows: any[] = [];
  try {
    const { data, error } = await db
      .from("entries")
      .select("entry_date, entry_people ( people ( id, name, hidden ) )")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    rows = data || [];
  } catch {
    // колонки hidden может не быть (entities_hidden.sql не применён)
    const { data } = await db
      .from("entries")
      .select("entry_date, entry_people ( people ( id, name ) )")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(limit);
    rows = data || [];
  }
  const map = new Map<string, PersonAgg>();
  for (const e of rows) {
    for (const l of e.entry_people || []) {
      const p = (l as any).people;
      if (!p?.name) continue;
      const cur = map.get(p.name) || { id: p.id ?? null, name: p.name, count: 0, lastDate: e.entry_date, firstDate: e.entry_date, hidden: !!p.hidden };
      cur.count++;
      if (e.entry_date > cur.lastDate) cur.lastDate = e.entry_date;
      if (e.entry_date < cur.firstDate) cur.firstDate = e.entry_date;
      map.set(p.name, cur);
    }
  }
  return [...map.values()];
}

export function daysSince(dateISO: string, todayISO?: string): number {
  const today = todayISO ? new Date(todayISO + "T00:00:00Z").getTime() : Date.now();
  return Math.max(0, Math.round((today - new Date(dateISO + "T00:00:00Z").getTime()) / 86400000));
}

export type StaleContact = { id: number | null; name: string; count: number; days: number; lastDate: string; promise?: string };

// «Давно не общались»: близкие (упомянуты не раз), пропавшие из записей на 2+ недели.
// Сортируем по близости (частоте упоминаний) — сначала самые важные люди.
export async function getStaleContacts(
  userId: string,
  opts: { minMentions?: number; staleDays?: number; maxDays?: number; top?: number } = {},
): Promise<StaleContact[]> {
  const { minMentions = 2, staleDays = 14, maxDays = 180, top = 3 } = opts;
  const agg = await getPeopleAgg(userId);
  const stale = agg
    .filter((p) => !p.hidden && p.count >= minMentions)
    .map((p) => ({ id: p.id, name: p.name, count: p.count, days: daysSince(p.lastDate), lastDate: p.lastDate }))
    .filter((p) => p.days >= staleDays && p.days <= maxDays)
    .sort((a, b) => b.count - a.count || b.days - a.days)
    .slice(0, top) as StaleContact[];
  if (!stale.length) return stale;

  // Активные обещания этим людям — самый тёплый повод написать.
  try {
    const { data: proms } = await supabaseAdmin()
      .from("promises")
      .select("text, person")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);
    const byKey = new Map<string, string>();
    for (const pr of proms || []) {
      const k = normNameKey((pr as any).person || "");
      if (k && !byKey.has(k)) byKey.set(k, (pr as any).text);
    }
    for (const s of stale) {
      const hit = byKey.get(normNameKey(s.name));
      if (hit) s.promise = hit;
    }
  } catch {
    // таблицы promises может не быть — обещания просто не подмешиваем
  }
  return stale;
}

export type PersonCard = {
  id: number;
  name: string;
  count: number;
  lastDate: string | null;
  firstDate: string | null;
  avgMood: number | null;
  entries: any[];
  promises: { id: string; text: string; status: string; created_at: string }[];
  deeds: { id: string; text: string; kind?: string; created_at: string }[];
};

// Карточка человека: таймлайн упоминаний + обещания и добрые дела для него.
export async function getPersonCard(userId: string, personId: number): Promise<PersonCard | null> {
  const db = supabaseAdmin();
  const { data: person } = await db.from("people").select("id, name").eq("id", personId).eq("user_id", userId).maybeSingle();
  if (!person) return null;

  const { data: links } = await db
    .from("entry_people")
    .select("entries ( id, user_id, entry_date, entry_time, summary, raw_text, mood, source )")
    .eq("person_id", personId);
  const entries = (links || [])
    .map((l: any) => l.entries)
    .filter((e: any) => e && e.user_id === userId)
    .sort((a: any, b: any) => `${b.entry_date} ${b.entry_time || ""}`.localeCompare(`${a.entry_date} ${a.entry_time || ""}`));

  const moods = entries.map((e: any) => e.mood).filter((m: any) => m != null);
  const avgMood = moods.length ? Math.round((moods.reduce((s: number, m: number) => s + m, 0) / moods.length) * 10) / 10 : null;

  const key = normNameKey(person.name);
  let promises: PersonCard["promises"] = [];
  let deeds: PersonCard["deeds"] = [];
  try {
    const { data } = await db.from("promises").select("id, text, person, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300);
    promises = (data || []).filter((p: any) => normNameKey(p.person || "") === key);
  } catch {}
  try {
    const { data } = await db.from("good_deeds").select("id, text, kind, person, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300);
    deeds = (data || []).filter((d: any) => normNameKey(d.person || "") === key);
  } catch {}

  return {
    id: person.id,
    name: person.name,
    count: entries.length,
    lastDate: entries[0]?.entry_date || null,
    firstDate: entries[entries.length - 1]?.entry_date || null,
    avgMood,
    entries,
    promises,
    deeds,
  };
}

// ===== Бот-дайджест «Повод написать» (раз в неделю) =====

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Lang = "ru" | "en" | "uk" | "fr" | "es";

const DIGEST: Record<Lang, { header: string; intro: string; ago: (n: number) => string; promise: (name: string, text: string) => string; footer: string }> = {
  ru: {
    header: "💛 <b>Повод написать</b>",
    intro: "Эти люди давно не появлялись в твоих записях:",
    ago: (n) => `${n} дн. назад`,
    promise: (name, text) => `🤝 Обещание для ${name}: «${text}»`,
    footer: "Напиши кому-то из них — даже пара слов делает связь тёплой. Потом расскажи мне, как прошло 🙂",
  },
  en: {
    header: "💛 <b>A reason to reach out</b>",
    intro: "These people haven't appeared in your entries for a while:",
    ago: (n) => `${n} days ago`,
    promise: (name, text) => `🤝 Your promise to ${name}: “${text}”`,
    footer: "Drop one of them a line — even a few words keep the bond warm. Then tell me how it went 🙂",
  },
  uk: {
    header: "💛 <b>Привід написати</b>",
    intro: "Ці люди давно не з'являлися у твоїх записах:",
    ago: (n) => `${n} дн. тому`,
    promise: (name, text) => `🤝 Обіцянка для ${name}: «${text}»`,
    footer: "Напиши комусь із них — навіть кілька слів роблять зв'язок теплішим. Потім розкажи мені, як минуло 🙂",
  },
  fr: {
    header: "💛 <b>Une raison d'écrire</b>",
    intro: "Ces personnes n'apparaissent plus dans tes entrées depuis un moment :",
    ago: (n) => `il y a ${n} j`,
    promise: (name, text) => `🤝 Ta promesse à ${name} : « ${text} »`,
    footer: "Écris à l'un d'eux — même quelques mots gardent le lien vivant. Raconte-moi ensuite 🙂",
  },
  es: {
    header: "💛 <b>Un motivo para escribir</b>",
    intro: "Estas personas llevan tiempo sin aparecer en tus entradas:",
    ago: (n) => `hace ${n} días`,
    promise: (name, text) => `🤝 Tu promesa a ${name}: «${text}»`,
    footer: "Escríbele a alguno — hasta unas palabras mantienen viva la conexión. Luego cuéntame cómo fue 🙂",
  },
};

// Готовое HTML-сообщение для бота (или null, если некого напоминать).
export async function peopleDigestMessage(userId: string, lang: Lang): Promise<string | null> {
  const stale = await getStaleContacts(userId, { top: 3 });
  if (!stale.length) return null;
  const m = DIGEST[lang] || DIGEST.ru;
  const lines = [m.header, "", m.intro];
  for (const s of stale) lines.push(`• <b>${escHtml(s.name)}</b> — ${m.ago(s.days)}`);
  const withPromise = stale.find((s) => s.promise);
  if (withPromise) lines.push("", m.promise(escHtml(withPromise.name), escHtml(withPromise.promise!.slice(0, 120))));
  lines.push("", m.footer);
  return lines.join("\n");
}
