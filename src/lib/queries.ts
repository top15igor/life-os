import { supabaseAdmin } from "./supabaseAdmin";

const LIST_SELECT = `
  id, entry_date, entry_time, source, raw_text, summary,
  mood, energy, health, focus, importance, sleep_hours, weight,
  entry_categories ( categories ( name, slug, color ) ),
  entry_tags ( tags ( name ) ),
  entry_people ( people ( name ) ),
  entry_projects ( projects ( name ) ),
  entry_places ( places ( name ) )
`;

const DETAIL_SELECT = `
  ${LIST_SELECT},
  tasks ( id, text, done ),
  insights ( text ),
  gratitude ( text )
`;

export type Entry = any;

export async function getEntries(userId: string, limit = 100): Promise<Entry[]> {
  const { data } = await supabaseAdmin()
    .from("entries")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getEntry(id: string, userId: string): Promise<Entry | null> {
  const { data } = await supabaseAdmin()
    .from("entries")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getToday(userId: string): Promise<{ date: string | null; entries: Entry[] }> {
  const all = await getEntries(userId, 100);
  if (!all.length) return { date: null, entries: [] };
  const latest = all[0].entry_date;
  return { date: latest, entries: all.filter((e) => e.entry_date === latest) };
}

export function cats(e: Entry): { name: string; slug: string; color: string }[] {
  return (e.entry_categories || []).map((x: any) => x.categories).filter(Boolean);
}
export function tagList(e: Entry): string[] {
  return (e.entry_tags || []).map((x: any) => x.tags?.name).filter(Boolean);
}
export function people(e: Entry): string[] {
  return (e.entry_people || []).map((x: any) => x.people?.name).filter(Boolean);
}
export function projects(e: Entry): string[] {
  return (e.entry_projects || []).map((x: any) => x.projects?.name).filter(Boolean);
}
export function places(e: Entry): string[] {
  return (e.entry_places || []).map((x: any) => x.places?.name).filter(Boolean);
}

export async function getInsights(userId: string) {
  const { data } = await supabaseAdmin()
    .from("insights")
    .select("text, created_at, entry_id, entries ( entry_date )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  return data || [];
}

// Сколько дней подряд (включая последний день с записью) велся дневник.
export async function getStreak(userId: string): Promise<number> {
  const { data } = await supabaseAdmin()
    .from("entries")
    .select("entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(180);
  if (!data?.length) return 0;
  const days = Array.from(new Set(data.map((d: any) => d.entry_date)));
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i - 1] + "T00:00:00").getTime() - new Date(days[i] + "T00:00:00").getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// Привычка письма: написал ли сегодня, текущий стрик, цепочка последних N дней, всего дней.
export async function getHabit(
  userId: string,
  todayISO: string,
  days = 14,
): Promise<{ wroteToday: boolean; streak: number; chain: { date: string; active: boolean }[]; totalDays: number }> {
  const { data } = await supabaseAdmin()
    .from("entries")
    .select("entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(500);
  const set = new Set<string>((data || []).map((d: any) => d.entry_date));
  const totalDays = set.size;
  const wroteToday = set.has(todayISO);

  const dayMs = 86400000;
  const todayT = new Date(todayISO + "T00:00:00Z").getTime();
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

  // Стрик: от сегодня (если есть запись) или от вчера, и назад без пропусков.
  let streak = 0;
  const start = wroteToday ? 0 : set.has(iso(todayT - dayMs)) ? 1 : -1;
  if (start >= 0) {
    let i = start;
    while (set.has(iso(todayT - i * dayMs))) {
      streak++;
      i++;
    }
  }

  // Цепочка последних N дней (от старых к новым).
  const chain: { date: string; active: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = iso(todayT - i * dayMs);
    chain.push({ date: d, active: set.has(d) });
  }

  return { wroteToday, streak, chain, totalDays };
}

// ===== «Мой след»: добрые дела и обещания (устойчивы к отсутствию таблиц) =====
export async function getTodayDeeds(userId: string, todayISO: string): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin().from("good_deeds").select("text").eq("user_id", userId).gte("created_at", todayISO + "T00:00:00Z").order("created_at", { ascending: false });
    return (data || []).map((d: any) => d.text);
  } catch {
    return [];
  }
}

export async function getActivePromises(userId: string, limit = 3): Promise<{ id: string; text: string; person?: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("promises").select("id, text, person").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export async function getAllPromises(userId: string): Promise<{ id: string; text: string; person?: string; status: string; created_at: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("promises").select("id, text, person, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
    return data || [];
  } catch {
    return [];
  }
}

export async function getGoodDeeds(userId: string, limit = 100): Promise<{ id: string; text: string; kind?: string; person?: string; created_at: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("good_deeds").select("id, text, kind, person, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export async function getTraceWeek(userId: string): Promise<{ deeds: number; gratitude: number; promisesDone: number; peopleHelped: number }> {
  const db = supabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  let deeds = 0;
  let peopleHelped = 0;
  try {
    const { data: gd } = await db.from("good_deeds").select("person").eq("user_id", userId).gte("created_at", weekAgo);
    deeds = (gd || []).length;
    peopleHelped = new Set((gd || []).map((d: any) => (d.person || "").trim().toLowerCase()).filter(Boolean)).size;
  } catch {}
  const count = async (q: any) => {
    try {
      const { count } = await q;
      return count || 0;
    } catch {
      return 0;
    }
  };
  const [gratitude, promisesDone] = await Promise.all([
    count(db.from("gratitude").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", weekAgo)),
    count(db.from("promises").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "done")),
  ]);
  return { deeds, gratitude, promisesDone, peopleHelped };
}

export async function getDreams(userId: string): Promise<{ id: string; sphere: string; text: string; emoji?: string; image_url?: string; status: string; created_at: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("dreams").select("id, sphere, text, emoji, image_url, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300);
    return data || [];
  } catch {
    return [];
  }
}

export async function getMemories(userId: string): Promise<{ id: string; category: string; title: string; summary: string; fields: { label: string; value: string }[]; mem_date: string | null; image_url: string | null; status: string; created_at: string }[]> {
  try {
    const { data } = await supabaseAdmin().from("memories").select("id, category, title, summary, fields, mem_date, image_url, status, note, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(300);
    return data || [];
  } catch {
    return [];
  }
}

export async function getEntryCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin().from("entries").select("*", { count: "exact", head: true }).eq("user_id", userId);
  return count || 0;
}

// Запись «в этот день» месяц или год назад (для воспоминаний).
export async function getOnThisDay(userId: string, todayISO: string): Promise<{ period: "year" | "month"; summary: string } | null> {
  const d = new Date(todayISO + "T12:00:00");
  const monthAgo = new Date(d); monthAgo.setMonth(d.getMonth() - 1);
  const yearAgo = new Date(d); yearAgo.setFullYear(d.getFullYear() - 1);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  const { data } = await supabaseAdmin()
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", userId)
    .in("entry_date", [fmt(yearAgo), fmt(monthAgo)]);
  if (!data?.length) return null;
  const y = data.find((e: any) => e.entry_date === fmt(yearAgo));
  const pick = y || data[0];
  return { period: y ? "year" : "month", summary: (pick.summary || pick.raw_text || "").slice(0, 140) };
}

export async function getBiographerHistory(userId: string, limit = 30) {
  const { data } = await supabaseAdmin()
    .from("biographer_chats")
    .select("id, question, answer, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getAllTasks(userId: string) {
  const { data } = await supabaseAdmin()
    .from("tasks")
    .select("id, text, done, entry_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getProjectsManaged(userId: string) {
  const db = supabaseAdmin();
  const { data: projs } = await db.from("projects").select("id, name").eq("user_id", userId);
  const projects = projs || [];
  if (!projects.length) return [];
  const ids = projects.map((p) => p.id);
  const { data: links } = await db.from("entry_projects").select("project_id, entries ( id, entry_date, summary, raw_text )").in("project_id", ids);
  const byProj: Record<string, any[]> = {};
  for (const l of links || []) {
    const e = (l as any).entries;
    if (e) (byProj[(l as any).project_id] ||= []).push(e);
  }
  return projects
    .map((p) => {
      const es = (byProj[p.id] || []).sort((a: any, b: any) => (b.entry_date || "").localeCompare(a.entry_date || ""));
      return { id: p.id, name: p.name, count: es.length, lastDate: es[0]?.entry_date || null, entries: es.slice(0, 3) };
    })
    .sort((a, b) => b.count - a.count);
}

export async function getProject(userId: string, id: string) {
  const db = supabaseAdmin();
  const { data: proj } = await db.from("projects").select("id, name").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!proj) return null;
  const { data: links } = await db.from("entry_projects").select("entries ( id, entry_date, entry_time, summary, raw_text, source )").eq("project_id", id);
  const entries = (links || []).map((l: any) => l.entries).filter(Boolean).sort((a: any, b: any) => `${b.entry_date} ${b.entry_time || ""}`.localeCompare(`${a.entry_date} ${a.entry_time || ""}`));
  const entryIds = entries.map((e: any) => e.id);
  let tasks: any[] = [];
  let insights: any[] = [];
  if (entryIds.length) {
    const { data: tk } = await db.from("tasks").select("id, text, done, entry_id").in("entry_id", entryIds);
    tasks = (tk || []).sort((a, b) => Number(a.done) - Number(b.done));
    const { data: ins } = await db.from("insights").select("text, entry_id").in("entry_id", entryIds);
    insights = ins || [];
  }
  return { id: proj.id, name: proj.name, entries, tasks, insights };
}

export async function getOpenTasks(userId: string, limit = 5) {
  const { data } = await supabaseAdmin()
    .from("tasks")
    .select("id, text, done")
    .eq("user_id", userId)
    .eq("done", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getRecentGratitude(userId: string, limit = 3) {
  const { data } = await supabaseAdmin()
    .from("gratitude")
    .select("text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map((g: any) => g.text);
}

export async function getGoals(userId: string) {
  const { data } = await supabaseAdmin()
    .from("goals")
    .select("id, title, progress, year, color")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function getMonths(userId: string): Promise<{ month: string; count: number }[]> {
  const { data } = await supabaseAdmin().from("entries").select("entry_date").eq("user_id", userId);
  const m: Record<string, number> = {};
  for (const e of data || []) {
    const k = (e.entry_date || "").slice(0, 7);
    if (k) m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m).sort().reverse().map(([month, count]) => ({ month, count }));
}
