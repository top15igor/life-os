import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEntries, getAllTasks, getGoals, cats, tagList, people, places, projects } from "@/lib/queries";
import { getExperiments } from "@/lib/lab";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Полный экспорт всех данных пользователя — «забери всё своё».
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();

  const entriesRaw = await getEntries(user.id, 2000);
  const entries = entriesRaw.map((e: any) => ({
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
  }));

  const [tasks, goals, experiments] = await Promise.all([getAllTasks(user.id), getGoals(user.id), getExperiments(user.id)]);
  const { data: insights } = await db.from("insights").select("text, created_at, entry_id").eq("user_id", user.id);
  const { data: gratitude } = await db.from("gratitude").select("text, created_at, entry_id").eq("user_id", user.id);
  let biographer: any[] = [];
  try {
    const { data } = await db.from("biographer_chats").select("question, answer, created_at").eq("user_id", user.id);
    biographer = data || [];
  } catch {}
  let finance: any[] = [];
  try {
    const { data } = await db.from("finance_tx").select("day, kind, amount, currency, category, note, created_at").eq("user_id", user.id).order("day", { ascending: false });
    finance = data || [];
  } catch {}

  const exportData = {
    service: "LIFE OS",
    exported_at: new Date().toISOString(),
    profile: { name: user.name },
    counts: { entries: entries.length, tasks: tasks.length, insights: (insights || []).length, gratitude: (gratitude || []).length, goals: goals.length, experiments: experiments.length, finance: finance.length },
    entries,
    tasks,
    insights: insights || [],
    gratitude: gratitude || [],
    goals,
    experiments,
    biographer,
    finance,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="lifeos-export-${date}.json"`,
    },
  });
}
