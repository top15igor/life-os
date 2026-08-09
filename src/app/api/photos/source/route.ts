import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Источники фотоархива: подключённые папки/NAS.
//
// POST создаёт источник и выдаёт device_token — единственный ключ, который
// получает локальный разведчик. Токен умеет ровно одно: присылать индекс
// в СВОЙ источник. Ни читать чужое, ни трогать базу он не может.

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { data } = await supabaseAdmin()
      .from("photo_sources")
      .select("id, name, kind, read_only, ai_policy, photo_count, last_scan_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    return NextResponse.json({ ok: true, sources: data || [] });
  } catch {
    return NextResponse.json({ ok: true, sources: [], needs_sql: true });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 80) || "Моя папка с фото";
  const kind = ["folder", "synology", "drive"].includes(body?.kind) ? body.kind : "folder";

  const device_token = randomBytes(32).toString("hex");
  try {
    const { data, error } = await supabaseAdmin()
      .from("photo_sources")
      .insert({ user_id: user.id, name, kind, device_token })
      .select("id, name, kind")
      .single();
    if (error) throw error;
    // Токен показываем один раз — при создании. Дальше он живёт только у разведчика.
    return NextResponse.json({ ok: true, source: data, device_token });
  } catch {
    return NextResponse.json({ ok: false, error: "needs_sql", hint: "Run supabase/photo_module.sql first" }, { status: 500 });
  }
}
