import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Управление сущностями людей/мест: переименование, объединение дублей, скрытие из книги.
const CFG: Record<string, { table: string; link: string; fk: string }> = {
  people: { table: "people", link: "entry_people", fk: "person_id" },
  places: { table: "places", link: "entry_places", fk: "place_id" },
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "places" ? "places" : "people";
  const cfg = CFG[kind];
  const db = supabaseAdmin();
  const id = Number(body.id);
  const action = String(body.action || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  // Проверка владельца.
  const { data: own } = await db.from(cfg.table).select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!own) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  async function mergeInto(sourceId: number, targetId: number) {
    const { data: links } = await db.from(cfg.link).select("entry_id").eq(cfg.fk, sourceId);
    const rows = (links || []).map((l: any) => ({ entry_id: l.entry_id, [cfg.fk]: targetId }));
    if (rows.length) await db.from(cfg.link).upsert(rows, { onConflict: `entry_id,${cfg.fk}`, ignoreDuplicates: true });
    await db.from(cfg.link).delete().eq(cfg.fk, sourceId);
    await db.from(cfg.table).delete().eq("id", sourceId).eq("user_id", user.id);
  }

  if (action === "hide" || action === "unhide") {
    const { error } = await db.from(cfg.table).update({ hidden: action === "hide" }).eq("id", id).eq("user_id", user.id);
    if (error) return NextResponse.json({ ok: false, error: "no_hidden_column" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "rename") {
    const name = String(body.name || "").trim().slice(0, 80);
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    // Если такое имя уже есть у другого — объединяем в него (иначе нарушим unique).
    const { data: ex } = await db.from(cfg.table).select("id").eq("user_id", user.id).ilike("name", name).neq("id", id).limit(1);
    if (ex && ex[0]?.id) { await mergeInto(id, ex[0].id); return NextResponse.json({ ok: true, merged: true }); }
    await db.from(cfg.table).update({ name }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "merge") {
    const targetId = Number(body.targetId);
    if (!targetId || targetId === id) return NextResponse.json({ ok: false }, { status: 400 });
    const { data: tgt } = await db.from(cfg.table).select("id").eq("id", targetId).eq("user_id", user.id).maybeSingle();
    if (!tgt) return NextResponse.json({ ok: false }, { status: 404 });
    await mergeInto(id, targetId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "bad action" }, { status: 400 });
}
