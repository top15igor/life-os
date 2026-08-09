import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signForExport, tempFileUrl, isPdfUrl } from "@/lib/fileLink";
import { sendPhoto, sendDocumentUrl } from "@/lib/telegram";

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

  // Переименование категории: сохраняем свой ярлык в morning_prefs.memCatLabels.
  if (action === "catLabel") {
    const category = CATEGORIES.includes(body?.category) ? body.category : null;
    if (!category) return NextResponse.json({ ok: false }, { status: 400 });
    const label = typeof body?.label === "string" ? body.label.trim().slice(0, 40) : "";
    try {
      const { data } = await db.from("users").select("morning_prefs").eq("id", user.id).maybeSingle();
      const raw = (data as any)?.morning_prefs && typeof (data as any).morning_prefs === "object" ? (data as any).morning_prefs : {};
      const labels = { ...(raw.memCatLabels && typeof raw.memCatLabels === "object" ? raw.memCatLabels : {}) };
      if (label) labels[category] = label; else delete labels[category];
      await db.from("users").update({ morning_prefs: { ...raw, memCatLabels: labels } }).eq("id", user.id);
    } catch {}
    return NextResponse.json({ ok: true });
  }

  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  // Отправка файла: ссылка (на 7 дней) или прямо в Telegram владельцу.
  if (action === "share" || action === "telegram") {
    const { data: row } = await db.from("memories").select("image_url, file_url, file_name, title").eq("id", id).eq("user_id", user.id).maybeSingle();
    const raw = (row as any)?.file_url || (row as any)?.image_url || null;
    if (!raw) return NextResponse.json({ ok: false, error: "no file" }, { status: 404 });
    if (action === "share") {
      const url = await signForExport(raw);
      return NextResponse.json({ ok: !!url, url });
    }
    // Telegram: шлём в личный чат владельца (chat_id), файлом.
    const { data: u } = await db.from("users").select("chat_id").eq("id", user.id).maybeSingle();
    const chatId = Number((u as any)?.chat_id || 0);
    if (!chatId) return NextResponse.json({ ok: false, error: "no_telegram" }, { status: 400 });
    const link = await tempFileUrl(raw);
    if (!link) return NextResponse.json({ ok: false }, { status: 500 });
    const caption = String((row as any)?.title || "").slice(0, 900);
    const ok = (row as any)?.file_url || isPdfUrl(raw)
      ? await sendDocumentUrl(chatId, link, caption ? { caption } : undefined)
      : await sendPhoto(chatId, link, caption ? { caption } : undefined);
    return NextResponse.json({ ok });
  }

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
