import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";
import { morningMessage } from "@/lib/morningPush";
import { personalMorning } from "@/lib/morningPersonal";
import { normalizeMorningPrefs, type MorningPrefs } from "@/lib/morningPrefs";
import { localParts } from "@/lib/pushSchedule";
import { logPush } from "@/lib/pushLog";
import { mainKeyboard } from "@/lib/botKeyboard";
import { saveChat } from "@/lib/biographer";

// Метка утреннего пуша в истории диалога — чтобы ассистент потом связывал
// уточняющие вопросы пользователя с тем, что сам прислал утром.
const MORNING_TAG = "☀️ (моё утреннее сообщение пользователю)";

// Время по умолчанию (если пользователь не выбрал своё): 05:00 UTC = ~08:00 по Киеву.
const LEGACY_UTC_HOUR = 5;

export const runtime = "nodejs";
export const maxDuration = 60;

function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000);
}

const pickLang = (l: any) => (["ru", "en", "uk", "fr"].includes(l) ? l : "ru");

// «Пора ли слать этому пользователю прямо сейчас?» Возвращает локальный ключ-дату
// (для защиты от повтора) или null, если ещё не его час.
function dueNow(prefs: MorningPrefs, lp: { hour: number; weekday: number; dateKey: string }, now: Date): { todayKey: string } | null {
  if (prefs.hour != null && prefs.tz) {
    const isWeekend = lp.weekday === 0 || lp.weekday === 6;
    // В выходные — отдельный час, если задан; иначе как в будни.
    const target = (isWeekend && prefs.hourWeekend != null) ? prefs.hourWeekend : prefs.hour;
    return lp.hour === target ? { todayKey: lp.dateKey } : null;
  }
  // Дефолтное время — 05:00 UTC (~08:00 по Киеву).
  return now.getUTCHours() === LEGACY_UTC_HOUR ? { todayKey: now.toISOString().slice(0, 10) } : null;
}

// Утренний пуш: персональное сообщение, составленное AI под каждого пользователя,
// с учётом его настроек (тон, темы, время). Vercel Cron шлёт раз в день (дефолтное
// время); для индивидуального времени эндпоинт зовётся почасово (GitHub Actions).
// Каждому — не больше одного раза в день (защита morning_sent_on).
export async function GET(req: NextRequest) {
  const now = new Date();
  const doy = dayOfYear();

  // Безопасный самотест: /api/cron-morning?test=<TELEGRAM_WEBHOOK_SECRET> — один пуш владельцу
  // (с персонализацией по его данным, без проверки времени — чтобы увидеть результат сразу).
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
      let uid: string | null = null;
      try {
        const { data: u } = await supabaseAdmin().from("users").select("id, name, lang").eq("chat_id", Number(chat)).maybeSingle();
        if (u) {
          uid = (u as any).id;
          lang = pickLang((u as any).lang);
          text = await personalMorning((u as any).id, (u as any).name ?? null, lang);
        }
      } catch { /* нет такого юзера — уйдёт статичная фраза */ }
      const personalized = !!text;
      text = text || morningMessage(lang, doy);
      await sendMessage(Number(chat), text, { reply_markup: mainKeyboard(lang) });
      if (uid) saveChat(uid, MORNING_TAG, text).catch(() => {});
      return NextResponse.json({ ok: true, test: true, personalized });
    } catch (e: any) {
      return NextResponse.json({ ok: false, test: true, error: String(e?.message || e) });
    }
  }

  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = supabaseAdmin();
  // Колонки morning_prefs / morning_sent_on могут ещё не существовать — мягкий фолбэк.
  let users: any[] | null = null;
  let hasSentColumn = true;
  {
    const r = await db.from("users").select("id, name, chat_id, lang, push_enabled, morning_prefs, morning_sent_on").not("chat_id", "is", null);
    if (r.error) {
      hasSentColumn = false;
      const r2 = await db.from("users").select("id, name, chat_id, lang, push_enabled, morning_prefs").not("chat_id", "is", null);
      if (r2.error) {
        const r3 = await db.from("users").select("id, name, chat_id, lang").not("chat_id", "is", null);
        users = r3.data as any;
      } else users = r2.data as any;
    } else users = r.data as any;
  }

  const list = (users || []).filter((u: any) => u.push_enabled !== false);
  // Запас до лимита функции (Vercel Hobby = 60с): за дедлайном уже не зовём AI,
  // а шлём мгновенную статичную фразу, чтобы успеть охватить всех «сегодняшних».
  const deadline = Date.now() + 52_000;
  const CONC = 6;
  let sent = 0, personalized = 0, idx = 0;

  async function worker() {
    while (idx < list.length) {
      const u = list[idx++];
      const prefs = normalizeMorningPrefs(u.morning_prefs);
      if (!prefs.morningEnabled) continue; // утренний пуш выключен в профиле
      const lp = localParts(prefs.tz, now);
      if (prefs.quietDays.includes(lp.weekday)) continue; // тихий день
      const due = dueNow(prefs, lp, now);
      if (!due) continue; // не его час

      // Защита от повторной отправки в этот день (атомарно «занимаем» слот).
      if (hasSentColumn) {
        try {
          const { data: claimed, error } = await db.from("users")
            .update({ morning_sent_on: due.todayKey }).eq("id", u.id)
            .or(`morning_sent_on.is.null,morning_sent_on.neq.${due.todayKey}`).select("id");
          if (error) hasSentColumn = false;        // колонки нет → дальше без дедупа
          else if (!claimed?.length) continue;     // уже отправляли сегодня
        } catch { hasSentColumn = false; }
      }

      const lang = pickLang(u.lang);
      try {
        let text: string | null = null;
        if (Date.now() < deadline) {
          text = await personalMorning(u.id, u.name ?? null, lang, prefs);
          if (text) personalized++;
        }
        if (!text) text = morningMessage(lang, doy); // мало данных / лимит времени / ошибка
        await sendMessage(u.chat_id, text, { reply_markup: mainKeyboard(lang) });
        saveChat(u.id, MORNING_TAG, text).catch(() => {}); // в историю, не тормозя рассылку
        logPush(u.id, "morning").catch(() => {});
        sent++;
      } catch (e) {
        console.error("morning push", u.chat_id, e);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONC, list.length) }, () => worker()));
  return NextResponse.json({ ok: true, sent, personalized });
}
