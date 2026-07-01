import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  // Ручное объединение: записи из sourceIds переезжают в targetId, дубли-проекты удаляются.
  if (action === "merge") {
    const targetId = Number(body?.targetId);
    const sourceIds = [...new Set((Array.isArray(body?.sourceIds) ? body.sourceIds : []).map(Number))]
      .filter((n) => Number.isFinite(n) && n !== targetId);
    if (!targetId || !sourceIds.length) return NextResponse.json({ ok: false }, { status: 400 });

    // Проверяем, что и цель, и источники принадлежат пользователю.
    const { data: owned } = await db.from("projects").select("id").eq("user_id", user.id).in("id", [targetId, ...sourceIds]);
    const ownedSet = new Set(((owned as any[]) ?? []).map((r) => r.id));
    if (!ownedSet.has(targetId)) return NextResponse.json({ ok: false }, { status: 404 });
    const srcs = sourceIds.filter((sid) => ownedSet.has(sid));

    let moved = 0;
    for (const sid of srcs) {
      const { data: links } = await db.from("entry_projects").select("entry_id").eq("project_id", sid);
      const entryIds = [...new Set(((links as any[]) ?? []).map((l) => l.entry_id))];
      if (entryIds.length) {
        const { data: existing } = await db.from("entry_projects").select("entry_id").eq("project_id", targetId).in("entry_id", entryIds);
        const already = new Set(((existing as any[]) ?? []).map((l) => l.entry_id));
        const toAdd = entryIds.filter((e) => !already.has(e));
        if (toAdd.length) {
          await db.from("entry_projects").insert(toAdd.map((e) => ({ entry_id: e, project_id: targetId })));
          moved += toAdd.length;
        }
      }
      await db.from("entry_projects").delete().eq("project_id", sid);
      await db.from("projects").delete().eq("id", sid).eq("user_id", user.id);
    }
    return NextResponse.json({ ok: true, merged: srcs.length, moved });
  }

  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  // Проверяем, что проект принадлежит пользователю.
  const { data: proj } = await db.from("projects").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!proj) return NextResponse.json({ ok: false }, { status: 404 });

  if (action === "rename") {
    const name = String(body?.name || "").trim();
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("projects").update({ name }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    // Удаляем только связи и сам проект — записи остаются.
    await db.from("entry_projects").delete().eq("project_id", id);
    await db.from("projects").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
