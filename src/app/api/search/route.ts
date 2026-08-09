import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { searchEverything } from "@/lib/vaultSearch";

export const runtime = "nodejs";

type Hit = { type: string; title: string; sub?: string; href: string };

// Приоритет показа по типу (меньше = выше).
// Полка смыслового поиска → тип в выдаче (у типов уже есть приоритет и иконки).
const SEM_TYPE: Record<string, string> = { diary: "entry", note: "note", knowledge: "knowledge", doc: "memory", book: "book" };

const PR: Record<string, number> = {
  entry: 0, dream: 1, goal: 1, task: 2, insight: 2, person: 3, place: 3,
  project: 3, path: 3, deed: 4, promise: 4, gratitude: 4, note: 4, book: 5, knowledge: 5, memory: 5, finance: 6,
};

// Полный поиск по всему содержимому пользователя. Каждая выборка устойчива к
// отсутствию таблицы (try/catch) и ограничена по количеству.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, results: [] }, { status: 401 });

  const raw = (req.nextUrl.searchParams.get("q") || "").trim();
  const q = raw.replace(/[%,()]/g, " ").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, results: [] });

  const db = supabaseAdmin();
  const uid = user.id;
  const like = `%${q}%`;
  const results: Hit[] = [];

  const run = async (fn: () => Promise<Hit[]>) => {
    try {
      results.push(...(await fn()));
    } catch {
      // таблицы может не быть — пропускаем
    }
  };
  const simple = (table: string, col: string, type: string, href: string, limit = 4) =>
    run(async () => {
      const { data } = await db.from(table).select(col).eq("user_id", uid).ilike(col, like).limit(limit);
      return (data || []).map((r: any) => ({ type, title: String(r[col] || "").slice(0, 80), href }));
    });
  const orSearch = (table: string, cols: string[], pick: string[], type: string, href: string, limit = 4) =>
    run(async () => {
      const { data } = await db
        .from(table)
        .select(pick.join(", "))
        .eq("user_id", uid)
        .or(cols.map((c) => `${c}.ilike.${like}`).join(","))
        .limit(limit);
      return (data || []).map((r: any) => ({ type, title: String(pick.map((p) => r[p]).find(Boolean) || "").slice(0, 80), href }));
    });

  await Promise.all([
    // Записи дневника
    run(async () => {
      const { data } = await db
        .from("entries")
        .select("id, entry_date, summary, raw_text")
        .eq("user_id", uid)
        .or(`summary.ilike.${like},raw_text.ilike.${like}`)
        .order("entry_date", { ascending: false })
        .limit(6);
      return (data || []).map((e: any) => ({ type: "entry", title: (e.summary || e.raw_text || "").slice(0, 80), sub: e.entry_date, href: `/entry/${e.id}` }));
    }),
    // Мечты (Карта желаний)
    simple("dreams", "text", "dream", "/goals?tab=dreams"),
    // Цели
    simple("goals", "title", "goal", "/goals"),
    // Задачи
    simple("tasks", "text", "task", "/tasks"),
    // Инсайты
    run(async () => {
      const { data } = await db.from("insights").select("text").eq("user_id", uid).ilike("text", like).limit(4);
      return (data || []).map((i: any) => ({ type: "insight", title: (i.text || "").slice(0, 80), href: "/goals?tab=ideas" }));
    }),
    // Люди / Места
    simple("people", "name", "person", "/people"),
    simple("places", "name", "place", "/places"),
    // Проекты / Пути
    simple("projects", "name", "project", "/projects"),
    orSearch("paths", ["title", "description"], ["title", "description"], "path", "/paths"),
    // Мой след: добрые дела, обещания, благодарность
    simple("good_deeds", "text", "deed", "/trace"),
    simple("promises", "text", "promise", "/trace"),
    simple("gratitude", "text", "gratitude", "/trace"),
    // База знаний / Визуальная память
    orSearch("saved_items", ["title", "summary"], ["title", "summary"], "knowledge", "/knowledge"),
    orSearch("memories", ["title", "summary"], ["title", "summary"], "memory", "/memory"),
    // Финансы (по заметке к операции)
    simple("finance_tx", "note", "finance", "/finance"),
  ]);

  // Поиск ПО СМЫСЛУ поверх буквального. Выше искали подстроку: «жильё» не
  // найдёт «квартиру», хотя лежит ровно то, что нужно. Добавляем то, что
  // нашлось по смыслу, и не дублируем уже найденное.
  //
  // Только на запросах от четырёх букв: короткие — это почти всегда навигация
  // («дне», «фин»), там смысл лишний, а лишний вызов в наборе текста — нет.
  if (q.length >= 4) {
    try {
      const found = await searchEverything(uid, q, 8);
      const have = new Set(results.map((r) => `${r.type}|${r.title.toLowerCase()}`));
      for (const f of found) {
        const type = SEM_TYPE[f.src] || "entry";
        const title = (f.title || f.text || "").trim().slice(0, 80);
        if (!title) continue;
        const k = `${type}|${title.toLowerCase()}`;
        if (have.has(k)) continue;
        have.add(k);
        results.push({ type, title, sub: f.date || undefined, href: f.path || "/" });
      }
    } catch {
      // смысловой слой не настроен — остаётся буквальный поиск, как раньше
    }
  }

  results.sort((a, b) => (PR[a.type] ?? 9) - (PR[b.type] ?? 9));

  // ?debug=1 владельцу: с какой полки и с каким баллом пришла каждая находка.
  // Настраивать поиск «на глаз по выдаче» — верный способ ошибиться.
  if (req.nextUrl.searchParams.get("debug") === "1" && uid === "00000000-0000-0000-0000-000000000000") {
    const raw = await searchEverything(uid, q, 20).catch(() => []);
    return NextResponse.json({ ok: true, results: results.slice(0, 24), raw: raw.map((f) => ({ src: f.src, score: Number(f.score.toFixed(2)), title: f.title || f.text.slice(0, 60) })) });
  }

  return NextResponse.json({ ok: true, results: results.slice(0, 24) });
}
