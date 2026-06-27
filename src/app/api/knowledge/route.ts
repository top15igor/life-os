import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractInstagramUrl, importInstagram } from "@/lib/instagram";
import { askKnowledge } from "@/lib/knowledge";
import { canonicalFolder } from "@/lib/ai";
import { getLocale } from "@/lib/locale";

export const runtime = "nodejs";
export const maxDuration = 60;

const PATCH_KEYS = ["title", "summary", "note", "topic", "favorite", "done"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  // Добавить пост по ссылке прямо со страницы (как через бота).
  if (action === "add") {
    const url = extractInstagramUrl(String(body?.url || ""));
    if (!url) return NextResponse.json({ ok: false, error: "bad_url" }, { status: 400 });
    const r = await importInstagram(user.id, url, await getLocale());
    if (r.ok === false) return NextResponse.json({ ok: false, error: r.reason }, { status: 400 });
    if (!r.saved || !r.id) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    const { data } = await db
      .from("saved_items")
      .select("id, source, url, author, kind, title, topic, summary, key_points, tags, image_url, note, favorite, done, position, created_at")
      .eq("id", r.id)
      .eq("user_id", user.id)
      .single();
    return NextResponse.json({ ok: true, item: data });
  }

  // Спросить по базе.
  if (action === "ask") {
    const answer = await askKnowledge(user.id, String(body?.q || ""), await getLocale());
    return NextResponse.json({ ok: true, answer });
  }

  if (action === "delete") {
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("saved_items").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  // Правка карточки: заголовок/выжимка/заметка/папка(topic)/избранное/применил.
  if (action === "update") {
    const id = String(body?.id || "");
    const patch = body?.patch || {};
    if (!id || typeof patch !== "object") return NextResponse.json({ ok: false }, { status: 400 });
    const upd: Record<string, any> = {};
    for (const k of PATCH_KEYS) {
      if (k in patch) {
        if (k === "favorite" || k === "done") upd[k] = !!patch[k];
        else upd[k] = patch[k] == null ? null : String(patch[k]).slice(0, 4000);
      }
    }
    if (!Object.keys(upd).length) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("saved_items").update(upd).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  // Переименовать папку: переносим все карточки из одной темы в другую.
  if (action === "renameFolder") {
    const from = String(body?.from || "");
    const to = String(body?.to || "").slice(0, 200).trim();
    if (!from || !to) return NextResponse.json({ ok: false }, { status: 400 });
    await db.from("saved_items").update({ topic: to }).eq("topic", from).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  // Навести порядок: разложить все карточки по фиксированным папкам.
  if (action === "tidy") {
    const loc = await getLocale();
    const { data } = await db.from("saved_items").select("id, topic").eq("user_id", user.id);
    const changes = ((data as any[]) || []).map((d) => ({ id: d.id, to: canonicalFolder(d.topic, loc) })).filter((c, i) => c.to !== (data as any[])[i].topic);
    await Promise.all(changes.map((c) => db.from("saved_items").update({ topic: c.to }).eq("id", c.id).eq("user_id", user.id)));
    return NextResponse.json({ ok: true, changed: changes.length });
  }

  // Ручной порядок: сохраняем позиции по присланному списку id.
  if (action === "reorder") {
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.map((x: any) => String(x)) : [];
    if (!ids.length) return NextResponse.json({ ok: false }, { status: 400 });
    await Promise.all(ids.map((id, i) => db.from("saved_items").update({ position: i + 1 }).eq("id", id).eq("user_id", user.id)));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
