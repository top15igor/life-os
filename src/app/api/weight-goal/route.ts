import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWeightData } from "@/lib/weight";

export const runtime = "nodejs";

// Задать/обновить цель по весу. Стартовая точка (start_kg/start_date) фиксируется
// один раз — при первой постановке цели, чтобы прогресс считался от неё.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const target_kg = Number(body?.target_kg);
  const target_date = body?.target_date ? String(body.target_date).slice(0, 10) : null;
  if (!isFinite(target_kg) || target_kg < 20 || target_kg > 400) return NextResponse.json({ ok: false }, { status: 400 });
  if (target_date && !/^\d{4}-\d{2}-\d{2}$/.test(target_date)) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const data = await getWeightData(user.id);
  const today = new Date().toISOString().slice(0, 10);

  const row: any = { user_id: user.id, target_kg, target_date, updated_at: new Date().toISOString() };
  // Стартовую точку сохраняем только если её ещё нет.
  if (data.goal?.start_kg != null) {
    row.start_kg = data.goal.start_kg;
    row.start_date = data.goal.start_date;
  } else {
    row.start_kg = data.current?.kg ?? null;
    row.start_date = data.current?.day ?? today;
  }

  await db.from("weight_goal").upsert(row, { onConflict: "user_id" });
  return NextResponse.json({ ok: true });
}
