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
  const db = supabaseAdmin();

  // Массовые операции над выделенными карточками (управление базой).
  // ids — набор id; folder=null убирает из папки, строка — кладёт в папку.
  if (action === "bulkFolder" || action === "bulkDelete") {
    const ids = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)).filter(Boolean).slice(0, 500) : [];
    if (!ids.length) return NextResponse.json({ ok: false }, { status: 400 });
    if (action === "bulkDelete") {
      await db.from("memories").delete().in("id", ids).eq("user_id", user.id);
      return NextResponse.json({ ok: true, count: ids.length });
    }
    const folder = typeof body?.folder === "string" && body.folder.trim() ? body.folder.trim().slice(0, 60) : null;
    try {
      await db.from("memories").update({ folder }).in("id", ids).eq("user_id", user.id);
    } catch {
      return NextResponse.json({ ok: false, error: "no folder column? apply memory_folders.sql" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, count: ids.length });
  }

  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "delete") {
    await db.from("memories").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "folder") {
    const folder = typeof body?.folder === "string" && body.folder.trim() ? body.folder.trim().slice(0, 60) : null;
    try { await db.from("memories").update({ folder }).eq("id", id).eq("user_id", user.id); } catch {}
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
