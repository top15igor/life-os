import { supabaseAdmin } from "./supabaseAdmin";
import { type Analysis, EXPENSE_CAT_KEYS, INCOME_CAT_KEYS, FINANCE_CURRENCIES } from "./ai";

export async function saveEntry(opts: {
  userId: string;
  raw_text: string;
  source: string;
  analysis: Analysis;
}) {
  const db = supabaseAdmin();
  const owner = opts.userId;
  const a = opts.analysis;

  const { data: entry, error } = await db
    .from("entries")
    .insert({
      user_id: owner,
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

  const derived = await attachDerived(owner, entry.id, a, entry.entry_date);
  return { ...entry, financeSaved: derived.financeSaved, financeError: derived.financeError };
}

// Привязать производные данные (категории/теги/люди/задачи/дела/обещания…) к записи.
// Возвращает результат записи финансов, чтобы бот мог честно подтвердить операции.
export async function attachDerived(owner: string, id: string, a: Analysis, day?: string): Promise<{ financeSaved: number; financeError: string | null }> {
  const db = supabaseAdmin();
  let financeSaved = 0;
  let financeError: string | null = null;

  if (a.categories?.length) {
    const { data: cs } = await db.from("categories").select("id,slug").in("slug", a.categories);
    if (cs?.length) await db.from("entry_categories").insert(cs.map((c) => ({ entry_id: id, category_id: c.id })));
  }

  await linkNames(owner, "tags", "entry_tags", "tag_id", a.tags, id);
  await linkNames(owner, "people", "entry_people", "person_id", a.people, id);
  await linkNames(owner, "places", "entry_places", "place_id", a.places, id);
  await linkNames(owner, "projects", "entry_projects", "project_id", a.projects, id);

  if (a.tasks?.length) await db.from("tasks").insert(a.tasks.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.insights?.length) await db.from("insights").insert(a.insights.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.gratitude?.length) await db.from("gratitude").insert(a.gratitude.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.good_deeds?.length) {
    const rows = a.good_deeds
      .map((d: any) => (typeof d === "string" ? { text: d } : d))
      .filter((d: any) => d?.text)
      .map((d: any) => ({ entry_id: id, user_id: owner, text: d.text, kind: d.kind ?? null, person: d.person ?? null }));
    if (rows.length) await db.from("good_deeds").insert(rows);
  }
  if (a.promises?.length) {
    const rows = a.promises
      .map((p: any) => (typeof p === "string" ? { text: p } : p))
      .filter((p: any) => p?.text)
      .map((p: any) => ({ entry_id: id, user_id: owner, text: p.text, person: p.person ?? null, status: "active" }));
    if (rows.length) await db.from("promises").insert(rows);
  }
  if (a.dreams?.length) {
    const rows = a.dreams
      .map((d: any) => (typeof d === "string" ? { text: d } : d))
      .filter((d: any) => d?.text)
      .map((d: any) => ({ entry_id: id, user_id: owner, text: d.text, sphere: d.sphere ?? "other", emoji: d.emoji ?? null, status: "dream" }));
    if (rows.length) await db.from("dreams").insert(rows);
  }
  if (a.finance?.length) {
    const txDay = /^\d{4}-\d{2}-\d{2}$/.test(day || "") ? (day as string) : new Date().toISOString().slice(0, 10);
    const rows = a.finance
      .filter((f) => f && (f.kind === "income" || f.kind === "expense") && Number(f.amount) > 0)
      .map((f) => {
        const kind = f.kind;
        const allowed = kind === "income" ? INCOME_CAT_KEYS : EXPENSE_CAT_KEYS;
        const category = f.category && allowed.includes(f.category) ? f.category : "other";
        const currency = f.currency && FINANCE_CURRENCIES.includes(f.currency) ? f.currency : "USD";
        return { entry_id: id, user_id: owner, day: txDay, kind, amount: Number(f.amount), currency, category, note: f.note ? String(f.note).slice(0, 200) : null };
      });
    if (rows.length) {
      const { error: finErr } = await db.from("finance_tx").insert(rows);
      if (finErr) { financeError = finErr.message; console.error("finance insert failed", finErr); }
      else financeSaved = rows.length;
    }
  }
  return { financeSaved, financeError };
}

// Удалить все производные данные записи (для пере-разбора при правке или для удаления записи).
export async function clearDerived(id: string) {
  const db = supabaseAdmin();
  for (const tbl of ["entry_categories", "entry_tags", "entry_people", "entry_places", "entry_projects"]) {
    try { await db.from(tbl).delete().eq("entry_id", id); } catch {}
  }
  for (const tbl of ["tasks", "insights", "gratitude", "good_deeds", "promises", "finance_tx"]) {
    try { await db.from(tbl).delete().eq("entry_id", id); } catch {}
  }
}

async function linkNames(
  owner: string,
  table: string,
  linkTable: string,
  fk: string,
  names: string[] | undefined,
  entryId: string
) {
  if (!names?.length) return;
  const db = supabaseAdmin();
  const rows = names.map((name) => ({ user_id: owner, name }));
  const { data } = await db.from(table).upsert(rows, { onConflict: "user_id,name" }).select("id");
  if (data?.length) {
    await db.from(linkTable).insert(data.map((r) => ({ entry_id: entryId, [fk]: r.id })));
  }
}
