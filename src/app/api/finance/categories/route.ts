import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  і: "i", ї: "yi", є: "ye", ґ: "g",
};
function slugify(label: string): string {
  const s = label.toLowerCase().split("").map((ch) => (TRANSLIT[ch] ?? ch)).join("")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  return s || "cat";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, categories: [] }, { status: 401 });
  try {
    const { data } = await supabaseAdmin().from("finance_categories")
      .select("id, slug, label, emoji, kind").eq("user_id", user.id).order("created_at", { ascending: true });
    return NextResponse.json({ ok: true, categories: data || [] });
  } catch {
    return NextResponse.json({ ok: true, categories: [] }); // таблицы ещё нет
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const label = String(body?.label || "").trim().slice(0, 40);
  const emoji = body?.emoji ? String(body.emoji).slice(0, 8) : null;
  const kind = body?.kind === "income" ? "income" : "expense";
  if (!label) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  // slug уникален в рамках (user, kind); при коллизии добавляем суффикс.
  const base = slugify(label);
  const db = supabaseAdmin();
  let slug = base;
  try {
    const { data: ex } = await db.from("finance_categories").select("slug").eq("user_id", user.id).eq("kind", kind);
    const taken = new Set((ex || []).map((r: any) => r.slug));
    let i = 2; while (taken.has(slug)) slug = `${base}_${i++}`;
    const { data, error } = await db.from("finance_categories")
      .insert({ user_id: user.id, slug, label, emoji, kind }).select("id, slug, label, emoji, kind").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, category: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "save_failed" }, { status: 500 });
  }
}

// Переименование своей категории. Slug не меняем: на него ссылаются операции
// и правила AI — меняется только то, что видит человек.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });
  const upd: any = {};
  if (body?.label !== undefined) {
    const label = String(body.label || "").trim().slice(0, 40);
    if (!label) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    upd.label = label;
  }
  if (body?.emoji !== undefined) upd.emoji = body.emoji ? String(body.emoji).slice(0, 8) : null;
  if (!Object.keys(upd).length) return NextResponse.json({ ok: false, error: "nothing" }, { status: 400 });
  try {
    const { data, error } = await supabaseAdmin().from("finance_categories")
      .update(upd).eq("id", id).eq("user_id", user.id).select("id, slug, label, emoji, kind").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, category: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "save_failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  // Куда девать операции удаляемой категории. Без переноса они остались бы с
  // «осиротевшим» слагом и висели в отчётах непонятной строкой.
  const moveTo = String(url.searchParams.get("moveTo") || "other").slice(0, 40);
  if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });
  try {
    const db = supabaseAdmin();
    const { data: cat } = await db.from("finance_categories")
      .select("slug, kind").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!cat) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const { data: moved } = await db.from("finance_tx").update({ category: moveTo })
      .eq("user_id", user.id).eq("kind", (cat as any).kind).eq("category", (cat as any).slug).select("id");
    await db.from("finance_categories").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true, moved: (moved || []).length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
