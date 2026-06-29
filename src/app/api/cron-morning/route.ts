import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { morningMessage } from "@/lib/morningPush";
import { mainKeyboard } from "@/lib/botKeyboard";

export const runtime = "nodejs";
export const maxDuration = 60;

function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000);
}

// Утренний пуш: мотивация + мягкое напоминание про зарядку. Шлётся раз в день
// (Vercel Cron, ~08:00 по Киеву). Один короткий месседж, ротация по дню.
export async function GET(req: NextRequest) {
  // Безопасный самотест: /api/cron-morning?test=<TELEGRAM_WEBHOOK_SECRET> — один пуш владельцу.
  const test = req.nextUrl.searchParams.get("test");
  if (test !== null) {
    if (test !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "bad key" }, { status: 401 });
    }
    const chat = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    if (!chat) return NextResponse.json({ ok: false, error: "no TELEGRAM_ALLOWED_CHAT_ID" });
    try {
      await sendMessage(Number(chat), morningMessage("ru", dayOfYear()));
      return NextResponse.json({ ok: true, test: true });
    } catch (e: any) {
      return NextResponse.json({ ok: false, test: true, error: String(e?.message || e) });
    }
  }

  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = supabaseAdmin();
  // push_enabled может ещё не существовать (миграция не запущена) — мягкий фолбэк.
  let users: any[] | null = null;
  {
    const r = await db.from("users").select("chat_id, lang, push_enabled").not("chat_id", "is", null);
    if (r.error) {
      const r2 = await db.from("users").select("chat_id, lang").not("chat_id", "is", null);
      users = r2.data as any;
    } else users = r.data as any;
  }
  const doy = dayOfYear();
  let sent = 0;
  for (const u of users || []) {
    try {
      if (u.push_enabled === false) continue; // пользователь выключил пуши в Профиле
      const lang = ["ru", "en", "uk", "fr"].includes(u.lang) ? u.lang : "ru";
      // Прикладываем актуальную клавиатуру — так кнопки у активных юзеров
      // переобновляются сами при ближайшем утреннем пуше.
      await sendMessage(u.chat_id, morningMessage(lang, doy), { reply_markup: mainKeyboard(lang) });
      sent++;
    } catch (e) {
      console.error("morning push", u.chat_id, e);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
