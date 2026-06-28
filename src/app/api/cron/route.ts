import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { syncGoogleHealth, googleHealthUserIds } from "@/lib/googleHealth";
import { sendMessage } from "@/lib/telegram";
import { monthlyFinanceDigest } from "@/lib/financeCoach";
import { shiftMonth, currentMonth } from "@/lib/finance";
import { getBookPrompt, bookPromptMessage } from "@/lib/bookPrompts";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

type Lang = "ru" | "en" | "uk" | "fr";

const MSG: Record<Lang, {
  reminder: string;
  reminderStreak: (n: number) => string;
  back: Record<number, string>;
  digestHeader: string;
  digestLang: string;
}> = {
  ru: {
    reminder: "🌙 Как прошёл твой день?\nНаговори пару строк — даже короткая запись важна для твоей Книги жизни.",
    reminderStreak: (n) => `🔥 Твоя серия — ${n} дн. подряд!\nЗапиши сегодняшний день, чтобы не разорвать цепочку.`,
    back: {
      3: "Тебя не было пару дней 🙂\nТвой дневник скучает — расскажи, что нового?",
      7: "Прошла неделя без записей.\nДаже одна строчка сегодня вернёт привычку 🌱",
      14: "Две недели тишины.\nЖизнь идёт — давай сохраним этот момент? 📖",
      30: "Целый месяц прошёл.\nЯ всё помню и жду тебя — вернёшься одной записью? 💛",
    },
    digestHeader: "📅 <b>Твоя неделя</b>",
    digestLang: "русском",
  },
  en: {
    reminder: "🌙 How was your day?\nJot down a couple of lines — even a short note matters for your Book of Life.",
    reminderStreak: (n) => `🔥 Your streak — ${n} days in a row!\nWrite today so you don't break the chain.`,
    back: {
      3: "You've been away a couple of days 🙂\nYour diary misses you — what's new?",
      7: "A week without entries.\nEven one line today brings the habit back 🌱",
      14: "Two weeks of silence.\nLife goes on — let's capture this moment? 📖",
      30: "A whole month has passed.\nI remember everything and I'm waiting — come back with one entry? 💛",
    },
    digestHeader: "📅 <b>Your week</b>",
    digestLang: "English",
  },
  uk: {
    reminder: "🌙 Як минув твій день?\nНаговори кілька рядків — навіть короткий запис важливий для твоєї Книги життя.",
    reminderStreak: (n) => `🔥 Твоя серія — ${n} дн. поспіль!\nЗапиши сьогоднішній день, щоб не розірвати ланцюжок.`,
    back: {
      3: "Тебе не було кілька днів 🙂\nТвій щоденник сумує — розкажи, що нового?",
      7: "Минув тиждень без записів.\nНавіть один рядок сьогодні поверне звичку 🌱",
      14: "Два тижні тиші.\nЖиття триває — збережемо цей момент? 📖",
      30: "Минув цілий місяць.\nЯ все пам'ятаю і чекаю — повернешся одним записом? 💛",
    },
    digestHeader: "📅 <b>Твій тиждень</b>",
    digestLang: "українській",
  },
  fr: {
    reminder: "🌙 Comment s'est passée ta journée ?\nNote quelques lignes — même une courte note compte pour ton Livre de vie.",
    reminderStreak: (n) => `🔥 Ta série — ${n} jours d'affilée !\nÉcris aujourd'hui pour ne pas briser la chaîne.`,
    back: {
      3: "Tu as disparu quelques jours 🙂\nTon journal s'ennuie — quoi de neuf ?",
      7: "Une semaine sans entrées.\nMême une ligne aujourd'hui ramène l'habitude 🌱",
      14: "Deux semaines de silence.\nLa vie continue — on garde ce moment ? 📖",
      30: "Un mois entier s'est écoulé.\nJe me souviens de tout et je t'attends — reviens avec une entrée ? 💛",
    },
    digestHeader: "📅 <b>Ta semaine</b>",
    digestLang: "français",
  },
};

const dayMs = 86400000;
const isoOf = (t: number) => new Date(t).toISOString().slice(0, 10);

async function weeklyDigest(userId: string, lang: Lang): Promise<string | null> {
  const db = supabaseAdmin();
  const weekAgo = isoOf(Date.now() - 7 * dayMs);
  const { data } = await db
    .from("entries")
    .select("entry_date, summary, raw_text")
    .eq("user_id", userId)
    .gte("entry_date", weekAgo)
    .order("entry_date", { ascending: true });
  if (!data?.length) return null;

  const list = data.map((e) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 800)}`).join("\n");
  const m = MSG[lang];
  const prompt = `Ты — AI-биограф дневника LIFE OS. Сделай тёплый короткий обзор недели пользователя на ${m.digestLang} языке по записям ниже: главные события, повторяющаяся тема, 1 инсайт и 1 мягкий совет на следующую неделю. 5–7 строк, по-человечески, без канцелярита.\n\nЗАПИСИ:\n${list}`;
  try {
    const r = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return `${m.digestHeader}\n\n${text}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Безопасный самотест доставки: /api/cron?test=<TELEGRAM_WEBHOOK_SECRET>
  // Шлёт ОДИН тестовый пуш владельцу и выходит (без массовой рассылки).
  const test = req.nextUrl.searchParams.get("test");
  if (test !== null) {
    if (test !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "bad key" }, { status: 401 });
    }
    const chat = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    if (!chat) return NextResponse.json({ ok: false, error: "no TELEGRAM_ALLOWED_CHAT_ID" });
    try {
      await sendMessage(Number(chat), "🔔 Тест пуша LIFE OS. Видишь это сообщение — значит доставка работает, и вопрос только в расписании крона.");
      return NextResponse.json({ ok: true, test: true, chat });
    } catch (e: any) {
      return NextResponse.json({ ok: false, test: true, error: String(e?.message || e) });
    }
  }

  // Vercel Cron присылает Authorization: Bearer <CRON_SECRET> (если задан).
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = supabaseAdmin();

  // Подтягиваем свежие данные у всех, кто подключил Fitbit/Google Health (последние 2 дня).
  let fitbitSynced = 0;
  try {
    const ids = await googleHealthUserIds();
    for (const uid of ids) {
      try { if ((await syncGoogleHealth(uid, 2)) >= 0) fitbitSynced++; } catch (e) { console.error("googlehealth cron", uid, e); }
    }
  } catch (e) {
    console.error("googlehealth cron", e);
  }

  // push_enabled может ещё не существовать (миграция не запущена) — мягкий фолбэк.
  let users: any[] | null = null;
  {
    const r = await db.from("users").select("id, chat_id, lang, created_at, push_enabled").not("chat_id", "is", null);
    if (r.error) {
      const r2 = await db.from("users").select("id, chat_id, lang, created_at").not("chat_id", "is", null);
      users = r2.data as any;
    } else users = r.data as any;
  }
  const todayT = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  const today = isoOf(todayT);
  const isSunday = new Date().getUTCDay() === 0;
  // День года — для ротации «вопроса для книги». В «вопросный день» (примерно
  // дважды в неделю) обычное напоминание заменяем тёплым наводящим вопросом.
  const nowD = new Date();
  const doy = Math.floor((nowD.getTime() - new Date(nowD.getUTCFullYear(), 0, 0).getTime()) / 86400000);
  const isBookQuestionDay = doy % 3 === 0;
  const isFirstOfMonth = new Date().getUTCDate() === 1;
  const prevMonth = shiftMonth(currentMonth(), -1); // отчёт за завершившийся месяц

  const stats = { reminders: 0, streakReminders: 0, winbacks: 0, digests: 0, financeDigests: 0, bookQuestions: 0 };

  for (const u of users || []) {
    try {
      if (u.push_enabled === false) continue; // пользователь выключил пуши в Профиле
      const lang: Lang = (["ru", "en", "uk", "fr"].includes(u.lang) ? u.lang : "ru") as Lang;
      const m = MSG[lang];

      const { data: ents } = await db
        .from("entries")
        .select("entry_date")
        .eq("user_id", u.id)
        .order("entry_date", { ascending: false })
        .limit(40);
      const days = Array.from(new Set((ents || []).map((e: any) => e.entry_date)));
      const wroteToday = days[0] === today;

      // 1-го числа — ежемесячный финансовый отчёт за прошлый месяц (если были операции).
      if (isFirstOfMonth) {
        try {
          const fin = await monthlyFinanceDigest(u.id, lang, prevMonth);
          if (fin) { await sendMessage(u.chat_id, fin); stats.financeDigests++; }
        } catch (e) { console.error("finance digest", u.id, e); }
      }

      // Воскресный AI-обзор недели — всем, кто писал на этой неделе.
      if (isSunday) {
        const digest = await weeklyDigest(u.id, lang);
        if (digest) {
          await sendMessage(u.chat_id, digest);
          stats.digests++;
        }
      }

      // Активным (писал сегодня) напоминания не шлём, но в «вопросный день»
      // даём тёплый «вопрос для книги» — приглашение дополнить главу, без нудёжа.
      // На воскресенье не дублируем (там AI-обзор недели).
      if (wroteToday) {
        if (isBookQuestionDay && !isSunday) {
          try {
            const bp = await getBookPrompt(u.id, lang, doy);
            if (bp) { await sendMessage(u.chat_id, bookPromptMessage(lang, bp.question)); stats.bookQuestions++; }
          } catch (e) { console.error("book prompt active", u.id, e); }
        }
        continue;
      }

      // Сколько дней «тишины»: от последней записи или от регистрации.
      let gap: number;
      let streak = 0;
      if (days.length) {
        gap = Math.round((todayT - new Date(days[0] + "T00:00:00Z").getTime()) / dayMs);
        streak = 1;
        for (let i = 1; i < days.length; i++) {
          const diff = Math.round((new Date(days[i - 1] + "T00:00:00Z").getTime() - new Date(days[i] + "T00:00:00Z").getTime()) / dayMs);
          if (diff === 1) streak++;
          else break;
        }
      } else {
        const created = u.created_at ? new Date(String(u.created_at).slice(0, 10) + "T00:00:00Z").getTime() : todayT;
        gap = Math.max(1, Math.round((todayT - created) / dayMs));
      }

      if (gap <= 2) {
        // Активные — мягкое напоминание; если серия жива (писал вчера) — мотивируем не разорвать.
        if (gap === 1 && streak >= 2) {
          await sendMessage(u.chat_id, m.reminderStreak(streak));
          stats.streakReminders++;
        } else {
          // В «вопросный день» — тёплый наводящий вопрос для книги вместо общего напоминания.
          let asked = false;
          if (isBookQuestionDay) {
            try {
              const bp = await getBookPrompt(u.id, lang, doy);
              if (bp) { await sendMessage(u.chat_id, bookPromptMessage(lang, bp.question)); stats.bookQuestions++; asked = true; }
            } catch (e) { console.error("book prompt", u.id, e); }
          }
          if (!asked) { await sendMessage(u.chat_id, m.reminder); stats.reminders++; }
        }
      } else if (m.back[gap]) {
        // Разнесённый возврат — только на 3/7/14/30 день тишины, дальше не беспокоим.
        await sendMessage(u.chat_id, m.back[gap]);
        stats.winbacks++;
      }
    } catch (e) {
      console.error("cron user", u.id, e);
    }
  }

  return NextResponse.json({ ok: true, ...stats, fitbitSynced, sunday: isSunday });
}
