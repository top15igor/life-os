import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { financeReview } from "@/lib/financeCoach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LANGS = ["ru", "en", "uk", "fr"] as const;

// AI-советник по финансам для веба: разбор + советы + урок финграмотности.
// Возвращает чистый текст (HTML-теги из ответа убраны) для безопасного показа.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const langParam = req.nextUrl.searchParams.get("lang") || "ru";
  const lang = (LANGS as readonly string[]).includes(langParam) ? (langParam as any) : "ru";
  try {
    const html = await financeReview(user.id, lang);
    const text = html.replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
