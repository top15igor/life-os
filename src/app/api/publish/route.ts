import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { preparePublicVersion } from "@/lib/publish";
import { getHandle } from "@/lib/handle";

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
    const row: any = { user_id: user.id, entry_id: id, title, text, privacy };
    if (body?.path_id !== undefined) row.path_id = body.path_id || null; // привязка к пути (Фаза 2)
    try {
      await db.from("public_pages").upsert(row, { onConflict: "entry_id" });
    } catch {
      return NextResponse.json({ ok: false, error: "no_table" }, { status: 500 });
    }
    // Публикация = явное согласие сделать видимым. Авто-включаем публичную
    // страницу (если ещё выключена), чтобы опубликованная запись реально
    // появилась на /p/<handle>, а не молча терялась за скрытым тумблером.
    // Отключить целиком можно в «Поделиться». Возвращаем handle для ссылки.
    let handle = "";
    try {
      handle = await getHandle(user.id, user.name);
      await db.from("public_profile").update({ enabled: true }).eq("user_id", user.id);
    } catch {}
    return NextResponse.json({ ok: true, handle });
  }

  if (action === "unpublish") {
    await db.from("public_pages").delete().eq("user_id", user.id).eq("entry_id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
