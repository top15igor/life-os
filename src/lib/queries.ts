import { supabaseAdmin } from "./supabaseAdmin";

const LIST_SELECT = `
  id, entry_date, entry_time, source, raw_text, summary,
  mood, energy, health, focus, importance,
  entry_categories ( categories ( name, slug, color ) ),
  entry_tags ( tags ( name ) ),
  entry_people ( people ( name ) )
`;

const DETAIL_SELECT = `
  ${LIST_SELECT},
  entry_places ( places ( name ) ),
  entry_projects ( projects ( name ) ),
  tasks ( id, text, done ),
  insights ( text ),
  gratitude ( text )
`;

export type Entry = any;

export async function getEntries(limit = 100): Promise<Entry[]> {
  const { data } = await supabaseAdmin()
    .from("entries")
    .select(LIST_SELECT)
    .order("entry_date", { ascending: false })
    .order("entry_time", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { data } = await supabaseAdmin().from("entries").select(DETAIL_SELECT).eq("id", id).single();
  return data;
}

// «Сегодня» = записи самого свежего дня, где они есть (надёжно при любом часовом поясе).
export async function getToday(): Promise<{ date: string | null; entries: Entry[] }> {
  const all = await getEntries(100);
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

export function kyivDateLabel(d?: string): string {
  const date = d ? new Date(d + "T12:00:00") : new Date();
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Kyiv",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function greeting(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", hour12: false }).format(new Date())
  );
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}
