import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

// Приём обратной связи: сохраняем + мгновенно уведомляем владельца в Telegram.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim().slice(0, 2000);
  const kind = String(body?.kind || "other").slice(0, 20);
  if (!text) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await supabaseAdmin().from("feedback").insert({ user_id: user.id, kind, text });
  } catch {}

  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (owner) {
    const label = kind === "idea" ? "💡 Идея" : kind === "bug" ? "🐞 Проблема" : kind === "book_order" ? "📖 Заявка на КНИГУ" : kind === "plan_order" ? "⭐️ Заявка на ТАРИФ" : "💬 Отзыв";
    try {
      await sendMessage(owner, `${label} от ${user.name || "—"}:\n\n${text}`);
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
