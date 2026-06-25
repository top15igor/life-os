import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage, sendChatAction } from "@/lib/telegram";
import { transcribe } from "@/lib/transcribe";
import { analyze, type Analysis } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { getOrCreateUser } from "@/lib/users";
import { getStreak } from "@/lib/queries";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickLang(code?: string): "ru" | "en" | "uk" | "fr" {
  const c = (code || "").slice(0, 2);
  return c === "uk" ? "uk" : c === "en" ? "en" : c === "fr" ? "fr" : "ru";
}

const WELCOME: Record<string, string[]> = {
  ru: [
    "👋 Привет!\nЧерез год ты почти наверняка не вспомнишь сегодняшний день.",
    "Но именно из таких дней складывается вся твоя жизнь.",
    "🎤 Просто отправь мне первое голосовое — расскажи, что произошло сегодня.",
    "Всё остальное я сделаю сам: сохраню, найду главное, выделю инсайты и начну писать твою Книгу жизни.",
    "А потом я смогу ответить на любой твой вопрос о твоей жизни. 📖",
    "Кстати, всё это красиво видно и в вебе — вот твоя личная ссылка, сохрани её:\n{link}",
  ],
  en: [
    "👋 Hi!\nA year from now, you'll barely remember today.",
    "Yet your whole life is made of days like this.",
    "🎤 Just send me your first voice message — tell me how your day went.",
    "I'll do the rest: save it, find what matters, extract insights, and start writing your Book of Life.",
    "And then I'll be able to answer any question about your life. 📖",
    "By the way, you can see it all beautifully on the web — here's your personal link, keep it:\n{link}",
  ],
  uk: [
    "👋 Привіт!\nЧерез рік ти майже напевно не згадаєш сьогоднішній день.",
    "Але саме з таких днів складається все твоє життя.",
    "🎤 Просто надішли мені перше голосове — розкажи, що сталося сьогодні.",
    "Усе інше я зроблю сам: збережу, знайду головне, виділю інсайти й почну писати твою Книгу життя.",
    "А потім я зможу відповісти на будь-яке питання про твоє життя. 📖",
    "До речі, усе це красиво видно й у вебі — ось твоє особисте посилання, збережи його:\n{link}",
  ],
  fr: [
    "👋 Salut !\nDans un an, tu ne te souviendras presque plus d'aujourd'hui.",
    "Pourtant, toute ta vie est faite de jours comme celui-ci.",
    "🎤 Envoie-moi simplement ton premier message vocal — raconte ta journée.",
    "Je m'occupe du reste : je sauvegarde, je trouve l'essentiel, j'extrais les insights et je commence ton Livre de vie.",
    "Et ensuite, je pourrai répondre à toutes tes questions sur ta vie. 📖",
    "Au fait, tu peux tout voir joliment sur le web — voici ton lien personnel, garde-le :\n{link}",
  ],
};

const RETURN: Record<string, string> = {
  ru: "С возвращением! 👋\nПросто пришли голосовое или текст — я всё разложу по полочкам.\n\nТвоя личная ссылка на дневник:\n{link}",
  en: "Welcome back! 👋\nJust send a voice note or text — I'll sort it all out.\n\nYour personal diary link:\n{link}",
  uk: "З поверненням! 👋\nПросто надішли голосове або текст — я все розкладу.\n\nТвоє особисте посилання на щоденник:\n{link}",
  fr: "Bon retour ! 👋\nEnvoie une note vocale ou un texte — je m'occupe du reste.\n\nTon lien personnel vers le journal :\n{link}",
};

const CONFIRM: Record<string, any> = {
  ru: { saved: "Запись сохранена", insights: "инсайт(ов)", tasks: "задач(и)", tags: "тег(ов)", streakWord: "дней подряд", book: "📖 Моя Книга жизни", ask: "🧠 Спросить" },
  en: { saved: "Entry saved", insights: "insight(s)", tasks: "task(s)", tags: "tag(s)", streakWord: "days in a row", book: "📖 My Book of Life", ask: "🧠 Ask" },
  uk: { saved: "Запис збережено", insights: "інсайт(ів)", tasks: "завдань", tags: "тегів", streakWord: "днів поспіль", book: "📖 Моя Книга життя", ask: "🧠 Запитати" },
  fr: { saved: "Entrée enregistrée", insights: "insight(s)", tasks: "tâche(s)", tags: "tag(s)", streakWord: "jours d'affilée", book: "📖 Mon Livre de vie", ask: "🧠 Demander" },
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId: number = msg.chat.id;
  const origin = req.nextUrl.origin;

  // Каждый пользователь Telegram = аккаунт. Создаём при первом сообщении.
  let user;
  try {
    user = await getOrCreateUser(chatId, msg.from?.first_name);
  } catch (e) {
    console.error(e);
    await sendMessage(chatId, "Не удалось завести аккаунт. Попробуй ещё раз чуть позже.");
    return NextResponse.json({ ok: true });
  }

  const link = `${origin}/u/${user.token}`;

  if (msg.text === "/start") {
    const lang = pickLang(msg.from?.language_code);
    if (user.isNew) {
      const seq = WELCOME[lang] || WELCOME.ru;
      for (let i = 0; i < seq.length; i++) {
        await sendChatAction(chatId, "typing");
        await sleep(i === 0 ? 400 : 1300);
        await sendMessage(chatId, seq[i].replace("{link}", link));
      }
    } else {
      await sendMessage(chatId, (RETURN[lang] || RETURN.ru).replace("{link}", link));
    }
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/demo") {
    const lang = pickLang(msg.from?.language_code);
    const seq = WELCOME[lang] || WELCOME.ru;
    for (let i = 0; i < seq.length; i++) {
      await sendChatAction(chatId, "typing");
      await sleep(i === 0 ? 400 : 1300);
      await sendMessage(chatId, seq[i].replace("{link}", link));
    }
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/link") {
    await sendMessage(chatId, `Твоя личная ссылка на дневник:\n${link}`);
    return NextResponse.json({ ok: true });
  }

  try {
    let text: string | undefined = msg.text;
    const isVoice = Boolean(msg.voice || msg.audio);

    if (isVoice) {
      await sendMessage(chatId, "🎧 Распознаю голос…");
      const fileId = (msg.voice || msg.audio).file_id;
      const url = await getFileUrl(fileId);
      text = await transcribe(url);
    }

    if (!text || !text.trim()) {
      await sendMessage(chatId, "Пришли текст или голосовое сообщение 🙂");
      return NextResponse.json({ ok: true });
    }

    const analysis = await analyze(text);
    const entry = await saveEntry({
      userId: user.id,
      raw_text: text,
      source: isVoice ? "telegram_voice" : "telegram_text",
      analysis,
    });
    const lang = pickLang(msg.from?.language_code);
    const streak = await getStreak(user.id);
    const L = CONFIRM[lang] || CONFIRM.ru;
    await sendMessage(chatId, formatConfirm(analysis, streak, lang), {
      reply_markup: {
        inline_keyboard: [[
          { text: L.book, url: `${origin}/u/${user.token}?next=/entry/${entry.id}` },
          { text: L.ask, url: `${origin}/u/${user.token}?next=/biographer` },
        ]],
      },
    });
  } catch (e: any) {
    console.error(e);
    await sendMessage(chatId, "Упс, что-то пошло не так при сохранении. Попробуй ещё раз.");
  }

  return NextResponse.json({ ok: true });
}

function formatConfirm(a: Analysis, streak: number, lang: string): string {
  const L = CONFIRM[lang] || CONFIRM.ru;
  const lines = [`✅ <b>${L.saved}</b>`, "", a.summary];
  const extra: string[] = [];
  if (a.insights?.length) extra.push(`💡 ${a.insights.length} ${L.insights}`);
  if (a.tasks?.length) extra.push(`🎯 ${a.tasks.length} ${L.tasks}`);
  if (a.tags?.length) extra.push(`#️⃣ ${a.tags.length} ${L.tags}`);
  if (extra.length) lines.push("", extra.join("\n"));
  const m = [
    a.mood != null ? `Mood ${a.mood}` : null,
    a.energy != null ? `Energy ${a.energy}` : null,
    a.health != null ? `Health ${a.health}` : null,
  ].filter(Boolean);
  if (m.length) lines.push("", m.join(" · "));
  if (streak >= 2) lines.push("", `🔥 ${streak} ${L.streakWord}`);
  return lines.join("\n");
}
