import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Hit = { type: string; title: string; sub?: string; href: string };

// Полный поиск по содержимому пользователя: записи, люди, места, цели,
// инсайты, база знаний, визуальная память. Каждая выборка устойчива к
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
      const r = await fn();
      results.push(...r);
    } catch {
      // таблицы может не быть — пропускаем
    }
  };

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
      return (data || []).map((e: any) => ({
        type: "entry",
        title: (e.summary || e.raw_text || "").slice(0, 80),
        sub: e.entry_date,
        href: `/entry/${e.id}`,
      }));
    }),
    // Люди
    run(async () => {
      const { data } = await db.from("people").select("name").eq("user_id", uid).ilike("name", like).limit(4);
      return (data || []).map((p: any) => ({ type: "person", title: p.name, href: "/people" }));
    }),
    // Места
    run(async () => {
      const { data } = await db.from("places").select("name").eq("user_id", uid).ilike("name", like).limit(4);
      return (data || []).map((p: any) => ({ type: "place", title: p.name, href: "/places" }));
    }),
    // Цели
    run(async () => {
      const { data } = await db.from("goals").select("title").eq("user_id", uid).ilike("title", like).limit(4);
      return (data || []).map((g: any) => ({ type: "goal", title: g.title, href: "/goals" }));
    }),
    // Инсайты
    run(async () => {
      const { data } = await db.from("insights").select("text").eq("user_id", uid).ilike("text", like).limit(4);
      return (data || []).map((i: any) => ({ type: "insight", title: (i.text || "").slice(0, 80), href: "/goals?tab=insights" }));
    }),
    // База знаний (сохранённое из Instagram/YouTube)
    run(async () => {
      const { data } = await db
        .from("saved_items")
        .select("title, summary")
        .eq("user_id", uid)
        .or(`title.ilike.${like},summary.ilike.${like}`)
        .limit(4);
      return (data || []).map((k: any) => ({ type: "knowledge", title: (k.title || k.summary || "").slice(0, 80), href: "/knowledge" }));
    }),
    // Визуальная память
    run(async () => {
      const { data } = await db
        .from("memories")
        .select("title, summary")
        .eq("user_id", uid)
        .or(`title.ilike.${like},summary.ilike.${like}`)
        .limit(4);
      return (data || []).map((m: any) => ({ type: "memory", title: (m.title || m.summary || "").slice(0, 80), href: "/memory" }));
    }),
  ]);

  return NextResponse.json({ ok: true, results: results.slice(0, 20) });
}
