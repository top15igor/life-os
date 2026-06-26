import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const CATEGORIES = ["document", "moment", "thing", "person", "place", "project", "info", "other"];

// Изменить категорию или удалить «память» (только свою).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();

  if (action === "delete") {
    await db.from("memories").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "category") {
    const category = CATEGORIES.includes(body?.category) ? body.category : "other";
    await db.from("memories").update({ category, status: "ok" }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "note") {
    const note = String(body?.note || "").slice(0, 2000);
    await db.from("memories").update({ note }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
