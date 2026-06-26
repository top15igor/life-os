import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Загрузка картинки мечты в публичное хранилище 'dreams' и привязка к мечте.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const id = String(form?.get("id") || "");
  const file = form?.get("image") as File | null;
  if (!id || !file) return NextResponse.json({ ok: false }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "too_big" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: dr } = await db.from("dreams").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!dr) return NextResponse.json({ ok: false }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
  const path = `${user.id}/${id}-${Date.now()}.${ext}`;

  try {
    const { error: upErr } = await db.storage.from("dreams").upload(path, buf, { contentType: type, upsert: true });
    if (upErr) return NextResponse.json({ ok: false, error: "upload" }, { status: 500 });
    const { data: pub } = db.storage.from("dreams").getPublicUrl(path);
    const url = pub?.publicUrl || null;
    await db.from("dreams").update({ image_url: url }).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
