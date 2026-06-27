import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { preparePublicVersion } from "@/lib/publish";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const action = String(body?.action || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  // запись должна принадлежать пользователю
  const { data: e } = await db.from("entries").select("id, raw_text, summary").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });

  if (action === "prepare") {
    const pub = await preparePublicVersion(e.raw_text, e.summary, user.id);
    return NextResponse.json({ ok: true, ...pub });
  }

  if (action === "publish") {
    const title = String(body?.title || "").trim().slice(0, 120);
    const text = String(body?.text || "").trim().slice(0, 2000);
    const privacy = body?.privacy === "link" ? "link" : "public";
    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    try {
      await db.from("public_pages").upsert({ user_id: user.id, entry_id: id, title, text, privacy }, { onConflict: "entry_id" });
    } catch {
      return NextResponse.json({ ok: false, error: "no_table" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "unpublish") {
    await db.from("public_pages").delete().eq("user_id", user.id).eq("entry_id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
