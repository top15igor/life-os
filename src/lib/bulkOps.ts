import { supabaseAdmin } from "./supabaseAdmin";
import { recordAction } from "./agentJournal";

// Массовые операции: «перенеси все напоминания на понедельник», «отметь все
// задачи по тетрадке сделанными».
//
// Главное правило здесь — НИЧЕГО не делать сразу. Одна неверно понятая фраза
// может переписать полдневника, а «верни как было» для сорока строк — слабое
// утешение. Поэтому всегда два шага: сначала показываем, ЧТО именно попадёт
// под изменение и сколько этого, и только по кнопке применяем.
//
// Отложенный замысел живёт в общих настройках пользователя: он нужен ровно до
// следующего нажатия, заводить ради него таблицу незачем.

export type BulkKind = "tasks_done" | "tasks_delete" | "reminders_move" | "notes_delete";

export type BulkPlan = {
  kind: BulkKind;
  query: string;
  // человеческое описание того, что произойдёт
  what: string;
  // на когда переносим (для напоминаний)
  when?: string;
  items: { id: string; label: string }[];
};

const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е");
const stems = (q: string) =>
  norm(q)
    .split(/[^a-zа-яіїєґ0-9]+/i)
    .filter((w) => w.length >= 3)
    .map((w) => w.slice(0, w.length <= 4 ? 3 : 4));

const CFG: Record<BulkKind, { table: string; field: string }> = {
  tasks_done: { table: "tasks", field: "text" },
  tasks_delete: { table: "tasks", field: "text" },
  notes_delete: { table: "notes", field: "text" },
  reminders_move: { table: "reminders", field: "text" },
};

// Что попадёт под изменение. Пустой запрос = «все» — это законно («перенеси
// все напоминания»), но именно поэтому показ обязателен.
export async function planBulk(userId: string, kind: BulkKind, query: string, when?: string): Promise<BulkPlan | null> {
  const c = CFG[kind];
  if (!c) return null;
  const db = supabaseAdmin();
  try {
    let q: any = db.from(c.table).select("*").eq("user_id", userId).limit(300);
    if (kind === "tasks_done" || kind === "tasks_delete") q = q.eq("done", false);
    if (kind === "reminders_move") q = q.eq("done", false).gte("due_at", new Date().toISOString());
    const { data } = await q;
    let rows = ((data as any[]) || []).filter((r) => String(r[c.field] || "").trim());

    const st = stems(query);
    if (st.length) {
      rows = rows
        .map((r) => ({ r, n: st.filter((x) => norm(String(r[c.field])).includes(x)).length }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((x) => x.r);
    }
    if (!rows.length) return null;

    return {
      kind,
      query,
      when,
      what: "",
      items: rows.slice(0, 50).map((r) => ({ id: String(r.id), label: String(r[c.field]).slice(0, 70) })),
    };
  } catch {
    return null;
  }
}

// Отложить замысел до подтверждения.
export async function rememberPlan(userId: string, plan: BulkPlan): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    prefs.pendingBulk = { kind: plan.kind, when: plan.when || null, ids: plan.items.map((i) => i.id), at: Date.now() };
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch {
    /* без этого просто не сработает подтверждение */
  }
}

// Применить отложенное. Возвращает, сколько строк реально изменилось.
export async function applyPlan(userId: string): Promise<{ kind: BulkKind; n: number } | null> {
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    const p = prefs.pendingBulk;
    // Час — щедрый срок: за это время человек либо подтвердил, либо забыл.
    if (!p?.ids?.length || Date.now() - Number(p.at || 0) > 3600_000) return null;

    const ids: string[] = p.ids;
    const kind: BulkKind = p.kind;
    const c = CFG[kind];
    if (!c) return null;

    // Снимок «как было» — чтобы «верни как было» вернуло всё разом.
    const { data: before } = await db.from(c.table).select("*").in("id", ids).eq("user_id", userId);
    const rows = (before as any[]) || [];

    if (kind === "tasks_done") await db.from("tasks").update({ done: true }).in("id", ids).eq("user_id", userId);
    else if (kind === "tasks_delete" || kind === "notes_delete") await db.from(c.table).delete().in("id", ids).eq("user_id", userId);
    else if (kind === "reminders_move" && p.when) await db.from("reminders").update({ due_at: p.when, notified_at: null }).in("id", ids).eq("user_id", userId);

    delete prefs.pendingBulk;
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);

    await recordAction(userId, `bulk_${kind}` as any, `Массовое изменение: ${rows.length}`, { table: c.table, kind, rows, when: p.when || null });
    return { kind, n: rows.length };
  } catch {
    return null;
  }
}

export async function forgetPlan(userId: string): Promise<void> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    delete prefs.pendingBulk;
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch {
    /* нечего забывать */
  }
}
