import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ACCENTS = new Set(["indigo", "green", "amber", "pink", "dark"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const db = supabaseAdmin();

  if (action === "create") {
    const title = String(body?.title || "").trim().slice(0, 80);
    if (!title) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    const row = {
      user_id: user.id,
      title,
      description: String(body?.description || "").trim().slice(0, 300),
      emoji: String(body?.emoji || "").slice(0, 8),
      accent: ACCENTS.has(body?.accent) ? body.accent : "indigo",
      status: body?.status === "done" ? "done" : "active",
      public: !!body?.public,
    };
    try {
      const { data } = await db.from("paths").insert(row).select("id").maybeSingle();
      return NextResponse.json({ ok: true, id: data?.id });
    } catch {
      return NextResponse.json({ ok: false, error: "no_table" }, { status: 500 });
    }
  }

  if (action === "update") {
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    const patch: any = {};
    if (typeof body?.title === "string") patch.title = body.title.trim().slice(0, 80);
    if (typeof body?.description === "string") patch.description = body.description.trim().slice(0, 300);
    if (typeof body?.emoji === "string") patch.emoji = body.emoji.slice(0, 8);
    if (ACCENTS.has(body?.accent)) patch.accent = body.accent;
    if (body?.status === "done" || body?.status === "active") patch.status = body.status;
    if (typeof body?.public === "boolean") patch.public = body.public;
    await db.from("paths").update(patch).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("public_pages").update({ path_id: null }).eq("user_id", user.id).eq("path_id", id);
    await db.from("paths").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
