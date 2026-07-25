import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEntriesPage, cats, tagList, people, places, projects } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Полный экспорт всех данных пользователя — «забери всё своё».
// Принцип: в архив попадает ВСЁ содержимое аккаунта (записи, финансы, книги,
// здоровье, путешествия, память…), но никогда — токены/секреты интеграций.

const SECRET_KEY = /token|secret|hash|pin/i;

function clean(rows: any[]): any[] {
  return rows.map((r) => {
    const o: any = { ...r };
    for (const k of Object.keys(o)) {
      if (k === "user_id" || SECRET_KEY.test(k)) delete o[k];
    }
    return o;
  });
}

async function fetchPage(db: any, table: string, col: string, uid: string, from: number, to: number, order: string | null) {
  let q = db.from(table).select("*").eq(col, uid).range(from, to);
  if (order) q = q.order(order, { ascending: false });
  const { data, error } = await q;
  return error ? null : data || [];
}

// Вся таблица пользователя постранично; несуществующая таблица → пустой список.
async function fetchAll(db: any, table: string, uid: string, col = "user_id"): Promise<any[]> {
  const out: any[] = [];
  for (let page = 0; page < 30; page++) {
    const from = page * 1000;
    let rows = await fetchPage(db, table, col, uid, from, from + 999, "created_at");
    if (rows === null) rows = await fetchPage(db, table, col, uid, from, from + 999, null);
    if (rows === null) break;
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// секция экспорта → таблица в базе
const TABLES: [string, string][] = [
  ["tasks", "tasks"],
  ["goals", "goals"],
  ["insights", "insights"],
  ["gratitude", "gratitude"],
  ["experiments", "experiments"],
  ["biographer", "biographer_chats"],
  ["finance", "finance_tx"],
  ["finance_budgets", "finance_budget"],
  ["finance_categories", "finance_categories"],
  ["finance_goals", "finance_goals"],
  ["finance_recurring", "finance_recurring"],
  ["books", "books"],
  ["book_quotes", "book_quotes"],
  ["book_meta", "book_meta"],
  ["wishlist", "wishes"],
  ["knowledge", "saved_items"],
  ["dreams", "dreams"],
  ["mood_calendar", "day_moods"],
  ["health_metrics", "health_metrics"],
  ["weight_log", "weight_log"],
  ["weight_goal", "weight_goal"],
  ["reminders", "reminders"],
  ["trips", "trips"],
  ["memories", "memories"],
  ["promises", "promises"],
  ["good_deeds", "good_deeds"],
  ["people", "people"],
  ["places", "places"],
  ["projects", "projects"],
  ["tags", "tags"],
  ["time_capsules", "time_capsules"],
  ["heirs", "heirs"],
  ["paths", "paths"],
  ["public_pages", "public_pages"],
  ["companion_chat", "companion_messages"],
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();

  // Записи — в человекочитаемом виде, со всеми связями, без обрезания по 1000.
  const entries: any[] = [];
  for (let page = 0; page < 100; page++) {
    const raw = await getEntriesPage(user.id, page * 1000, page * 1000 + 999);
    for (const e of raw as any[]) {
      entries.push({
        date: e.entry_date,
        time: (e.entry_time || "").slice(0, 5),
        source: e.source,
        text: e.raw_text,
        summary: e.summary,
        mood: e.mood,
        energy: e.energy,
        health: e.health,
        sleep_hours: e.sleep_hours,
        weight: e.weight,
        focus: e.focus,
        categories: cats(e).map((c: any) => c.slug),
        tags: tagList(e),
        people: people(e),
        places: places(e),
        projects: projects(e),
      });
    }
    if (raw.length < 1000) break;
  }

  const sections: Record<string, any[]> = {};
  await Promise.all(
    TABLES.map(async ([key, table]) => {
      sections[key] = clean(await fetchAll(db, table, user.id));
    })
  );

  let finance_settings: any = null;
  try {
    const { data } = await db.from("finance_settings").select("base_currency, rates").eq("user_id", user.id).maybeSingle();
    finance_settings = data || null;
  } catch {}

  const counts: Record<string, number> = { entries: entries.length };
  for (const [key] of TABLES) counts[key] = sections[key]?.length || 0;

  const exportData = {
    service: "LIFE OS",
    exported_at: new Date().toISOString(),
    profile: { name: user.name },
    note: "Полный экспорт данных аккаунта. Фото и файлы приложены ссылками (image_url / file_url). Токены и секреты интеграций не экспортируются никогда.",
    counts,
    entries,
    ...sections,
    finance_settings,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="lifeos-export-${date}.json"`,
    },
  });
}
