import { supabaseAdmin } from "./supabaseAdmin";

// ===== «Моя жизнь, [год]» — сборка данных для книги-летописи =====
// year === 0 означает «вся жизнь» (автобиография).

const SEL = `
  id, entry_date, source, summary, raw_text,
  mood, energy, health, importance,
  entry_categories ( categories ( slug, name ) ),
  entry_people ( people ( name ) ),
  entry_places ( places ( name ) ),
  entry_projects ( projects ( name ) )
`;

function range(year: number): { gte: string; lte: string } | null {
  if (!year) return null; // вся жизнь
  return { gte: `${year}-01-01`, lte: `${year}-12-31` };
}

// Годы, по которым есть записи (для переключателя). Плюс текущий год всегда первым.
export async function getBookYears(userId: string): Promise<{ year: number; count: number }[]> {
  const { data } = await supabaseAdmin().from("entries").select("entry_date").eq("user_id", userId);
  const m: Record<number, number> = {};
  for (const e of data || []) {
    const y = Number((e.entry_date || "").slice(0, 4));
    if (y) m[y] = (m[y] || 0) + 1;
  }
  const cur = new Date().getFullYear();
  if (!m[cur]) m[cur] = 0;
  return Object.entries(m)
    .map(([y, c]) => ({ year: Number(y), count: c }))
    .sort((a, b) => b.year - a.year);
}

function topNames(rows: any[], path: (e: any) => string[], limit = 8): { name: string; count: number }[] {
  const m: Record<string, number> = {};
  for (const e of rows) for (const n of path(e)) { const k = (n || "").trim(); if (k) m[k] = (m[k] || 0) + 1; }
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

const namesOf = (key: string, sub: string) => (e: any) => (e[key] || []).map((x: any) => x[sub]?.name).filter(Boolean);
const catsOf = (e: any) => (e.entry_categories || []).map((x: any) => x.categories?.slug).filter(Boolean);

export type BookData = Awaited<ReturnType<typeof getBookData>>;

export async function getBookData(userId: string, year: number) {
  const db = supabaseAdmin();
  const r = range(year);
  let q = db.from("entries").select(SEL).eq("user_id", userId);
  if (r) q = q.gte("entry_date", r.gte).lte("entry_date", r.lte);
  const { data: entries } = await q.order("entry_date", { ascending: true });
  const rows = entries || [];

  const days = new Set(rows.map((e: any) => e.entry_date)).size;
  const monthsMap: Record<string, number> = {};
  for (const e of rows) { const k = (e.entry_date || "").slice(0, 7); if (k) monthsMap[k] = (monthsMap[k] || 0) + 1; }
  const months = Object.entries(monthsMap).sort().map(([month, count]) => ({ month, count }));

  const voice = rows.filter((e: any) => e.source === "telegram_voice").length;
  const people = topNames(rows, namesOf("entry_people", "people"), 12);
  const places = topNames(rows, namesOf("entry_places", "places"), 10);
  const projects = topNames(rows, namesOf("entry_projects", "projects"), 8);

  const catCount: Record<string, number> = {};
  for (const e of rows) for (const s of catsOf(e)) catCount[s] = (catCount[s] || 0) + 1;
  const has = (...slugs: string[]) => slugs.reduce((n, s) => n + (catCount[s] || 0), 0);

  const avg = (k: string) => {
    const a = rows.map((e: any) => e[k]).filter((x: any) => x != null) as number[];
    return a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null;
  };
  const highlights = rows
    .filter((e: any) => (e.importance || 0) >= 4)
    .slice(-6)
    .map((e: any) => ({ date: e.entry_date, text: (e.summary || e.raw_text || "").slice(0, 160) }));

  // Доп. источники (устойчивы к отсутствию таблиц)
  const safeCount = async (qb: any): Promise<number> => { try { const { count } = await qb; return count || 0; } catch { return 0; } };
  const inYear = (qb: any) => (r ? qb.gte("created_at", r.gte + "T00:00:00Z").lte("created_at", r.lte + "T23:59:59Z") : qb);
  const [deeds, promisesDone, gratitude, insightsCount, dreamsTrue, goalsCount] = await Promise.all([
    safeCount(inYear(db.from("good_deeds").select("*", { count: "exact", head: true }).eq("user_id", userId))),
    safeCount(db.from("promises").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "done")),
    safeCount(inYear(db.from("gratitude").select("*", { count: "exact", head: true }).eq("user_id", userId))),
    safeCount(inYear(db.from("insights").select("*", { count: "exact", head: true }).eq("user_id", userId))),
    safeCount(db.from("dreams").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "done")),
    safeCount(db.from("goals").select("*", { count: "exact", head: true }).eq("user_id", userId)),
  ]);

  const stats = {
    entries: rows.length, days, voice,
    months: months.length,
    people: people.length, places: places.length, projects: projects.length,
    deeds, promisesDone, gratitude, insights: insightsCount, dreamsTrue, goals: goalsCount,
    mood: avg("mood"), energy: avg("energy"), health: avg("health"),
  };

  // Этап книги + прогресс года (честно объясняет, почему книга не «готова» в середине года).
  const now = new Date();
  const curYear = now.getFullYear();
  let stage: "current" | "past" | "life" = "current";
  let yearProgress = 100;
  if (!year) {
    stage = "life";
    yearProgress = 100;
  } else if (year < curYear) {
    stage = "past";
    yearProgress = 100;
  } else if (year > curYear) {
    stage = "current";
    yearProgress = 0;
  } else {
    stage = "current";
    const start = new Date(curYear, 0, 1).getTime();
    const end = new Date(curYear + 1, 0, 1).getTime();
    yearProgress = Math.round(((now.getTime() - start) / (end - start)) * 100);
  }

  // Наполненность глав 0..100 — сколько в главе СОБРАНО материала (не «завершённость»).
  // Пороги = «насыщенная глава за полный год», чтобы числа были реалистичными.
  const pct = (n: number, full: number) => Math.max(0, Math.min(100, Math.round((n / full) * 100)));
  const chapters = [
    { key: "overview", title: "Год в одном взгляде", icon: "ti-eye", kind: "ai", readiness: pct(stats.entries, 80) },
    { key: "months", title: "Двенадцать глав года", icon: "ti-calendar-month", kind: "months", readiness: pct(stats.months, year ? 12 : Math.max(1, stats.months)) },
    { key: "family", title: "Семья и близкие", icon: "ti-users", kind: "data", readiness: pct(has("family"), 14) },
    { key: "health", title: "Здоровье и спорт", icon: "ti-heartbeat", kind: "data", readiness: pct(has("health", "sport", "food"), 20) },
    { key: "work", title: "Работа и проекты", icon: "ti-briefcase", kind: "data", readiness: pct(has("business") + stats.projects * 2, 16) },
    { key: "travel", title: "Путешествия и места", icon: "ti-plane", kind: "data", readiness: pct(has("travel") + stats.places, 8) },
    { key: "trace", title: "Мой след", icon: "ti-heart-handshake", kind: "data", readiness: pct(stats.deeds + stats.promisesDone + stats.gratitude, 16) },
    { key: "self", title: "Что я понял о себе", icon: "ti-bulb", kind: "ai", readiness: pct(stats.insights || stats.entries, 60) },
    { key: "people", title: "Люди, которым я благодарен", icon: "ti-user-heart", kind: "ai", readiness: pct(stats.people + stats.gratitude, 14) },
    { key: "lessons", title: "Главные уроки года", icon: "ti-school", kind: "ai", readiness: pct(stats.insights || stats.entries, 60) },
  ];
  const filled = chapters.length ? Math.round(chapters.reduce((s, c) => s + c.readiness, 0) / chapters.length) : 0;
  // «Наполнено» книги за текущий год не может опережать прожитую часть года (честная верхняя граница).
  const readiness = stage === "current" && year ? Math.min(filled, yearProgress) : filled;

  return { year, stats, months, people, places, projects, highlights, chapters, readiness, stage, yearProgress };
}

// Лёгкая сводка для виджета на главной (без тяжёлых джойнов).
export async function getBookSummary(userId: string, year: number): Promise<{ year: number; entries: number; readiness: number; people: number }> {
  const db = supabaseAdmin();
  const r = range(year);
  let q = db.from("entries").select("entry_date, importance", { count: "exact" }).eq("user_id", userId);
  if (r) q = q.gte("entry_date", r.gte).lte("entry_date", r.lte);
  const { data, count } = await q;
  const rows = data || [];
  const entries = count ?? rows.length;
  const months = new Set(rows.map((e: any) => (e.entry_date || "").slice(0, 7))).size;
  // Приблизительная наполненность: записи (до 250) + охваченные месяцы (из 12).
  const byEntries = Math.min(100, Math.round((entries / 250) * 100));
  const byMonths = year ? Math.round((months / 12) * 100) : (months ? 100 : 0);
  let readiness = Math.round(byEntries * 0.6 + byMonths * 0.4);
  // Не опережать прожитую часть текущего года (честная верхняя граница).
  const now = new Date();
  if (year === now.getFullYear()) {
    const yp = Math.round(((now.getTime() - new Date(year, 0, 1).getTime()) / (new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime())) * 100);
    readiness = Math.min(readiness, yp);
  }
  let people = 0;
  try {
    const { count: pc } = await db.from("people").select("*", { count: "exact", head: true }).eq("user_id", userId);
    people = pc || 0;
  } catch {}
  return { year, entries, readiness, people };
}

// ===== Мета книги (посвящение, письма, кэш разделов). Устойчива к отсутствию таблицы. =====
export type BookMeta = { dedication: string; letter_self: string; letter_close: string; recipient: string; book_type: string; sections: Record<string, any> };

export async function getBookMeta(userId: string, year: number): Promise<BookMeta> {
  const empty: BookMeta = { dedication: "", letter_self: "", letter_close: "", recipient: "self", book_type: "year", sections: {} };
  try {
    const { data } = await supabaseAdmin().from("book_meta").select("dedication, letter_self, letter_close, recipient, book_type, sections").eq("user_id", userId).eq("year", year).maybeSingle();
    if (!data) return empty;
    return {
      dedication: data.dedication || "",
      letter_self: data.letter_self || "",
      letter_close: data.letter_close || "",
      recipient: data.recipient || "self",
      book_type: data.book_type || "year",
      sections: data.sections || {},
    };
  } catch {
    return empty;
  }
}

export async function saveBookMeta(userId: string, year: number, patch: Partial<BookMeta>): Promise<boolean> {
  try {
    await supabaseAdmin().from("book_meta").upsert({ user_id: userId, year, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id,year" });
    return true;
  } catch {
    return false;
  }
}

// Запись кэша одного AI-раздела внутрь sections (читает текущее, мёржит).
export async function cacheSection(userId: string, year: number, key: string, value: any): Promise<void> {
  try {
    const cur = await getBookMeta(userId, year);
    const sections = { ...(cur.sections || {}), [key]: value };
    await supabaseAdmin().from("book_meta").upsert({ user_id: userId, year, sections, updated_at: new Date().toISOString() }, { onConflict: "user_id,year" });
  } catch {
    // кэш необязателен
  }
}
