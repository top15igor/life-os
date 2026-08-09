import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { indexRowSoon } from "@/lib/vaultIndex";
import { notesToText, parseNotesText } from "@/lib/notesIO";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Заметки: список и действия (добавить / закрепить / удалить).
// Справочные факты живут отдельно от дневника — см. supabase/notes.sql.

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("notes")
    .select("id, text, pinned, created_at")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });

  // ?export=md — выгрузка файлом (открывается в Заметках iPhone, Obsidian, где угодно).
  if (req.nextUrl.searchParams.get("export") === "md") {
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(notesToText(data || [], date), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="lifeos-notes-${date}.md"`,
      },
    });
  }
  return NextResponse.json({ ok: true, notes: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  if (body?.action === "add") {
    const text = String(body?.text || "").trim().slice(0, 2000);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { data, error } = await db.from("notes").insert({ user_id: user.id, text }).select("id, text, pinned, created_at").single();
    if ((data as any)?.id) indexRowSoon("notes", String((data as any).id), user.id);
    if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
    return NextResponse.json({ ok: true, note: data });
  }
  if (body?.action === "import") {
    // Вставленный текст или содержимое файла → пачка заметок.
    const items = Array.isArray(body?.items)
      ? body.items.map((x: any) => String(x || "").trim().slice(0, 2000)).filter(Boolean).slice(0, 500)
      : parseNotesText(String(body?.text || ""), body?.mode === "lines" ? "lines" : "blocks");
    if (!items.length) return NextResponse.json({ ok: false, error: "empty" }, { status: 200 });
    const { data, error } = await db.from("notes").insert(items.map((text: string) => ({ user_id: user.id, text })))
      .select("id, text, pinned, created_at");
    if (error) return NextResponse.json({ ok: false, error: "no_table" }, { status: 200 });
    return NextResponse.json({ ok: true, added: items.length, notes: data || [] });
  }
  if (body?.action === "pin") {
    const { error } = await db.from("notes").update({ pinned: !!body?.pinned, updated_at: new Date().toISOString() }).eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "edit") {
    const text = String(body?.text || "").trim().slice(0, 2000);
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await db.from("notes").update({ text, updated_at: new Date().toISOString() }).eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  if (body?.action === "del") {
    const { error } = await db.from("notes").delete().eq("id", String(body?.id || "")).eq("user_id", user.id);
    return NextResponse.json({ ok: !error });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
