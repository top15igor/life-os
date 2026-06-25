import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage, sendChatAction } from "@/lib/telegram";
import { transcribe } from "@/lib/transcribe";
import { analyze, classifyIntent, type Analysis } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { getOrCreateUser } from "@/lib/users";
import { getStreak, getEntryCount, getOnThisDay } from "@/lib/queries";
import { askLife, saveChat } from "@/lib/biographer";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickLang(code?: string): "ru" | "en" | "uk" | "fr" {
  const c = (code || "").slice(0, 2);
  return c === "uk" ? "uk" : c === "en" ? "en" : c === "fr" ? "fr" : "ru";
}

let botUsernameCache: string | null = null;
async function botShareLink(origin: string): Promise<string> {
  if (botUsernameCache) return `https://t.me/${botUsernameCache}`;
  try {
    const me = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`).then((r) => r.json());
    if (me?.result?.username) { botUsernameCache = me.result.username; return `https://t.me/${botUsernameCache}`; }
  } catch {}
  return origin;
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
  ru: { saved: "Запись сохранена", insights: "инсайт(ов)", tasks: "задач(и)", tags: "тег(ов)", streakWord: "дней подряд", book: "📖 Моя Книга жизни", ask: "🧠 Спросить", share: "📤 Поделиться с другом", tasksTitle: "Задачи", insightsTitle: "Инсайты" },
  en: { saved: "Entry saved", insights: "insight(s)", tasks: "task(s)", tags: "tag(s)", streakWord: "days in a row", book: "📖 My Book of Life", ask: "🧠 Ask", share: "📤 Share with a friend", tasksTitle: "Tasks", insightsTitle: "Insights" },
  uk: { saved: "Запис збережено", insights: "інсайт(ів)", tasks: "завдань", tags: "тегів", streakWord: "днів поспіль", book: "📖 Моя Книга життя", ask: "🧠 Запитати", share: "📤 Поділитися з другом", tasksTitle: "Завдання", insightsTitle: "Інсайти" },
  fr: { saved: "Entrée enregistrée", insights: "insight(s)", tasks: "tâche(s)", tags: "tag(s)", streakWord: "jours d'affilée", book: "📖 Mon Livre de vie", ask: "🧠 Demander", share: "📤 Partager avec un ami", tasksTitle: "Tâches", insightsTitle: "Insights" },
};

const MILE: Record<string, any> = {
  ru: { first: "🎉 Это твоя первая запись! Книга жизни началась.", count: (n: number) => `🎉 Уже ${n} записей! Твоя история растёт.`, streak: (n: number) => `🔥 ${n} дней подряд — невероятно, так держать!` },
  en: { first: "🎉 Your first entry! Your Book of Life has begun.", count: (n: number) => `🎉 Already ${n} entries! Your story is growing.`, streak: (n: number) => `🔥 ${n} days in a row — amazing, keep it up!` },
  uk: { first: "🎉 Це твій перший запис! Книга життя почалася.", count: (n: number) => `🎉 Уже ${n} записів! Твоя історія росте.`, streak: (n: number) => `🔥 ${n} днів поспіль — неймовірно, так тримати!` },
  fr: { first: "🎉 Ta première entrée ! Ton Livre de vie a commencé.", count: (n: number) => `🎉 Déjà ${n} entrées ! Ton histoire grandit.`, streak: (n: number) => `🔥 ${n} jours d'affilée — incroyable, continue !` },
};

const MEM: Record<string, any> = {
  ru: { year: (t: string) => `⏳ Год назад в этот день ты писал: «${t}»`, month: (t: string) => `⏳ Месяц назад в этот день: «${t}»` },
  en: { year: (t: string) => `⏳ A year ago today you wrote: “${t}”`, month: (t: string) => `⏳ A month ago today: “${t}”` },
  uk: { year: (t: string) => `⏳ Рік тому цього дня ти писав: «${t}»`, month: (t: string) => `⏳ Місяць тому цього дня: «${t}»` },
  fr: { year: (t: string) => `⏳ Il y a un an, ce jour-là tu écrivais : « ${t} »`, month: (t: string) => `⏳ Il y a un mois, ce jour-là : « ${t} »` },
};

const INVITE: Record<string, { text: string; share: string }> = {
  ru: { text: "📖 Представь, что через 10 лет ты сможешь открыть любой день своей жизни.\nВспомнить, о чём мечтал, какие идеи приходили, какие решения изменили всё и что делало тебя счастливым.\n\nLIFE OS помогает создать такую «Книгу жизни». Просто записывай мысли голосом, а AI сам сохранит их, найдёт связи и превратит разрозненные дни в историю твоей жизни.\n\nПопробуй 👉 {bot}", share: "📤 Поделиться" },
  en: { text: "📖 Imagine that in 10 years you could open any day of your life.\nRemember what you dreamed of, what ideas came to you, which decisions changed everything and what made you happy.\n\nLIFE OS helps you create such a “Book of Life”. Just record your thoughts by voice, and AI saves them, finds the connections and turns scattered days into the story of your life.\n\nTry it 👉 {bot}", share: "📤 Share" },
  uk: { text: "📖 Уяви, що через 10 років ти зможеш відкрити будь-який день свого життя.\nПригадати, про що мріяв, які ідеї приходили, які рішення змінили все і що робило тебе щасливим.\n\nLIFE OS допомагає створити таку «Книгу життя». Просто записуй думки голосом, а AI сам збереже їх, знайде зв'язки й перетворить розрізнені дні на історію твого життя.\n\nСпробуй 👉 {bot}", share: "📤 Поділитися" },
  fr: { text: "📖 Imagine que dans 10 ans tu puisses ouvrir n'importe quel jour de ta vie.\nTe souvenir de tes rêves, des idées qui te venaient, des décisions qui ont tout changé et de ce qui te rendait heureux.\n\nLIFE OS t'aide à créer un tel « Livre de vie ». Enregistre simplement tes pensées à la voix, et l'IA les sauvegarde, trouve les liens et transforme des jours épars en l'histoire de ta vie.\n\nEssaie 👉 {bot}", share: "📤 Partager" },
};

function milestoneFor(count: number, streak: number, lang: string): string | null {
  const M = MILE[lang] || MILE.ru;
  if (count === 1) return M.first;
  if ([10, 25, 50, 100, 250, 500, 1000].includes(count)) return M.count(count);
  if ([3, 7, 14, 30, 60, 100, 365].includes(streak)) return M.streak(streak);
  return null;
}

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

  // Реферал: /start ref_<id> — кто пригласил.
  let referredBy: string | undefined;
  if (typeof msg.text === "string" && msg.text.startsWith("/start ")) {
    const payload = msg.text.slice(7).trim();
    if (payload.startsWith("ref_")) referredBy = payload.slice(4);
  }

  // Каждый пользователь Telegram = аккаунт. Создаём при первом сообщении.
  let user;
  try {
    user = await getOrCreateUser(chatId, msg.from?.first_name, referredBy);
  } catch (e) {
    console.error(e);
    await sendMessage(chatId, "Не удалось завести аккаунт. Попробуй ещё раз чуть позже.");
    return NextResponse.json({ ok: true });
  }

  const link = `${origin}/u/${user.token}`;

  if (msg.text === "/start" || (typeof msg.text === "string" && msg.text.startsWith("/start "))) {
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

  if (msg.text === "/invite") {
    const I = INVITE[pickLang(msg.from?.language_code)] || INVITE.ru;
    const inviteLink = `${origin}/welcome?ref=${user.id}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(I.text.replace("{bot}", "").trim())}`;
    await sendMessage(chatId, I.text.replace("{bot}", inviteLink), { reply_markup: { inline_keyboard: [[{ text: I.share, url: shareUrl }]] } });
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/link") {
    await sendMessage(chatId, `Твоя личная ссылка на дневник:\n${link}`);
    return NextResponse.json({ ok: true });
  }

  // Ассистент: /ask <вопрос> или /q <вопрос> — отвечает по записям, НЕ сохраняет.
  if (msg.text === "/ask" || msg.text === "/q" || (typeof msg.text === "string" && (msg.text.startsWith("/ask ") || msg.text.startsWith("/q ")))) {
    const q = (msg.text || "").replace(/^\/(ask|q)\s*/, "").trim();
    if (!q) {
      await sendMessage(chatId, "Спроси что-нибудь после команды, например:\n<code>/ask как менялось моё здоровье?</code>");
      return NextResponse.json({ ok: true });
    }
    await sendChatAction(chatId, "typing");
    try {
      const ans = await askLife(user.id, q);
      await saveChat(user.id, q, ans);
      await sendMessage(chatId, esc(ans) || "—");
    } catch (e) {
      console.error(e);
      await sendMessage(chatId, "Не получилось ответить, попробуй ещё раз.");
    }
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

    // /save <текст> — принудительно сохранить как запись (минуя авто-определение смысла).
    let forceSave = false;
    if (text.startsWith("/save")) {
      forceSave = true;
      text = text.replace(/^\/save\s*/, "").trim();
      if (!text) {
        await sendMessage(chatId, "После /save напиши текст записи 🙂");
        return NextResponse.json({ ok: true });
      }
    }

    // По смыслу: это вопрос к ассистенту или запись в дневник?
    // (длинные голосовые > 160 символов всегда считаем записью, чтобы не потерять мысль)
    if (!forceSave && (!isVoice || text.length < 160)) {
      const intent = await classifyIntent(text);
      if (intent === "question") {
        await sendChatAction(chatId, "typing");
        const ans = await askLife(user.id, text);
        await saveChat(user.id, text, ans);
        await sendMessage(chatId, esc(ans) || "—");
        return NextResponse.json({ ok: true });
      }
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
    const count = await getEntryCount(user.id);
    const L = CONFIRM[lang] || CONFIRM.ru;
    let body = formatConfirm(analysis, streak, lang);
    const ms = milestoneFor(count, streak, lang);
    if (ms) body += `\n\n${ms}`;
    const mem = await getOnThisDay(user.id, entry.entry_date);
    if (mem) body += `\n\n${(MEM[lang] || MEM.ru)[mem.period](mem.summary)}`;
    const refLink = `${origin}/welcome?ref=${user.id}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent((INVITE[lang] || INVITE.ru).text.replace("{bot}", "").trim())}`;
    await sendMessage(chatId, body, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: L.book, url: `${origin}/u/${user.token}?next=/entry/${entry.id}` },
            { text: L.ask, url: `${origin}/u/${user.token}?next=/biographer` },
          ],
          [{ text: L.share, url: shareUrl }],
        ],
      },
    });
  } catch (e: any) {
    console.error(e);
    await sendMessage(chatId, "Упс, что-то пошло не так при сохранении. Попробуй ещё раз.");
  }

  return NextResponse.json({ ok: true });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatConfirm(a: Analysis, streak: number, lang: string): string {
  const L = CONFIRM[lang] || CONFIRM.ru;
  const lines = [`✅ <b>${L.saved}</b>`, "", esc(a.summary || "")];

  if (a.tags?.length) {
    lines.push("", a.tags.slice(0, 6).map((tg) => "#" + esc(tg.trim().replace(/\s+/g, "_"))).join(" "));
  }
  if (a.tasks?.length) {
    lines.push("", `🎯 <b>${L.tasksTitle}</b>`);
    a.tasks.slice(0, 3).forEach((tk) => lines.push("• " + esc(tk)));
  }
  if (a.insights?.length) {
    lines.push("", `💡 <b>${L.insightsTitle}</b>`);
    a.insights.slice(0, 2).forEach((it) => lines.push("• " + esc(it)));
  }
  const m = [
    a.mood != null ? `😊 ${a.mood}` : null,
    a.energy != null ? `⚡ ${a.energy}` : null,
    a.health != null ? `❤️ ${a.health}` : null,
  ].filter(Boolean);
  if (m.length) lines.push("", m.join("   "));
  if (streak >= 2) lines.push("", `🔥 ${streak} ${L.streakWord}`);
  return lines.join("\n");
}
