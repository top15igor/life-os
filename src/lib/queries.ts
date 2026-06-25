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
