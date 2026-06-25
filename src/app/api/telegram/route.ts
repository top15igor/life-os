import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage, sendChatAction } from "@/lib/telegram";
import { transcribe } from "@/lib/transcribe";
import { analyze, type Analysis } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { getOrCreateUser } from "@/lib/users";
import { getStreak, getEntryCount, getOnThisDay } from "@/lib/queries";

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
  ru: { saved: "Запись сохранена", insights: "инсайт(ов)", tasks: "задач(и)", tags: "тег(ов)", streakWord: "дней подряд", book: "📖 Моя Книга жизни", ask: "🧠 Спросить", share: "📤 Поделиться с другом" },
  en: { saved: "Entry saved", insights: "insight(s)", tasks: "task(s)", tags: "tag(s)", streakWord: "days in a row", book: "📖 My Book of Life", ask: "🧠 Ask", share: "📤 Share with a friend" },
  uk: { saved: "Запис збережено", insights: "інсайт(ів)", tasks: "завдань", tags: "тегів", streakWord: "днів поспіль", book: "📖 Моя Книга життя", ask: "🧠 Запитати", share: "📤 Поділитися з другом" },
  fr: { saved: "Entrée enregistrée", insights: "insight(s)", tasks: "tâche(s)", tags: "tag(s)", streakWord: "jours d'affilée", book: "📖 Mon Livre de vie", ask: "🧠 Demander", share: "📤 Partager avec un ami" },
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
  ru: { text: "Нашёл классную штуку — личный дневник жизни LIFE OS 📖\n\nНаговариваешь голосом, как прошёл день, а AI сам сохраняет, находит инсайты, связывает события и пишет твою «Книгу жизни». Через годы можно будет заново прожить свою историю.\n\nПопробуй, тебе понравится 👉 {bot}", share: "📤 Поделиться" },
  en: { text: "Found something great — a personal life diary, LIFE OS 📖\n\nYou just say how your day went, and AI saves it, finds insights, connects events and writes your “Book of Life”. Years later you can relive your whole story.\n\nTry it, you'll love it 👉 {bot}", share: "📤 Share" },
  uk: { text: "Знайшов класну штуку — особистий щоденник життя LIFE OS 📖\n\nНаговорюєш голосом, як минув день, а AI сам зберігає, знаходить інсайти, пов'язує події й пише твою «Книгу життя». Через роки зможеш заново прожити свою історію.\n\nСпробуй, тобі сподобається 👉 {bot}", share: "📤 Поділитися" },
  fr: { text: "J'ai trouvé un truc génial — un journal de vie personnel, LIFE OS 📖\n\nTu racontes ta journée à la voix, et l'IA sauvegarde, trouve des insights, relie les événements et écrit ton « Livre de vie ». Des années plus tard, tu pourras revivre toute ton histoire.\n\nEssaie, tu vas adorer 👉 {bot}", share: "📤 Partager" },
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
    const me = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`).then((r) => r.json()).catch(() => null);
    const botLink = me?.result?.username ? `https://t.me/${me.result.username}?start=ref_${user.id}` : origin;
    const I = INVITE[pickLang(msg.from?.language_code)] || INVITE.ru;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(I.text.replace("{bot}", "").trim())}`;
    await sendMessage(chatId, I.text.replace("{bot}", botLink), { reply_markup: { inline_keyboard: [[{ text: I.share, url: shareUrl }]] } });
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
    const count = await getEntryCount(user.id);
    const L = CONFIRM[lang] || CONFIRM.ru;
    let body = formatConfirm(analysis, streak, lang);
    const ms = milestoneFor(count, streak, lang);
    if (ms) body += `\n\n${ms}`;
    const mem = await getOnThisDay(user.id, entry.entry_date);
    if (mem) body += `\n\n${(MEM[lang] || MEM.ru)[mem.period](mem.summary)}`;
    const bl = await botShareLink(origin);
    const refLink = bl.startsWith("https://t.me/") ? `${bl}?start=ref_${user.id}` : bl;
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
