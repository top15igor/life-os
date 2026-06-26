import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DEFAULT_BLOCKS } from "@/lib/public";

export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9-]{3,30}$/;
const ALLOWED = new Set(["voice", "deeds", "dreams", "streak"]);

// Сохранить настройки публичной страницы. Slug уникален; страница выключена по умолчанию.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const enabled = !!body?.enabled;
  const slug = String(body?.slug || "").trim().toLowerCase();
  const bio = String(body?.bio || "").trim().slice(0, 200);
  const blocks = Array.isArray(body?.blocks) ? body.blocks.filter((b: any) => ALLOWED.has(b)) : DEFAULT_BLOCKS;

  // Включить публичную страницу можно только с корректным slug.
  if (enabled && !SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: false, error: "bad_slug" }, { status: 400 });
  }

  const db = supabaseAdmin();
  // Slug занят кем-то другим?
  if (slug) {
    const { data: taken } = await db.from("public_profile").select("user_id").eq("slug", slug).maybeSingle();
    if (taken && taken.user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 });
    }
  }

  try {
    await db.from("public_profile").upsert(
      { user_id: user.id, slug: slug || null, enabled, bio, blocks, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "no_table" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
