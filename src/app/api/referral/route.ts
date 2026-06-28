import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { getReferralStatus, claimFreeBook } from "@/lib/referral";

export const runtime = "nodejs";

// Текущий реферальный статус: приглашённые, активные, доступные бесплатные книги.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const status = await getReferralStatus(user.id);
  return NextResponse.json({ ok: true, status });
}

// Заявка на бесплатную книгу-награду: списываем кредит и уведомляем владельца.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").trim().slice(0, 2000);

  const ok = await claimFreeBook(user.id);
  if (!ok) return NextResponse.json({ ok: false, reason: "no_credit" }, { status: 400 });

  try {
    await supabaseAdmin().from("feedback").insert({ user_id: user.id, kind: "book_order", text: `[БЕСПЛАТНО / НАГРАДА ЗА ПРИГЛАШЕНИЯ]\n${text}` });
  } catch {}

  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (owner) {
    try {
      await sendMessage(owner, `🎁 БЕСПЛАТНАЯ книга (награда за приглашения) от ${user.name || "—"}:\n\n${text}`);
    } catch {}
  }

  const status = await getReferralStatus(user.id);
  return NextResponse.json({ ok: true, status });
}
