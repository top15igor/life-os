import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { saveReview } from "@/lib/reviews";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

// Приём отзыва с /reviews. Публикуется он не сразу: владелец видит уведомление
// в Telegram и одобряет отзыв в /admin/reviews.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim();
  const name = String(body?.name || user.name || "").trim();
  const consent = body?.consent === true;

  if (!text || text.length < 12) return NextResponse.json({ ok: false, error: "short" }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "name" }, { status: 400 });
  if (!consent) return NextResponse.json({ ok: false, error: "consent" }, { status: 400 });

  const locale = await getLocale();
  const saved = await saveReview({
    userId: user.id,
    name,
    role: String(body?.role || ""),
    rating: Number(body?.rating || 5),
    text,
    locale,
    consent,
  });
  if (!saved) return NextResponse.json({ ok: false, error: "save" }, { status: 500 });

  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (owner) {
    try {
      await sendMessage(
        owner,
        `⭐️ Новый отзыв на проверку\n\n${"★".repeat(saved.rating)}${"☆".repeat(5 - saved.rating)}\n«${saved.text}»\n\n— ${saved.name}${saved.role ? `, ${saved.role}` : ""}\n\nОдобрить: /admin/reviews`
      );
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
