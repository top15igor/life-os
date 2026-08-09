import { supabaseAdmin } from "./supabaseAdmin";
import { searchMemories } from "./semanticMemory";
import { semanticIds, indexRow, type Shelf } from "./vaultIndex";

// Найти нужное и поправить — а не только то, что сказано минуту назад.
//
// Дневник копится годами, а править агент умел только последнюю запись, да и
// то сегодняшнюю. Всё, что старше одного сообщения, приходилось искать руками
// на сайте — то есть шкаф снова превращался в чулан: положить легко, тронуть
// нельзя.
//
// Ищем тем же способом, что и всё остальное: смыслом плюс буквами. И ОБЯЗАТЕЛЬНО
// называем, что именно нашли, — «поправил запись за 14 июля про Лиссабон».
// Молча править не то, о чём просили, хуже, чем не править вовсе.

const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е");

function stems(q: string): string[] {
  return norm(q)
    .split(/[^a-zа-яіїєґ0-9]+/i)
    .filter((w) => w.length >= 3)
    .map((w) => w.slice(0, w.length <= 4 ? 3 : 4));
}

const hits = (hay: string, st: string[]) => st.filter((x) => norm(hay).includes(x)).length;

// ===== Записи дневника =====

export type FoundEntry = { id: string; date: string; text: string };

export async function findEntry(userId: string, query: string): Promise<FoundEntry | null> {
  const q = (query || "").trim();
  if (!q) return null;
  const db = supabaseAdmin();
  const st = stems(q);

  const scored = new Map<string, { row: any; score: number }>();

  // По смыслу.
  try {
    for (const h of await searchMemories(userId, q, 8)) {
      if (h.similarity < 0.25) continue;
      scored.set(String(h.id), {
        row: { id: h.id, entry_date: h.entry_date, raw_text: h.raw_text, summary: h.summary },
        score: h.similarity * 6,
      });
    }
  } catch {
    /* pgvector не настроен — останутся буквы */
  }

  // По буквам: даты, имена и номера смысл не ловит.
  try {
    const { data } = await db
      .from("entries")
      .select("id, entry_date, raw_text, summary")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(400);
    for (const e of ((data as any[]) || [])) {
      const n = hits(`${e.raw_text || ""} ${e.summary || ""}`, st);
      if (!n) continue;
      const cur = scored.get(String(e.id));
      const bonus = n === st.length && st.length >= 2 ? 4 : 0;
      scored.set(String(e.id), { row: e, score: (cur?.score || 0) + n + bonus });
    }
  } catch {
    return null;
  }

  const best = [...scored.values()].sort((a, b) => b.score - a.score)[0];
  // Порог: лучше честно не найти, чем поправить чужую запись.
  if (!best || best.score < 2) return null;
  return {
    id: String(best.row.id),
    date: String(best.row.entry_date || "").slice(0, 10),
    text: String(best.row.raw_text || best.row.summary || "").slice(0, 300),
  };
}

// ===== Вещи на полках =====

export type Thing = { id: string; title: string };

const SHELF: Record<string, { table: Shelf; title: string; cols: string }> = {
  memory: { table: "memories", title: "title", cols: "id, title, summary" },
  saved: { table: "saved_items", title: "title", cols: "id, title, summary" },
  book: { table: "books", title: "title", cols: "id, title, author" },
};

export async function findThing(userId: string, kind: keyof typeof SHELF, query: string): Promise<Thing | null> {
  const cfg = SHELF[kind];
  const q = (query || "").trim();
  if (!cfg || !q) return null;
  const st = stems(q);
  const db = supabaseAdmin();

  const scored = new Map<string, { title: string; score: number }>();
  try {
    const sim = await semanticIds(cfg.table, userId, q, 6);
    const ids = [...sim.keys()];
    if (ids.length) {
      const { data } = await db.from(cfg.table).select(cfg.cols).eq("user_id", userId).in("id", ids);
      for (const r of ((data as any[]) || [])) {
        const s = sim.get(String(r.id)) || 0;
        if (s < 0.25) continue;
        scored.set(String(r.id), { title: String(r[cfg.title] || ""), score: s * 6 });
      }
    }
  } catch {
    /* без индекса — только буквы */
  }

  try {
    const { data } = await db.from(cfg.table).select(cfg.cols).eq("user_id", userId).limit(300);
    for (const r of ((data as any[]) || [])) {
      const hay = Object.values(r).filter((v) => typeof v === "string").join(" ");
      const n = hits(hay, st);
      if (!n) continue;
      const cur = scored.get(String(r.id));
      const bonus = n === st.length && st.length >= 2 ? 4 : 0;
      scored.set(String(r.id), { title: String(r[cfg.title] || cur?.title || ""), score: (cur?.score || 0) + n + bonus });
    }
  } catch {
    return null;
  }

  const arr = [...scored.entries()].sort((a, b) => b[1].score - a[1].score);
  if (!arr.length || arr[0][1].score < 2) return null;
  return { id: arr[0][0], title: arr[0][1].title };
}

// Удаление найденного. Строку возвращаем целиком — она уходит в журнал,
// чтобы «верни как было» действительно вернуло.
export async function deleteThing(userId: string, kind: keyof typeof SHELF, id: string): Promise<any | null> {
  const cfg = SHELF[kind];
  if (!cfg) return null;
  const db = supabaseAdmin();
  try {
    const { data: row } = await db.from(cfg.table).select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (!row) return null;
    const { error } = await db.from(cfg.table).delete().eq("id", id).eq("user_id", userId);
    if (error) return null;
    return row;
  } catch {
    return null;
  }
}

// Переименование найденного — самая частая правка после удаления.
export async function renameThing(userId: string, kind: keyof typeof SHELF, id: string, title: string): Promise<boolean> {
  const cfg = SHELF[kind];
  const name = (title || "").trim().slice(0, 120);
  if (!cfg || !name) return false;
  try {
    const { error } = await supabaseAdmin().from(cfg.table).update({ [cfg.title]: name }).eq("id", id).eq("user_id", userId);
    if (error) return false;
    // Название входит в смысловой указатель — иначе поиск помнит старое.
    await indexRow(cfg.table, id, userId);
    return true;
  } catch {
    return false;
  }
}
