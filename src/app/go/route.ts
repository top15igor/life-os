import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Переход по разделам из кнопок бота БЕЗ логин-токена в URL: /go?next=/knowledge.
// Пересылка такого сообщения безопасна — ссылка никого никуда не логинит.
// Если сессии в браузере нет — ведём на экран входа (свежую ссылку входа даёт /link в боте).
export const runtime = "nodejs";

function destFrom(req: NextRequest): string {
  const next = req.nextUrl.searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(req: NextRequest) {
  const dest = destFrom(req);
  const c = req.cookies.get("lifeos_token")?.value;
  if (c) {
    const db = supabaseAdmin();
    try {
      const { data } = await db.from("users").select("id").eq("session_secret", c).maybeSingle();
      if (data) return NextResponse.redirect(new URL(dest, req.url));
    } catch {}
    try {
      const { data: legacy } = await db.from("users").select("id").eq("token", c).maybeSingle();
      if (legacy) return NextResponse.redirect(new URL(dest, req.url));
    } catch {}
  }
  return NextResponse.redirect(new URL(`/login?e=go&next=${encodeURIComponent(dest)}`, req.url));
}
