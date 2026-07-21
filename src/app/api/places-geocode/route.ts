import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { geocodeName } from "@/lib/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Геокодирует места пользователя, у которых ещё нет координат. Пачками —
// вызывать повторно, пока remaining > 0. Результат кэшируется в places,
// поэтому каждое название запрашивается один раз.
export async function POST(req: NextRequest) {
  const db = supabaseAdmin();
  // Обычный режим — текущий пользователь. Служебный (по ключу владельца) —
  // чтобы прогнать геокодинг разом, не открывая сайт.
  const key = req.nextUrl.searchParams.get("key");
  let user: { id: string };
  if (key && key === process.env.TELEGRAM_WEBHOOK_SECRET) {
    const chat = req.nextUrl.searchParams.get("chat") || process.env.TELEGRAM_ALLOWED_CHAT_ID;
    const { data: u } = await db.from("users").select("id").eq("chat_id", Number(chat)).maybeSingle();
    if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
    user = { id: (u as any).id };
  } else {
    user = await requireUser();
  }
  const batch = Math.min(Number(req.nextUrl.searchParams.get("batch")) || 25, 50);
  const retry = req.nextUrl.searchParams.get("retry") === "1"; // повторить и «не найдено»

  let sel = db.from("places").select("id, name, geo_status").eq("user_id", user.id).limit(batch);
  sel = retry ? sel.is("lat", null) : sel.is("geo_status", null);
  const { data: rows, error } = await sel;
  if (error) return NextResponse.json({ ok: false, error: error.message, hint: "нужна миграция places_geo.sql" }, { status: 500 });
  if (!rows || !rows.length) return NextResponse.json({ ok: true, done: true, geocoded: 0, notfound: 0, remaining: 0 });

  let geocoded = 0;
  let notfound = 0;
  for (const p of rows as any[]) {
    const res = await geocodeName(p.name);
    if (res === null) break; // нет ключа или сбой API — прекращаем, чтобы не крутить впустую
    if (res === "notfound") {
      await db.from("places").update({ geo_status: "notfound", geocoded_at: new Date().toISOString() }).eq("id", p.id);
      notfound++;
      continue;
    }
    await db
      .from("places")
      .update({ lat: res.lat, lng: res.lng, country: res.country, formatted: res.formatted, geo_status: "ok", geocoded_at: new Date().toISOString() })
      .eq("id", p.id);
    geocoded++;
  }

  const { count } = await db.from("places").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("geo_status", null);
  return NextResponse.json({ ok: true, done: (count || 0) === 0, geocoded, notfound, remaining: count || 0 });
}
