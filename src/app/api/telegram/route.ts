import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage, sendChatAction, mdToTelegram } from "@/lib/telegram";
import { transcribe } from "@/lib/transcribe";
import { analyze, classifyIntent, type Analysis } from "@/lib/ai";
import { isCorrection, amendLastEntry } from "@/lib/amendEntry";
import { createMemoryFromImage, createMemoryFromFile } from "@/lib/memory";
import { extractInstagramUrl, importInstagram } from "@/lib/instagram";
import { extractYoutubeUrl, importYoutube } from "@/lib/youtube";
import { saveEntry } from "@/lib/saveEntry";
import { getOrCreateUser, getInviteCode } from "@/lib/users";
import { getHandle } from "@/lib/handle";
import { getStreak, getEntryCount, getOnThisDay, getOpenTasks, getGoals, getInsights } from "@/lib/queries";
import { askLife, saveChat } from "@/lib/biographer";
import { getChatMode, setChatMode, talkToCompanion, clearHistory } from "@/lib/companion";
import { financeReview } from "@/lib/financeCoach";
import { syncBotCommands } from "@/lib/botCommands";
import { KB, mainKeyboard } from "@/lib/botKeyboard";
import { broadcastKeyboard } from "@/lib/broadcastKeyboard";
import { personalMorning } from "@/lib/morningPersonal";
import { morningMessage } from "@/lib/morningPush";
import { markPushResponded } from "@/lib/pushLog";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logUsage } from "@/lib/usage";

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
    "🔒 И главное: твои записи видишь только ты. Команда их не читает, а код открыт — можешь проверить сам. Скачать или удалить всё можно в один клик.",
    "Кстати, всё это красиво видно и в вебе — вот твоя личная ссылка, сохрани её:\n{link}",
  ],
  en: [
    "👋 Hi!\nA year from now, you'll barely remember today.",
    "Yet your whole life is made of days like this.",
    "🎤 Just send me your first voice message — tell me how your day went.",
    "I'll do the rest: save it, find what matters, extract insights, and start writing your Book of Life.",
    "And then I'll be able to answer any question about your life. 📖",
    "🔒 And the key part: only you see your entries. The team doesn't read them, and the code is open — check it yourself. Export or delete everything in one click.",
    "By the way, you can see it all beautifully on the web — here's your personal link, keep it:\n{link}",
  ],
  uk: [
    "👋 Привіт!\nЧерез рік ти майже напевно не згадаєш сьогоднішній день.",
    "Але саме з таких днів складається все твоє життя.",
    "🎤 Просто надішли мені перше голосове — розкажи, що сталося сьогодні.",
    "Усе інше я зроблю сам: збережу, знайду головне, виділю інсайти й почну писати твою Книгу життя.",
    "А потім я зможу відповісти на будь-яке питання про твоє життя. 📖",
    "🔒 І головне: твої записи бачиш лише ти. Команда їх не читає, а код відкритий — можеш перевірити сам. Завантажити чи видалити все можна в один клік.",
    "До речі, усе це красиво видно й у вебі — ось твоє особисте посилання, збережи його:\n{link}",
  ],
  fr: [
    "👋 Salut !\nDans un an, tu ne te souviendras presque plus d'aujourd'hui.",
    "Pourtant, toute ta vie est faite de jours comme celui-ci.",
    "🎤 Envoie-moi simplement ton premier message vocal — raconte ta journée.",
    "Je m'occupe du reste : je sauvegarde, je trouve l'essentiel, j'extrais les insights et je commence ton Livre de vie.",
    "Et ensuite, je pourrai répondre à toutes tes questions sur ta vie. 📖",
    "🔒 Et l'essentiel : toi seul vois tes entrées. L'équipe ne les lit pas, et le code est ouvert — vérifie toi-même. Exporte ou supprime tout en un clic.",
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
  ru: { saved: "Запись сохранена", insights: "инсайт(ов)", tasks: "задач(и)", tags: "тег(ов)", streakWord: "дней подряд", book: "📖 Моя Книга жизни", ask: "🧠 Спросить", share: "📤 Поделиться с другом", tasksTitle: "Задачи", insightsTitle: "Инсайты", moneyTitle: "Деньги", money: "💰 Открыть «Деньги»", moneyFail: "Не удалось записать в «Деньги» — попробуй команду /spend", heard: "Записал твоими словами", gist: "Коротко" },
  en: { saved: "Entry saved", insights: "insight(s)", tasks: "task(s)", tags: "tag(s)", streakWord: "days in a row", book: "📖 My Book of Life", ask: "🧠 Ask", share: "📤 Share with a friend", tasksTitle: "Tasks", insightsTitle: "Insights", moneyTitle: "Money", money: "💰 Open Money", moneyFail: "Couldn't save to Money — try the /spend command", heard: "Saved in your words", gist: "In short" },
  uk: { saved: "Запис збережено", insights: "інсайт(ів)", tasks: "завдань", tags: "тегів", streakWord: "днів поспіль", book: "📖 Моя Книга життя", ask: "🧠 Запитати", share: "📤 Поділитися з другом", tasksTitle: "Завдання", insightsTitle: "Інсайти", moneyTitle: "Гроші", money: "💰 Відкрити «Гроші»", moneyFail: "Не вдалося записати у «Гроші» — спробуй команду /spend", heard: "Записав твоїми словами", gist: "Коротко" },
  fr: { saved: "Entrée enregistrée", insights: "insight(s)", tasks: "tâche(s)", tags: "tag(s)", streakWord: "jours d'affilée", book: "📖 Mon Livre de vie", ask: "🧠 Demander", share: "📤 Partager avec un ami", tasksTitle: "Tâches", insightsTitle: "Insights", moneyTitle: "Argent", money: "💰 Ouvrir Argent", moneyFail: "Impossible d'enregistrer dans Argent — essaie la commande /spend", heard: "Enregistré avec tes mots", gist: "En bref" },
};

// Символы валют для подтверждения в боте.
const CUR_SYM: Record<string, string> = { USD: "$", EUR: "€", UAH: "₴", RUB: "₽", GBP: "£", PLN: "zł", KZT: "₸", GEL: "₾", TRY: "₺", AED: "AED" };

const FIXED: Record<string, string> = {
  ru: "✏️ Поправил предыдущую запись:",
  en: "✏️ Updated your previous entry:",
  uk: "✏️ Виправив попередній запис:",
  fr: "✏️ J'ai corrigé l'entrée précédente :",
};

const MEM_MSG: Record<string, { recognizing: string; readingDoc: string; saved: string; open: string; failed: string; unsupported: string }> = {
  ru: { recognizing: "📸 Распознаю фото…", readingDoc: "📄 Читаю документ…", saved: "Сохранил в Визуальную память:", open: "📂 Открыть память", failed: "Не получилось разобрать фото, попробуй ещё раз.", unsupported: "Пока понимаю фото и PDF. Пришли документ как PDF или фото 🙂" },
  en: { recognizing: "📸 Reading the photo…", readingDoc: "📄 Reading the document…", saved: "Saved to Visual Memory:", open: "📂 Open memory", failed: "Couldn't read the photo, try again.", unsupported: "For now I understand photos and PDFs. Send a PDF or a photo 🙂" },
  uk: { recognizing: "📸 Розпізнаю фото…", readingDoc: "📄 Читаю документ…", saved: "Зберіг у Візуальну пам'ять:", open: "📂 Відкрити пам'ять", failed: "Не вдалося розібрати фото, спробуй ще раз.", unsupported: "Поки розумію фото та PDF. Надішли PDF або фото 🙂" },
  fr: { recognizing: "📸 Je lis la photo…", readingDoc: "📄 Je lis le document…", saved: "Enregistré dans la Mémoire visuelle :", open: "📂 Ouvrir la mémoire", failed: "Impossible de lire la photo, réessaie.", unsupported: "Pour l'instant je comprends les photos et les PDF. Envoie un PDF ou une photo 🙂" },
};

const IG_MSG: Record<string, { working: string; saved: string; open: string; noAudio: string; failed: string; limited: string; saveFail: string }> = {
  ru: { working: "🔖 Сохраняю в Базу знаний…", saved: "Сохранил в Базу знаний:", open: "📚 Открыть Базу знаний", noAudio: "ℹ️ Звук видео достать не удалось — сохранил по подписи.", failed: "Не получилось забрать этот пост из Instagram. Попробуй другую ссылку или пришли скриншот/видео.", limited: "📉 Закончился месячный лимит на разбор Instagram. Он обновится в начале следующего месяца — или можно поднять тариф.", saveFail: "⚠️ Разобрал пост, но не смог записать его в Базу знаний. Попробуй ещё раз чуть позже." },
  en: { working: "🔖 Saving to your Knowledge Base…", saved: "Saved to your Knowledge Base:", open: "📚 Open Knowledge Base", noAudio: "ℹ️ Couldn't get the video audio — saved from the caption.", failed: "Couldn't fetch this Instagram post. Try another link or send a screenshot/video.", limited: "📉 Monthly Instagram limit reached. It resets at the start of next month — or upgrade the plan.", saveFail: "⚠️ I parsed the post but couldn't save it to your Knowledge Base. Please try again a bit later." },
  uk: { working: "🔖 Зберігаю в Базу знань…", saved: "Зберіг у Базу знань:", open: "📚 Відкрити Базу знань", noAudio: "ℹ️ Звук відео дістати не вдалося — зберіг за підписом.", failed: "Не вдалося забрати цей пост з Instagram. Спробуй інше посилання або надішли скріншот/відео.", limited: "📉 Закінчився місячний ліміт на розбір Instagram. Він оновиться на початку наступного місяця — або підвищ тариф.", saveFail: "⚠️ Розібрав пост, але не зміг записати його в Базу знань. Спробуй ще раз трохи пізніше." },
  fr: { working: "🔖 J'enregistre dans ta Base de connaissances…", saved: "Enregistré dans ta Base de connaissances :", open: "📚 Ouvrir la Base de connaissances", noAudio: "ℹ️ Impossible de récupérer l'audio — enregistré depuis la légende.", failed: "Impossible de récupérer ce post Instagram. Essaie un autre lien ou envoie une capture/vidéo.", limited: "📉 Limite mensuelle Instagram atteinte. Elle se réinitialise au début du mois prochain — ou augmente le forfait.", saveFail: "⚠️ J'ai analysé le post mais je n'ai pas pu l'enregistrer dans ta Base de connaissances. Réessaie un peu plus tard." },
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

// Клавиатура (KB, mainKeyboard) вынесена в @/lib/botKeyboard, чтобы её
// можно было переиспользовать в кронах и разовой рассылке.
function buttonAction(text?: string): "diary" | "tasks" | "motiv" | "invite" | null {
  if (!text) return null;
  for (const lang of Object.keys(KB)) {
    const k = KB[lang];
    if (text === k.diary) return "diary";
    if (text === k.tasks) return "tasks";
    if (text === k.motiv) return "motiv";
    if (text === k.invite) return "invite";
  }
  return null;
}

const HELP: Record<string, (o: string) => string> = {
  ru: (o) => `Что я умею:\n• 🎤 Зажми микрофон справа от поля ввода и наговори — я расшифрую и сохраню.\n• ✍️ Или просто напиши, что произошло.\n• 🧠 Задай вопрос — отвечу по твоему дневнику.\n\nВсе разделы и команды — в Инструкции:\n${o}/guide`,
  en: (o) => `What I can do:\n• 🎤 Hold the mic next to the input and speak — I'll transcribe and save it.\n• ✍️ Or just type what happened.\n• 🧠 Ask a question — I'll answer from your diary.\n\nAll sections and commands are in the Guide:\n${o}/guide`,
  uk: (o) => `Що я вмію:\n• 🎤 Затисни мікрофон біля поля вводу і наговори — я розшифрую та збережу.\n• ✍️ Або просто напиши, що сталося.\n• 🧠 Постав питання — відповім за твоїм щоденником.\n\nУсі розділи та команди — в Інструкції:\n${o}/guide`,
  fr: (o) => `Ce que je sais faire :\n• 🎤 Maintiens le micro à côté du champ et parle — je transcris et j'enregistre.\n• ✍️ Ou écris simplement ce qui s'est passé.\n• 🧠 Pose une question — je réponds depuis ton journal.\n\nTout est dans le Guide :\n${o}/guide`,
};

const DIARY_LABEL: Record<string, string> = { ru: "Твой дневник:", en: "Your diary:", uk: "Твій щоденник:", fr: "Ton journal :" };
const L_MONEY: Record<string, string> = { ru: "💰 Открыть «Деньги»", en: "💰 Open Money", uk: "💰 Відкрити «Гроші»", fr: "💰 Ouvrir Argent" };

// Распознать токен валюты (код или символ) → ISO-код, иначе null.
const CUR_TOKEN: Record<string, string> = {
  "€": "EUR", eur: "EUR", евро: "EUR", "$": "USD", usd: "USD", дол: "USD",
  "₴": "UAH", uah: "UAH", грн: "UAH", "₽": "RUB", rub: "RUB", руб: "RUB",
  "£": "GBP", gbp: "GBP", "zł": "PLN", pln: "PLN", "₸": "KZT", kzt: "KZT",
  "₾": "GEL", gel: "GEL", "₺": "TRY", try: "TRY", aed: "AED",
};

// Быстрый ввод траты/дохода: «/spend 250 eur уроки сёрфа», «/income 1000 зарплата».
// Возвращает { amount, currency, label } или null. defaultCur — если валюта не указана.
function parseQuickFinance(rest: string, defaultCur: string): { amount: number; currency: string; category: string | null; subcategory: string | null; note: string | null } | null {
  const m = rest.trim().match(/^([\d][\d\s.,]*)\s*(\S*)\s*([\s\S]*)$/);
  if (!m) return null;
  const amount = Number(m[1].replace(/[\s ]/g, "").replace(",", "."));
  if (!isFinite(amount) || amount <= 0 || amount > 1e12) return null;
  let currency = defaultCur;
  let label = (m[3] || "").trim();
  const tok = (m[2] || "").toLowerCase().replace(/\.$/, "");
  if (tok && CUR_TOKEN[tok]) currency = CUR_TOKEN[tok];
  else if (m[2]) label = (m[2] + " " + label).trim(); // не валюта — часть названия
  // Формат: «Категория / Подкатегория : комментарий». «:»/«—»/« - » отделяют комментарий,
  // «/» внутри категории — подкатегорию. Все части необязательны.
  let head = label, note: string | null = null;
  const sep = label.match(/^(.+?)\s*[:—]\s*([\s\S]+)$/) || label.match(/^(.+?)\s+-\s+([\s\S]+)$/);
  if (sep) { head = sep[1].trim(); note = sep[2].trim() || null; }
  let category: string | null = head || null;
  let subcategory: string | null = null;
  const slash = head.match(/^(.+?)\s*\/\s*(.+)$/);
  if (slash) { category = slash[1].trim() || null; subcategory = slash[2].trim() || null; }
  return {
    amount: Math.round(amount * 100) / 100,
    currency,
    category: category ? category.slice(0, 40) : null,
    subcategory: subcategory ? subcategory.slice(0, 40) : null,
    note: note ? note.slice(0, 200) : null,
  };
}
const OPEN: Record<string, string> = { ru: "📖 Открыть мой дневник", en: "📖 Open my diary", uk: "📖 Відкрити щоденник", fr: "📖 Ouvrir mon journal" };
function openBtn(lang: string, link: string) {
  return { reply_markup: { inline_keyboard: [[{ text: OPEN[lang] || OPEN.ru, url: link }]] } };
}

async function sendInvite(chatId: number, lang: string, origin: string, userId: string) {
  const I = INVITE[lang] || INVITE.ru;
  const inviteLink = `${origin}/i/${await getHandle(userId)}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(I.text.replace("{bot}", "").trim())}`;
  await sendMessage(chatId, I.text.replace("{bot}", inviteLink), { reply_markup: { inline_keyboard: [[{ text: I.share, url: shareUrl }]] } });
}

// Кнопка «Мои задачи»: список открытых задач прямо в чат.
const TASKS_MSG: Record<string, { title: string; empty: string; open: string }> = {
  ru: { title: "✅ <b>Твои открытые задачи:</b>", empty: "Открытых задач пока нет 🎉\nОни появятся сами, когда в записи мелькнёт что-то вроде «надо сделать…».", open: "✅ Открыть все задачи" },
  en: { title: "✅ <b>Your open tasks:</b>", empty: "No open tasks yet 🎉\nThey'll show up on their own when you mention something like “need to do…”.", open: "✅ Open all tasks" },
  uk: { title: "✅ <b>Твої відкриті завдання:</b>", empty: "Відкритих завдань поки немає 🎉\nВони з'являться самі, коли в записі промайне щось на кшталт «треба зробити…».", open: "✅ Відкрити всі завдання" },
  fr: { title: "✅ <b>Tes tâches en cours :</b>", empty: "Pas encore de tâches 🎉\nElles apparaîtront quand tu mentionneras « à faire… ».", open: "✅ Voir toutes les tâches" },
};

// Кнопка «Моя мотивация»: стрик + цели + свежий инсайт прямо в чат.
const GOALS_BTN: Record<string, string> = { ru: "🎯 Открыть цели", en: "🎯 Open goals", uk: "🎯 Відкрити цілі", fr: "🎯 Voir les objectifs" };
const MOTIV: Record<string, { streak: (n: number) => string; noStreak: string; goals: string; noGoals: string; insight: string; footer: string }> = {
  ru: {
    streak: (n) => `🔥 <b>${n} дней подряд</b> — ты в потоке, держи темп!`,
    noStreak: "🔥 Серия пока не началась — сделай запись сегодня и запусти счётчик!",
    goals: "🎯 <b>Твои цели:</b>", noGoals: "🎯 Целей пока нет — добавь, к чему стремишься, чтобы видеть прогресс.",
    insight: "💡 <b>Недавний инсайт:</b>", footer: "Маленький шаг сегодня — большая история через год. 🌱",
  },
  en: {
    streak: (n) => `🔥 <b>${n} days in a row</b> — you're in the flow, keep it up!`,
    noStreak: "🔥 No streak yet — make an entry today and start the counter!",
    goals: "🎯 <b>Your goals:</b>", noGoals: "🎯 No goals yet — add what you're aiming for to track progress.",
    insight: "💡 <b>Recent insight:</b>", footer: "A small step today — a big story in a year. 🌱",
  },
  uk: {
    streak: (n) => `🔥 <b>${n} днів поспіль</b> — ти в потоці, тримай темп!`,
    noStreak: "🔥 Серія ще не почалася — зроби запис сьогодні й запусти лічильник!",
    goals: "🎯 <b>Твої цілі:</b>", noGoals: "🎯 Цілей поки немає — додай, до чого прагнеш, щоб бачити прогрес.",
    insight: "💡 <b>Нещодавній інсайт:</b>", footer: "Маленький крок сьогодні — велика історія за рік. 🌱",
  },
  fr: {
    streak: (n) => `🔥 <b>${n} jours d'affilée</b> — tu es dans le flow, continue !`,
    noStreak: "🔥 Pas encore de série — fais une entrée aujourd'hui et lance le compteur !",
    goals: "🎯 <b>Tes objectifs :</b>", noGoals: "🎯 Pas encore d'objectifs — ajoute ce que tu vises pour suivre tes progrès.",
    insight: "💡 <b>Insight récent :</b>", footer: "Un petit pas aujourd'hui — une grande histoire dans un an. 🌱",
  },
};

async function motivationReport(userId: string, lang: string): Promise<string> {
  const M = MOTIV[lang] || MOTIV.ru;
  const [streak, goals, insights] = await Promise.all([getStreak(userId), getGoals(userId), getInsights(userId)]);
  const parts: string[] = [streak > 0 ? M.streak(streak) : M.noStreak];
  if (goals.length) {
    const top = goals.slice(0, 3).map((g: any) => `• ${esc(g.title || "")} — ${g.progress ?? 0}%`).join("\n");
    parts.push(`${M.goals}\n${top}`);
  } else {
    parts.push(M.noGoals);
  }
  if (insights.length) parts.push(`${M.insight}\n«${esc(insights[0].text || "")}»`);
  parts.push(M.footer);
  return parts.join("\n\n");
}

// Один раз на «тёплый» инстанс синхронизируем меню команд бота с кодом,
// чтобы новые команды появлялись в Telegram без ручного вызова setup-commands.
let commandsSynced = false;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse("forbidden", { status: 403 });
  }
  if (!commandsSynced) { commandsSynced = true; syncBotCommands().catch(() => {}); }

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
    user = await getOrCreateUser(chatId, msg.from?.first_name, referredBy, pickLang(msg.from?.language_code));
  } catch (e) {
    console.error(e);
    await sendMessage(chatId, "Не удалось завести аккаунт. Попробуй ещё раз чуть позже.");
    return NextResponse.json({ ok: true });
  }

  const link = `${origin}/u/${user.token}`;

  // Пользователь что-то прислал → засчитываем отклик на недавние пуши (аналитика).
  markPushResponded(user.id).catch(() => {});

  if (msg.text === "/start" || (typeof msg.text === "string" && msg.text.startsWith("/start "))) {
    const lang = pickLang(msg.from?.language_code);
    if (user.isNew) {
      const seq = WELCOME[lang] || WELCOME.ru;
      for (let i = 0; i < seq.length; i++) {
        await sendChatAction(chatId, "typing");
        await sleep(i === 0 ? 400 : 1300);
        await sendMessage(chatId, seq[i].replace("{link}", link), i === 0 ? { reply_markup: mainKeyboard(lang) } : i === seq.length - 1 ? openBtn(lang, link) : undefined);
      }
    } else {
      await sendMessage(chatId, (RETURN[lang] || RETURN.ru).replace("{link}", link), { reply_markup: mainKeyboard(lang) });
    }
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/demo") {
    const lang = pickLang(msg.from?.language_code);
    const seq = WELCOME[lang] || WELCOME.ru;
    for (let i = 0; i < seq.length; i++) {
      await sendChatAction(chatId, "typing");
      await sleep(i === 0 ? 400 : 1300);
      await sendMessage(chatId, seq[i].replace("{link}", link), i === 0 ? { reply_markup: mainKeyboard(lang) } : i === seq.length - 1 ? openBtn(lang, link) : undefined);
    }
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/invite") {
    await sendInvite(chatId, pickLang(msg.from?.language_code), origin, user.id);
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/link") {
    const lang = pickLang(msg.from?.language_code);
    await sendMessage(chatId, `${DIARY_LABEL[lang] || DIARY_LABEL.ru}\n${link}`, openBtn(lang, link));
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/resetpin") {
    try { await supabaseAdmin().from("users").update({ pin_hash: null }).eq("id", user.id); } catch {}
    await sendMessage(chatId, "🔓 PIN сброшен. Теперь можно войти в веб без кода — и при желании задать новый в разделе «Профиль».");
    return NextResponse.json({ ok: true });
  }

  // 💬 Режим беседы с AI-другом: /chat включает, /stop выключает, /newchat — с чистого листа.
  if (typeof msg.text === "string" && /^\/chat\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    await setChatMode(user.id, true);
    const greet =
      lang === "en"
        ? "💬 Chat mode is on. I'm your friend who knows your whole story — let's just talk: ask, share, think out loud. I can also look things up online.\n\nWrite /stop to leave, /newchat to start fresh."
        : "💬 Режим беседы включён. Я — твой друг, который знает всю твою историю. Давай просто поговорим: спрашивай, делись, рассуждай вслух. Если надо — загляну и в интернет за свежим.\n\nЧтобы выйти — /stop, начать заново — /newchat.";
    await sendMessage(chatId, greet);
    return NextResponse.json({ ok: true });
  }

  if (typeof msg.text === "string" && /^\/stop\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    await setChatMode(user.id, false);
    await sendMessage(
      chatId,
      lang === "en"
        ? "✅ Left chat mode. Your messages go back to the diary. Type /chat anytime to talk again."
        : "✅ Вышли из беседы. Сообщения снова идут в дневник. Захочешь поговорить — /chat."
    );
    return NextResponse.json({ ok: true });
  }

  if (typeof msg.text === "string" && /^\/newchat\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    await clearHistory(user.id);
    await setChatMode(user.id, true);
    await sendMessage(
      chatId,
      lang === "en" ? "🆕 Started a fresh conversation. I'm all ears." : "🆕 Начали новую беседу. Я весь внимание."
    );
    return NextResponse.json({ ok: true });
  }

  // Разовая рассылка обновлённой клавиатуры всем — ТОЛЬКО владелец: /pushmenu.
  if (typeof msg.text === "string" && /^\/pushmenu\b/i.test(msg.text.trim())) {
    if (!process.env.TELEGRAM_ALLOWED_CHAT_ID || String(chatId) !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
      return NextResponse.json({ ok: true }); // не владелец — тихо игнорируем
    }
    await sendMessage(chatId, "Рассылаю обновлённое меню всем пользователям… ⏳");
    try {
      const res = await broadcastKeyboard();
      await sendMessage(chatId, `✅ Готово.\nОтправлено: ${res.sent}\nПропущено (выкл. пуши): ${res.skipped}\nОшибок: ${res.failed}`);
    } catch (e) {
      console.error("pushmenu", e);
      await sendMessage(chatId, "Не получилось разослать. Загляни в логи 🙂");
    }
    return NextResponse.json({ ok: true });
  }

  // Превью персонального утреннего пуша — ТОЛЬКО владелец: /morning.
  if (typeof msg.text === "string" && /^\/morning\b/i.test(msg.text.trim())) {
    if (!process.env.TELEGRAM_ALLOWED_CHAT_ID || String(chatId) !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
      return NextResponse.json({ ok: true }); // не владелец — тихо игнорируем
    }
    await sendChatAction(chatId, "typing");
    const lang = pickLang(msg.from?.language_code);
    const text = (await personalMorning(user.id, user.name ?? null, lang)) || morningMessage(lang, Math.floor(Date.now() / 86400000));
    await sendMessage(chatId, text, { reply_markup: mainKeyboard(lang) });
    // Сохраняем в историю — чтобы на «а что за…» ассистент связал с этим сообщением.
    saveChat(user.id, "☀️ (моё утреннее сообщение пользователю)", text).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // Помощь: команда /help|/guide (помощь живёт в меню команд бота).
  if (typeof msg.text === "string" && /^\/(help|guide|помощь|допомога|aide)\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    await sendMessage(chatId, (HELP[lang] || HELP.ru)(origin));
    return NextResponse.json({ ok: true });
  }

  // Финансовый разбор: команда /money|/finance|/деньги|/финансы.
  if (typeof msg.text === "string" && /^\/(money|finance|деньги|финансы)\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    await sendChatAction(chatId, "typing");
    try {
      const report = await financeReview(user.id, lang);
      await sendMessage(chatId, report, { reply_markup: { inline_keyboard: [[{ text: L_MONEY[lang] || L_MONEY.ru, url: `${origin}/u/${user.token}?next=/finance` }]] } });
    } catch (e) {
      console.error("money cmd", e);
      await sendMessage(chatId, "Не получилось собрать разбор. Попробуй чуть позже 🙂");
    }
    return NextResponse.json({ ok: true });
  }

  // Быстрая запись траты/дохода: /spend|/расход и /income|/доход.
  if (typeof msg.text === "string" && /^\/(spend|income|расход|доход)\b/i.test(msg.text.trim())) {
    const lang = pickLang(msg.from?.language_code);
    const kind = /^\/(income|доход)\b/i.test(msg.text.trim()) ? "income" : "expense";
    const rest = msg.text.replace(/^\/(spend|income|расход|доход)\s*/i, "");
    if (!rest.trim()) {
      await sendMessage(chatId, kind === "income"
        ? "Напиши сумму и источник, например:\n<code>/income 1000 eur зарплата</code>"
        : "Напиши сумму и на что, например:\n<code>/spend 250 eur сёрф</code>\n\nМожно вести по структуре <b>Категория / Подкатегория : комментарий</b>:\n<code>/spend 250 eur Вова / Спорт: серф-уроки</code>\n→ категория «Вова», подкатегория «Спорт», комментарий «серф-уроки».\nПо «Вова» считается общая сумма, внутри — по подкатегориям.\n\nЧастые подкатегории: Спорт · Обучение · Одежда · Здоровье · Еда · Развлечения · Подарки · Транспорт.");
      return NextResponse.json({ ok: true });
    }
    // Основная валюта по умолчанию — из настроек финансов, иначе EUR.
    let defaultCur = "EUR";
    try {
      const { data: st } = await supabaseAdmin().from("finance_settings").select("base_currency").eq("user_id", user.id).maybeSingle();
      if (st?.base_currency) defaultCur = st.base_currency as string;
    } catch {}
    const parsed = parseQuickFinance(rest, defaultCur);
    if (!parsed) {
      await sendMessage(chatId, "Не понял сумму. Пример: <code>/spend 250 eur уроки сёрфа</code>");
      return NextResponse.json({ ok: true });
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      const row: any = {
        user_id: user.id, day: today, kind, amount: parsed.amount, currency: parsed.currency,
        category: parsed.category, subcategory: parsed.subcategory, note: parsed.note,
      };
      let { error } = await supabaseAdmin().from("finance_tx").insert(row);
      // Старая база без колонки subcategory — вставляем без неё.
      if (error && /subcategory|column|schema cache/i.test(error.message)) {
        const { subcategory, ...bare } = row;
        ({ error } = await supabaseAdmin().from("finance_tx").insert(bare));
      }
      if (error) throw new Error(error.message);
      const sym = CUR_SYM[parsed.currency] || parsed.currency;
      const sign = kind === "income" ? "+" : "−";
      const head = kind === "income" ? "✅ Доход записан:" : "✅ Расход записан:";
      const cat = parsed.category ? ` · ${esc(parsed.category)}` : "";
      const sub = parsed.subcategory ? ` › ${esc(parsed.subcategory)}` : "";
      const note = parsed.note ? `\n📝 ${esc(parsed.note)}` : "";
      await sendMessage(chatId, `${head}\n💰 <b>${sign}${parsed.amount} ${sym}</b>${cat}${sub}${note}`,
        { reply_markup: { inline_keyboard: [[{ text: L_MONEY[lang] || L_MONEY.ru, url: `${origin}/u/${user.token}?next=/finance` }]] } });
    } catch (e) {
      console.error("quick finance", e);
      await sendMessage(chatId, "Не получилось записать операцию. Попробуй ещё раз 🙂");
    }
    return NextResponse.json({ ok: true });
  }

  // Нажатия кнопок постоянной клавиатуры.
  const ba = buttonAction(msg.text);
  if (ba) {
    const lang = pickLang(msg.from?.language_code);
    if (ba === "tasks") {
      const tasks = await getOpenTasks(user.id, 100);
      const T = TASKS_MSG[lang] || TASKS_MSG.ru;
      if (!tasks.length) await sendMessage(chatId, T.empty);
      else {
        const list = tasks.map((t: any) => `• ${esc(t.text || "")}`).join("\n");
        const url = `${origin}/u/${user.token}?next=${encodeURIComponent("/goals?tab=tasks")}`;
        await sendMessage(chatId, `${T.title}\n${list}`, { reply_markup: { inline_keyboard: [[{ text: T.open, url }]] } });
      }
    }
    else if (ba === "motiv") {
      await sendChatAction(chatId, "typing");
      try {
        const report = await motivationReport(user.id, lang);
        await sendMessage(chatId, report, { reply_markup: { inline_keyboard: [[{ text: GOALS_BTN[lang] || GOALS_BTN.ru, url: `${origin}/u/${user.token}?next=/goals` }]] } });
      } catch (e) {
        console.error("motiv btn", e);
        await sendMessage(chatId, "Не получилось собрать сводку. Попробуй чуть позже 🙂");
      }
    }
    else if (ba === "invite") await sendInvite(chatId, lang, origin, user.id);
    else await sendMessage(chatId, DIARY_LABEL[lang] || DIARY_LABEL.ru, openBtn(lang, link));
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
      await sendMessage(chatId, mdToTelegram(ans) || "—");
    } catch (e) {
      console.error(e);
      await sendMessage(chatId, "Не получилось ответить, попробуй ещё раз.");
    }
    return NextResponse.json({ ok: true });
  }

  try {
    // 📸 Фото/документ → «Визуальная память» (AI понимает смысл и извлекает данные)
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length) {
      const lang = pickLang(msg.from?.language_code);
      const L = MEM_MSG[lang] || MEM_MSG.ru;
      await sendMessage(chatId, L.recognizing);
      try {
        const ph = msg.photo[msg.photo.length - 1];
        const fileUrl = await getFileUrl(ph.file_id);
        const buf = Buffer.from(await (await fetch(fileUrl)).arrayBuffer());
        const { memory, vision } = await createMemoryFromImage(user.id, buf, "image/jpeg");
        let body = `📸 ${L.saved}\n\n<b>${esc(vision.title)}</b>`;
        if (vision.summary) body += `\n${esc(vision.summary)}`;
        if (vision.fields?.length) body += "\n\n" + vision.fields.slice(0, 6).map((f) => `• ${esc(f.label)}: ${esc(f.value)}`).join("\n");
        const extra = memory ? { reply_markup: { inline_keyboard: [[{ text: L.open, url: `${origin}/u/${user.token}?next=/memory` }]] } } : undefined;
        await sendMessage(chatId, body, extra);
      } catch (e) {
        console.error("photo", e);
        await sendMessage(chatId, L.failed);
      }
      return NextResponse.json({ ok: true });
    }

    // 📄 Документ/файл (PDF, скан как файл) → «Визуальная память» с распознаванием содержимого.
    if (msg.document && msg.document.file_id) {
      const lang = pickLang(msg.from?.language_code);
      const L = MEM_MSG[lang] || MEM_MSG.ru;
      const doc = msg.document;
      const mime = (doc.mime_type || "").toLowerCase();
      const supported = mime.startsWith("image/") || mime === "application/pdf";
      if (!supported) {
        await sendMessage(chatId, L.unsupported);
        return NextResponse.json({ ok: true });
      }
      await sendMessage(chatId, mime === "application/pdf" ? L.readingDoc : L.recognizing);
      try {
        const fileUrl = await getFileUrl(doc.file_id);
        const buf = Buffer.from(await (await fetch(fileUrl)).arrayBuffer());
        const { memory, vision } = await createMemoryFromFile(user.id, buf, mime, doc.file_name);
        let body = `${mime === "application/pdf" ? "📄" : "📸"} ${L.saved}\n\n<b>${esc(vision.title)}</b>`;
        if (vision.summary) body += `\n${esc(vision.summary)}`;
        if (vision.fields?.length) body += "\n\n" + vision.fields.slice(0, 8).map((f) => `• ${esc(f.label)}: ${esc(f.value)}`).join("\n");
        const extra = memory ? { reply_markup: { inline_keyboard: [[{ text: L.open, url: `${origin}/u/${user.token}?next=/memory` }]] } } : undefined;
        await sendMessage(chatId, body, extra);
      } catch (e) {
        console.error("document", e);
        await sendMessage(chatId, L.failed);
      }
      return NextResponse.json({ ok: true });
    }

    let text: string | undefined = msg.text;
    const isVoice = Boolean(msg.voice || msg.audio);

    if (isVoice) {
      await sendMessage(chatId, "🎧 Распознаю голос…");
      const fileId = (msg.voice || msg.audio).file_id;
      const url = await getFileUrl(fileId);
      text = await transcribe(url);
      logUsage(user.id, "transcribe", 0, 0, 0.5);
    }

    if (!text || !text.trim()) {
      await sendMessage(chatId, "Пришли текст или голосовое сообщение 🙂");
      return NextResponse.json({ ok: true });
    }

    // 💬 Режим беседы: пока он включён, текст/голос идут к AI-другу (с памятью
    //    диалога и веб-поиском), а НЕ в дневник. Выход — командой /stop (поймана выше).
    if (await getChatMode(user.id)) {
      await sendChatAction(chatId, "typing");
      try {
        const reply = await talkToCompanion(user.id, user.name ?? null, text);
        await sendMessage(chatId, mdToTelegram(reply) || "…");
      } catch (e) {
        console.error("companion", e);
        await sendMessage(chatId, "Что-то сбилось, скажи ещё раз 🙂");
      }
      return NextResponse.json({ ok: true });
    }

    // 🔖 Ссылка Instagram / YouTube → сохраняем в личную Базу знаний (НЕ в дневник).
    const igUrl = extractInstagramUrl(text);
    const yt = extractYoutubeUrl(text);
    if (igUrl || yt) {
      const lang = pickLang(msg.from?.language_code);
      const L = IG_MSG[lang] || IG_MSG.ru;
      await sendMessage(chatId, L.working);
      try {
        const r = igUrl ? await importInstagram(user.id, igUrl, lang) : await importYoutube(user.id, yt!.url, yt!.kind, lang);
        if (r.ok === false) {
          await sendMessage(chatId, r.reason === "limited" ? L.limited : L.failed);
          return NextResponse.json({ ok: true });
        }
        // Разбор удался, но запись в базу упала — честно предупреждаем, а не врём «сохранил».
        if (!r.saved) {
          await sendMessage(chatId, L.saveFail);
          return NextResponse.json({ ok: true });
        }
        const a = r.analysis;
        let body = `🔖 <b>${L.saved}</b>\n\n<b>${esc(a.title)}</b>`;
        if (a.topic) body += `\n📂 ${esc(a.topic)}`;
        if (a.summary) body += `\n\n${esc(a.summary)}`;
        if (a.key_points?.length) body += "\n\n" + a.key_points.slice(0, 5).map((p) => "• " + esc(p)).join("\n");
        if (a.tags?.length) body += "\n\n" + a.tags.slice(0, 6).map((tg) => "#" + esc(tg.trim().replace(/\s+/g, "_"))).join(" ");
        if (r.kind === "reel" && !r.hadTranscript) body += `\n\n${L.noAudio}`;
        await sendMessage(chatId, body, { reply_markup: { inline_keyboard: [[{ text: L.open, url: `${origin}/u/${user.token}?next=/knowledge` }]] } });
      } catch (e) {
        console.error("instagram", e);
        await sendMessage(chatId, L.failed);
      }
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

    // Похоже на исправление предыдущей записи? Правим её, а НЕ плодим новую
    // и НЕ отвечаем как на вопрос. ВАЖНО: проверяем ДО classifyIntent — иначе
    // фразы вроде «ты неправильно записал…» классификатор принимает за вопрос,
    // уводит в askLife, и запись в базе не меняется (бот «поговорил», но не исправил).
    if (!forceSave && isCorrection(text)) {
      const amended = await amendLastEntry(user.id, text);
      if (amended) {
        const lang = pickLang(msg.from?.language_code);
        const L = CONFIRM[lang] || CONFIRM.ru;
        const streak = await getStreak(user.id);
        const body = `${FIXED[lang] || FIXED.ru}\n\n${formatConfirm(amended.analysis, streak, lang)}`;
        await sendMessage(chatId, body, {
          reply_markup: { inline_keyboard: [[{ text: L.book, url: `${origin}/u/${user.token}?next=/entry/${amended.entry.id}` }]] },
        });
        return NextResponse.json({ ok: true });
      }
      // нет сегодняшней записи для правки → проваливаемся дальше (вопрос/новая запись)
    }

    // По смыслу: это вопрос к ассистенту или запись в дневник?
    // (длинные голосовые > 160 символов всегда считаем записью, чтобы не потерять мысль)
    if (!forceSave && (!isVoice || text.length < 160)) {
      const intent = await classifyIntent(text, user.id);
      if (intent === "question") {
        await sendChatAction(chatId, "typing");
        const ans = await askLife(user.id, text);
        await saveChat(user.id, text, ans);
        await sendMessage(chatId, mdToTelegram(ans) || "—");
        return NextResponse.json({ ok: true });
      }
    }

    const analysis = await analyze(text, user.id);
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
    const financeOk = !analysis.finance?.length || ((entry as any).financeSaved ?? 0) > 0;
    if (analysis.finance?.length && !financeOk) console.error("finance not saved", (entry as any).financeError);
    let body = formatConfirm(analysis, streak, lang, financeOk, isVoice ? text : undefined);
    const ms = milestoneFor(count, streak, lang);
    if (ms) body += `\n\n${ms}`;
    const mem = await getOnThisDay(user.id, entry.entry_date);
    if (mem) body += `\n\n${(MEM[lang] || MEM.ru)[mem.period](mem.summary)}`;
    const refLink = `${origin}/i/${await getHandle(user.id, user.name)}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent((INVITE[lang] || INVITE.ru).text.replace("{bot}", "").trim())}`;
    const rows: any[] = [
      [
        { text: L.book, url: `${origin}/u/${user.token}?next=/entry/${entry.id}` },
      ],
    ];
    if (analysis.finance?.length) rows.push([{ text: L.money, url: `${origin}/u/${user.token}?next=/finance` }]);
    rows.push([{ text: L.share, url: shareUrl }]);
    await sendMessage(chatId, body, { reply_markup: { inline_keyboard: rows } });
  } catch (e: any) {
    console.error(e);
    await sendMessage(chatId, "Упс, что-то пошло не так при сохранении. Попробуй ещё раз.");
  }

  return NextResponse.json({ ok: true });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatConfirm(a: Analysis, streak: number, lang: string, financeSaved = true, fullText?: string): string {
  const L = CONFIRM[lang] || CONFIRM.ru;
  const isVoice = !!(fullText && fullText.trim());

  // Структурная часть — как AI разобрал запись. Показывается ПОЛНОСТЬЮ, без обрезки:
  // все задачи, все инсайты, все теги и метрики.
  const rest: string[] = [];
  const gist = (a.summary || "").trim();
  if (gist) {
    // Для голоса резюме идёт отдельной строкой «Коротко» (под полной расшифровкой);
    // для текста — это основной текст подтверждения.
    if (isVoice) rest.push("", `💬 <b>${L.gist}:</b> ${esc(gist)}`);
    else rest.push("", esc(gist));
  }
  if (a.tags?.length) {
    rest.push("", a.tags.map((tg) => "#" + esc(tg.trim().replace(/\s+/g, "_"))).join(" "));
  }
  if (a.tasks?.length) {
    rest.push("", `🎯 <b>${L.tasksTitle}</b>`);
    a.tasks.forEach((tk) => rest.push("• " + esc(tk)));
  }
  if (a.insights?.length) {
    rest.push("", `💡 <b>${L.insightsTitle}</b>`);
    a.insights.forEach((it) => rest.push("• " + esc(it)));
  }
  if (a.finance?.length) {
    rest.push("", `💰 <b>${L.moneyTitle}</b>`);
    a.finance.forEach((f) => {
      const sym = CUR_SYM[f.currency || "USD"] || f.currency || "";
      const sign = f.kind === "income" ? "+" : "−";
      const note = f.note ? ` · ${esc(f.note)}` : "";
      rest.push(`• ${f.kind === "income" ? "📈" : "💸"} ${sign}${esc(String(f.amount))} ${sym}${note}`);
    });
    if (!financeSaved) rest.push(`⚠️ ${L.moneyFail}`);
  }
  const m = [
    a.mood != null ? `😊 ${a.mood}` : null,
    a.energy != null ? `⚡ ${a.energy}` : null,
    a.health != null ? `❤️ ${a.health}` : null,
  ].filter(Boolean);
  if (m.length) rest.push("", m.join("   "));
  if (streak >= 2) rest.push("", `🔥 ${streak} ${L.streakWord}`);

  const head = [`✅ <b>${L.saved}</b>`];
  // Полная расшифровка голоса (слово в слово) занимает ОСТАТОК места до лимита
  // Telegram (4096) — так структурная часть (задачи/инсайты) никогда не обрезается.
  if (isVoice) {
    const ft = fullText!.trim();
    const used = head.join("\n").length + rest.join("\n").length + 80; // запас на разметку/заголовок
    const budget = Math.max(400, 4000 - used);
    const shown = ft.length > budget ? ft.slice(0, budget).trimEnd() + "…" : ft;
    head.push("", `📝 <b>${L.heard}:</b>`, esc(shown));
  }
  return [...head, ...rest].join("\n");
}
