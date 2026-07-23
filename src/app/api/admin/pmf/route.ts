// PMF-опрос: сводка ответов (GET) и рассылка вопроса в бота (POST, только владелец).
// POST ?test=1 — отправить вопрос только себе, проверить как выглядит.
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { pmfQuestion, pmfEligibleUsers, pmfSummary } from "@/lib/pmf";

export const runtime = "nodejs";
export const maxDuration = 60;

const OWNER = "00000000-0000-0000-0000-000000000000";

function pickLang(code?: string | null): "ru" | "en" | "uk" | "fr" | "es" {
  const c = (code || "").slice(0, 2);
  return c === "uk" ? "uk" : c === "en" ? "en" : c === "fr" ? "fr" : c === "es" ? "es" : "ru";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const summary = await pmfSummary();
  return NextResponse.json({ ok: true, ...summary });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const db = supabaseAdmin();
  const test = req.nextUrl.searchParams.get("test") === "1";

  if (test) {
    // Пробное сообщение себе: увидеть вопрос глазами пользователя.
    const { data: me } = await db.from("users").select("chat_id, lang").eq("id", OWNER).maybeSingle();
    const chatId = (me as any)?.chat_id;
    if (!chatId) return NextResponse.json({ ok: false, error: "owner has no chat_id" }, { status: 400 });
    const q = pmfQuestion(pickLang((me as any)?.lang));
    await sendMessage(chatId, q.text, { reply_markup: q.reply_markup });
    return NextResponse.json({ ok: true, test: true, sent: 1 });
  }

  // Боевая рассылка: активные пользователи (3+ записи, живы за 30 дней),
  // которым вопрос ещё не отправляли.
  const eligible = await pmfEligibleUsers();
  const { data: asks } = await db.from("pmf_asks").select("user_id");
  const asked = new Set((((asks as any[]) ?? [])).map((a) => a.user_id));
  const targets = eligible.filter((u) => !asked.has(u.id));

  let sent = 0;
  for (const u of targets) {
    try {
      const q = pmfQuestion(pickLang(u.lang));
      await sendMessage(u.chat_id, q.text, { reply_markup: q.reply_markup });
      await db.from("pmf_asks").upsert({ user_id: u.id }, { onConflict: "user_id" });
      sent++;
      // Небольшая пауза, чтобы не упереться в лимиты Telegram.
      await new Promise((r) => setTimeout(r, 150));
    } catch { /* один сбой не должен ронять всю рассылку */ }
  }
  return NextResponse.json({ ok: true, sent, skippedAlreadyAsked: eligible.length - targets.length });
}
