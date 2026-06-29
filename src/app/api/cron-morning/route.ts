import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { morningMessage } from "@/lib/morningPush";
import { personalMorning } from "@/lib/morningPersonal";
import { mainKeyboard } from "@/lib/botKeyboard";

export const runtime = "nodejs";
export const maxDuration = 60;

function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000);
}

const pickLang = (l: any) => (["ru", "en", "uk", "fr"].includes(l) ? l : "ru");

// Утренний пуш: персональное сообщение, составленное AI под каждого
// пользователя (его записи, цели, серия, задачи), с фолбэком на тёплую
// статичную фразу. Шлётся раз в день (Vercel Cron, ~08:00 по Киеву).
export async function GET(req: NextRequest) {
  const doy = dayOfYear();

  // Безопасный самотест: /api/cron-morning?test=<TELEGRAM_WEBHOOK_SECRET> — один пуш владельцу
  // (с персонализацией по его данным, чтобы увидеть результат вживую).
  const test = req.nextUrl.searchParams.get("test");
  if (test !== null) {
    if (test !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "bad key" }, { status: 401 });
    }
    const chat = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    if (!chat) return NextResponse.json({ ok: false, error: "no TELEGRAM_ALLOWED_CHAT_ID" });
    try {
      let text: string | null = null;
      let lang = "ru";
      try {
        const { data: u } = await supabaseAdmin().from("users").select("id, name, lang").eq("chat_id", Number(chat)).maybeSingle();
        if (u) {
          lang = pickLang((u as any).lang);
          text = await personalMorning((u as any).id, (u as any).name ?? null, lang);
        }
      } catch { /* нет такого юзера — уйдёт статичная фраза */ }
      text = text || morningMessage(lang, doy);
      await sendMessage(Number(chat), text, { reply_markup: mainKeyboard(lang) });
      return NextResponse.json({ ok: true, test: true, personalized: !!text });
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
    const r = await db.from("users").select("id, name, chat_id, lang, push_enabled").not("chat_id", "is", null);
    if (r.error) {
      const r2 = await db.from("users").select("id, name, chat_id, lang").not("chat_id", "is", null);
      users = r2.data as any;
    } else users = r.data as any;
  }

  const list = (users || []).filter((u: any) => u.push_enabled !== false);
  // Оставляем запас до лимита функции (Vercel Hobby = 60с): за дедлайном уже
  // не зовём AI, а шлём мгновенную статичную фразу, чтобы успеть охватить всех.
  const deadline = Date.now() + 52_000;
  const CONC = 6;
  let sent = 0, personalized = 0, idx = 0;

  async function worker() {
    while (idx < list.length) {
      const u = list[idx++];
      const lang = pickLang(u.lang);
      try {
        let text: string | null = null;
        if (Date.now() < deadline) {
          text = await personalMorning(u.id, u.name ?? null, lang);
          if (text) personalized++;
        }
        if (!text) text = morningMessage(lang, doy); // мало данных / лимит времени / ошибка
        await sendMessage(u.chat_id, text, { reply_markup: mainKeyboard(lang) });
        sent++;
      } catch (e) {
        console.error("morning push", u.chat_id, e);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONC, list.length) }, () => worker()));
  return NextResponse.json({ ok: true, sent, personalized });
}
