import { supabaseAdmin } from "./supabaseAdmin";
import type { Analysis } from "./ai";

// Один владелец на MVP. Позже заменим на реальные user_id (мультипользователь).
const OWNER = process.env.OWNER_USER_ID || "00000000-0000-0000-0000-000000000000";

export async function saveEntry(opts: {
  raw_text: string;
  source: string;
  analysis: Analysis;
}) {
  const db = supabaseAdmin();
  const a = opts.analysis;

  const { data: entry, error } = await db
    .from("entries")
    .insert({
      user_id: OWNER,
      raw_text: opts.raw_text,
      source: opts.source,
      summary: a.summary ?? null,
      focus: a.focus ?? null,
      mood: a.mood ?? null,
      energy: a.energy ?? null,
      health: a.health ?? null,
      importance: a.importance ?? null,
      sleep_hours: a.sleep_hours ?? null,
      weight: a.weight ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const id = entry.id;

  // Категории (по slug из разрешённого списка)
  if (a.categories?.length) {
    const { data: cats } = await db.from("categories").select("id,slug").in("slug", a.categories);
    if (cats?.length) {
      await db.from("entry_categories").insert(cats.map((c) => ({ entry_id: id, category_id: c.id })));
    }
  }

  // Сущности по имени: создаём, если нет, и связываем с записью
  await linkNames("tags", "entry_tags", "tag_id", a.tags, id);
  await linkNames("people", "entry_people", "person_id", a.people, id);
  await linkNames("places", "entry_places", "place_id", a.places, id);
  await linkNames("projects", "entry_projects", "project_id", a.projects, id);

  // Извлечённые элементы
  if (a.tasks?.length) await db.from("tasks").insert(a.tasks.map((t) => ({ entry_id: id, user_id: OWNER, text: t })));
  if (a.insights?.length) await db.from("insights").insert(a.insights.map((t) => ({ entry_id: id, user_id: OWNER, text: t })));
  if (a.gratitude?.length) await db.from("gratitude").insert(a.gratitude.map((t) => ({ entry_id: id, user_id: OWNER, text: t })));

  return entry;
}

async function linkNames(
  table: string,
  linkTable: string,
  fk: string,
  names: string[] | undefined,
  entryId: string
) {
  if (!names?.length) return;
  const db = supabaseAdmin();
  const rows = names.map((name) => ({ user_id: OWNER, name }));
  const { data } = await db.from(table).upsert(rows, { onConflict: "user_id,name" }).select("id");
  if (data?.length) {
    await db.from(linkTable).insert(data.map((r) => ({ entry_id: entryId, [fk]: r.id })));
  }
}
