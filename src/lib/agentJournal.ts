import { supabaseAdmin } from "./supabaseAdmin";
import { analyze } from "./ai";
import { saveEntry } from "./saveEntry";

// Журнал действий агента и отмена последнего.
//
// Зачем: команды «убери задачу», «это в хранилище», «потратил не 500, а 300»
// удаляют и перезаписывают данные насовсем. Роутер чаще всего прав, но мы своими
// глазами видели, как он промахивается, — и раньше промах означал тихую
// безвозвратную потерю. Теперь каждый разрушающий шаг сначала записывается, а
// потом его можно вернуть одной фразой.
//
// Принцип: сохраняем СТРОКУ КАК БЫЛА, чтобы восстановление не гадало.

export type ActionKind =
  | "delete_task" | "delete_note" | "delete_goal"
  | "move_to_vault" | "move_to_diary"
  | "delete_memory" | "delete_saved" | "delete_book"
  | "bulk_tasks_done" | "bulk_tasks_delete" | "bulk_notes_delete" | "bulk_reminders_move"
  | "fix_finance" | "remove_finance";

const UNDO_WINDOW_MS = 7 * 24 * 3600_000; // неделю помним, дальше это уже не «отмени последнее»

export async function recordAction(userId: string, kind: ActionKind, summary: string, payload: any): Promise<void> {
  try {
    await supabaseAdmin().from("agent_actions").insert({
      user_id: userId,
      kind,
      summary: String(summary || "").slice(0, 300),
      payload: payload ?? {},
    });
  } catch { /* нет таблицы — фича мягко деградирует, отмена просто недоступна */ }
}

export type JournalRow = { id: string; kind: string; summary: string; undone: boolean; created_at: string };

export async function listActions(userId: string, limit = 15): Promise<JournalRow[]> {
  try {
    const { data } = await supabaseAdmin().from("agent_actions")
      .select("id, kind, summary, undone, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    return ((data as any[]) || []) as JournalRow[];
  } catch {
    return [];
  }
}

// ===== Восстановление =====

async function restore(userId: string, kind: string, p: any): Promise<boolean> {
  const db = supabaseAdmin();
  try {
    // Удаление с полок хранилища — та же логика, что и для задач: строку
    // сохранили целиком, значит можем вернуть как было.
    if (kind === "delete_memory" || kind === "delete_saved" || kind === "delete_book") {
      const table = kind === "delete_memory" ? "memories" : kind === "delete_saved" ? "saved_items" : "books";
      const row = { ...(p?.row || {}) };
      if (!Object.keys(row).length) return false;
      row.user_id = userId;
      const { error } = await db.from(table).insert(row);
      return !error;
    }

    // Массовое изменение: возвращаем ВСЕ затронутые строки разом. Иначе
    // «верни как было» после сорока правок было бы пустым обещанием.
    if (kind.startsWith("bulk_")) {
      const rows = Array.isArray(p?.rows) ? p.rows : [];
      const table = String(p?.table || "");
      if (!rows.length || !table) return false;
      const clean = rows.map((r: any) => ({ ...r, user_id: userId }));
      if (kind === "bulk_tasks_delete" || kind === "bulk_notes_delete") {
        const { error } = await db.from(table).insert(clean);
        return !error;
      }
      // Задачи закрыли или напоминания перенесли — строки на месте, возвращаем поля.
      for (const r of clean) {
        const patch = kind === "bulk_tasks_done" ? { done: r.done } : { due_at: r.due_at, notified_at: r.notified_at ?? null };
        await db.from(table).update(patch).eq("id", r.id).eq("user_id", userId);
      }
      return true;
    }

    if (kind === "delete_task" || kind === "delete_note" || kind === "delete_goal") {
      const table = kind === "delete_task" ? "tasks" : kind === "delete_note" ? "notes" : "goals";
      const row = { ...(p?.row || {}) };
      if (!row || !Object.keys(row).length) return false;
      row.user_id = userId; // на всякий случай: восстанавливаем только себе
      const { error } = await db.from(table).insert(row);
      return !error;
    }

    if (kind === "move_to_vault") {
      // Запись ушла в хранилище: убираем созданную заметку и возвращаем запись.
      if (p?.noteId) await db.from("notes").delete().eq("id", p.noteId).eq("user_id", userId);
      const text = String(p?.raw_text || "");
      if (!text) return false;
      const analysis = await analyze(text, userId);
      await saveEntry({ userId, raw_text: text, source: "undo_move", analysis, ...(p?.entry_date ? { entry_date: p.entry_date } : {}) });
      return true;
    }

    if (kind === "move_to_diary") {
      // Заметка ушла в дневник: убираем созданную запись и возвращаем заметку.
      if (p?.entryId) await db.from("entries").delete().eq("id", p.entryId).eq("user_id", userId);
      const row = { ...(p?.row || {}) };
      if (!Object.keys(row).length) return false;
      row.user_id = userId;
      const { error } = await db.from("notes").insert(row);
      return !error;
    }

    if (kind === "fix_finance") {
      if (!p?.id || typeof p?.oldAmount !== "number") return false;
      const { error } = await db.from("finance_tx").update({ amount: p.oldAmount }).eq("id", p.id).eq("user_id", userId);
      return !error;
    }

    if (kind === "remove_finance") {
      const row = { ...(p?.row || {}) };
      if (!Object.keys(row).length) return false;
      row.user_id = userId;
      const { error } = await db.from("finance_tx").insert(row);
      return !error;
    }
  } catch {
    return false;
  }
  return false;
}

export type UndoResult = { ok: boolean; summary?: string; reason?: "none" | "failed" };

// Отменить последнее незавершённое действие. Если конкретный id не задан —
// берём самое свежее: именно это человек и имеет в виду, говоря «отмени».
export async function undoLast(userId: string, actionId?: string): Promise<UndoResult> {
  const db = supabaseAdmin();
  let row: any = null;
  try {
    let q = db.from("agent_actions").select("id, kind, summary, payload, created_at")
      .eq("user_id", userId).eq("undone", false)
      .gte("created_at", new Date(Date.now() - UNDO_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false }).limit(1);
    if (actionId) q = db.from("agent_actions").select("id, kind, summary, payload, created_at")
      .eq("user_id", userId).eq("id", actionId).eq("undone", false).limit(1);
    const { data } = await q;
    row = ((data as any[]) || [])[0];
  } catch {
    return { ok: false, reason: "none" };
  }
  if (!row) return { ok: false, reason: "none" };

  const ok = await restore(userId, row.kind, row.payload);
  if (!ok) return { ok: false, reason: "failed" };

  try { await db.from("agent_actions").update({ undone: true }).eq("id", row.id); } catch {}
  return { ok: true, summary: row.summary };
}
