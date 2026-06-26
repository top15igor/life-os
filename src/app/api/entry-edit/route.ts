import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyze } from "@/lib/ai";
import { attachDerived, clearDerived } from "@/lib/saveEntry";

export const runtime = "nodejs";

// Отредактировать текст своей записи: пере-разобрать через AI и заменить производные.
// Возвращает обновлённые поля для карточки (без перезагрузки страницы).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const text = String(body?.text || "").trim();
  if (!id || !text) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const { data: e } = await db.from("entries").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });

  const a = await analyze(text, user.id);

  await db
    .from("entries")
    .update({
      raw_text: text,
      summary: a.summary ?? null,
      focus: a.focus ?? null,
      mood: a.mood ?? null,
      energy: a.energy ?? null,
      health: a.health ?? null,
      importance: a.importance ?? null,
      sleep_hours: a.sleep_hours ?? null,
      weight: a.weight ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  await clearDerived(id);
  await attachDerived(user.id, id, a);

  return NextResponse.json({
    ok: true,
    entry: {
      summary: a.summary ?? text,
      mood: a.mood ?? null,
      energy: a.energy ?? null,
      health: a.health ?? null,
      cats: a.categories || [],
      tags: a.tags || [],
      people: a.people || [],
    },
  });
}
