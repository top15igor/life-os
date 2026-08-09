import { supabaseAdmin } from "./supabaseAdmin";
import { embedToVectorString, embedBatch } from "./embeddings";

// Смысловой указатель по всем полкам хранилища.
//
// Дневник давно ищется по смыслу, а документы, заметки, база знаний и книги
// искались по буквам: не совпало слово — не нашлось. Человек кладёт «Договор
// аренды квартиры», через год спрашивает «где бумаги по жилью» — и получает
// «не нашёл», хотя всё лежит на месте. Здесь мы даём остальным полкам ту же
// память на смысл: у каждой строки появляется вектор, и поиск сравнивает
// смыслы, а не буквы.
//
// Всё мягко деградирует: нет колонки embedding (миграция не запущена) или нет
// ключа OpenAI — поиск просто работает по буквам, как раньше.

export type Shelf = "memories" | "notes" | "saved_items" | "books";

// Из какой строки собирается текст для вектора. Важно: кладём то, ЧТО человек
// будет вспоминать — заголовок, суть, поля документа, — а не служебные поля.
const TEXT_OF: Record<Shelf, (r: any) => string> = {
  // Документ описываем в первую очередь тем, ЧТО ЭТО ЗА ВЕЩЬ, и только потом
  // подробностями. Если валить всё вперемешку, вектор документа определяют
  // имена, номера и даты — и «удостоверение личности» не находит паспорт,
  // потому что в паспорте больше фамилии, чем паспорта. Значения полей режем:
  // длинный номер не делает документ понятнее, а вектор смещает.
  memories: (m) => {
    const labels = Array.isArray(m.fields) ? m.fields.map((f: any) => String(f?.label ?? "").trim()).filter(Boolean) : [];
    const values = Array.isArray(m.fields)
      ? m.fields.map((f: any) => `${String(f?.label ?? "").trim()}: ${String(f?.value ?? "").trim().slice(0, 60)}`).filter((x: string) => x.length > 2)
      : [];
    return [
      m.title,
      m.category ? `Категория: ${m.category}` : "",
      m.summary,
      labels.length ? `Что внутри: ${labels.join(", ")}` : "",
      values.join("\n"),
      m.note,
    ]
      .filter(Boolean)
      .join("\n");
  },
  notes: (n) => String(n.text || ""),
  saved_items: (s) =>
    [s.title, s.topic, s.summary, Array.isArray(s.key_points) ? s.key_points.join("\n") : "", Array.isArray(s.tags) ? s.tags.join(" ") : "", s.note]
      .filter(Boolean)
      .join("\n"),
  books: (b) => [b.title, b.author, b.genre, b.description, b.review, b.notes].filter(Boolean).join("\n"),
};

// Какие колонки нужны, чтобы этот текст собрать.
const COLS: Record<Shelf, string> = {
  memories: "id, category, title, summary, fields, note",
  notes: "id, text",
  saved_items: "id, title, topic, summary, key_points, tags, note",
  books: "id, title, author, genre, description, review, notes",
};

export function shelfText(shelf: Shelf, row: any): string {
  try {
    return (TEXT_OF[shelf](row) || "").trim();
  } catch {
    return "";
  }
}

// ===== Запись: проиндексировать одну строку =====

// Вызывается «в фоне» после сохранения — ответ человеку ждать вектора не должен.
export async function indexRow(shelf: Shelf, id: string, userId: string): Promise<void> {
  if (!id || !userId) return;
  try {
    const db = supabaseAdmin();
    const { data } = await db.from(shelf).select(COLS[shelf]).eq("id", id).eq("user_id", userId).maybeSingle();
    if (!data) return;
    const text = shelfText(shelf, data);
    if (!text) return;
    const vec = await embedToVectorString(text);
    if (!vec) return;
    await db.from(shelf).update({ embedding: vec }).eq("id", id).eq("user_id", userId);
  } catch {
    // нет колонки / нет ключа — полка просто останется на буквенном поиске
  }
}

// Не ждать индексацию, но и не потерять ошибку молча в консоли.
export function indexRowSoon(shelf: Shelf, id: string, userId: string): void {
  indexRow(shelf, id, userId).catch(() => {});
}

// ===== Чтение: найти по смыслу =====

export type Sim = Map<string, number>;

export async function semanticIds(shelf: Shelf, userId: string, query: string, k = 8): Promise<Sim> {
  const out: Sim = new Map();
  const vec = await embedToVectorString(query);
  if (!vec) return out;
  try {
    const { data, error } = await supabaseAdmin().rpc("match_shelf", {
      shelf,
      query_embedding: vec,
      match_user: userId,
      match_count: k,
    });
    if (error) return out;
    for (const r of (data as any[]) || []) out.set(String(r.id), Number(r.similarity) || 0);
  } catch {
    /* функции ещё нет — молчим */
  }
  return out;
}

// Один вектор запроса на весь поиск: иначе на четыре полки уходило бы четыре
// одинаковых обращения к OpenAI.
export async function semanticAll(userId: string, query: string, k = 8): Promise<Record<Shelf, Sim>> {
  const empty = { memories: new Map(), notes: new Map(), saved_items: new Map(), books: new Map() } as Record<Shelf, Sim>;
  const vec = await embedToVectorString(query);
  if (!vec) return empty;
  const shelves: Shelf[] = ["memories", "notes", "saved_items", "books"];
  await Promise.all(
    shelves.map(async (shelf) => {
      try {
        const { data, error } = await supabaseAdmin().rpc("match_shelf", { shelf, query_embedding: vec, match_user: userId, match_count: k });
        if (error) return;
        for (const r of (data as any[]) || []) empty[shelf].set(String(r.id), Number(r.similarity) || 0);
      } catch {
        /* полка без индекса — пропускаем */
      }
    })
  );
  return empty;
}

// ===== Догнать то, что лежало до включения =====

export type BackfillResult = { shelf: Shelf; done: number; left: number }[];

// Индексирует пачками всё, у чего вектора ещё нет. Возвращает, сколько
// осталось: вызывающий сам решает, звать ли ещё раз.
export async function backfillShelves(limitPerShelf = 100, reindex?: Shelf | "all"): Promise<BackfillResult> {
  const db = supabaseAdmin();
  const shelves: Shelf[] = ["memories", "notes", "saved_items", "books"];
  const out: BackfillResult = [];

  // Пересборка: когда меняется рецепт текста, старые векторы описывают вещь
  // по-старому. Сбрасываем их, дальше обычное подметание досчитает заново.
  if (reindex) {
    for (const shelf of shelves) {
      if (reindex !== "all" && reindex !== shelf) continue;
      try {
        await db.from(shelf).update({ embedding: null }).not("embedding", "is", null);
      } catch {
        /* колонки нет — нечего сбрасывать */
      }
    }
  }

  for (const shelf of shelves) {
    let done = 0;
    let left = 0;
    try {
      const { data } = await db.from(shelf).select(`${COLS[shelf]}, user_id`).is("embedding", null).limit(limitPerShelf);
      const rows = ((data as any[]) || []).filter((r) => shelfText(shelf, r));
      if (rows.length) {
        // По 50 в один запрос к OpenAI: дешевле и быстрее, чем по одному.
        for (let i = 0; i < rows.length; i += 50) {
          const chunk = rows.slice(i, i + 50);
          const vecs = await embedBatch(chunk.map((r) => shelfText(shelf, r)));
          await Promise.all(
            chunk.map(async (r, j) => {
              if (!vecs[j]) return;
              await db.from(shelf).update({ embedding: vecs[j] }).eq("id", r.id);
              done++;
            })
          );
        }
      }
      const { count } = await db.from(shelf).select("id", { count: "exact", head: true }).is("embedding", null);
      left = Number(count) || 0;
    } catch {
      // колонки нет — полку пропускаем целиком
    }
    out.push({ shelf, done, left });
  }
  return out;
}
