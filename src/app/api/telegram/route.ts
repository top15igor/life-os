import { NextRequest, NextResponse } from "next/server";
import { getFileUrl, sendMessage, sendChatAction, mdToTelegram, mdToPlain, answerCallback, sendVoice, sendVideo, sendMediaGroup, editMessageText } from "@/lib/telegram";
import { speak } from "@/lib/tts";
import { transcribe } from "@/lib/transcribe";
import { analyze, type Analysis } from "@/lib/ai";
import { routeMessage, runAction } from "@/lib/botActions";
import { isCorrection, amendLastEntry } from "@/lib/amendEntry";
import { createMemoryFromImage, createMemoryFromFile } from "@/lib/memory";
import { extractInstagramUrl, importInstagram, igDebug } from "@/lib/instagram";
import { extractYoutubeUrl, importYoutube } from "@/lib/youtube";
import { extractTiktokUrl, importTiktok } from "@/lib/tiktok";
import { extractShopUrl, extractAnyUrl, addWishFromUrl, formatPrice, setWishPublic } from "@/lib/wishlist";
import { addBookFromImage } from "@/lib/books";
import { parseSend, sendRelay, toggleRelay, relayHelp, relaySentMsg, relayToggleMsg, parseNick, setAlias, nickHelp, nickSavedMsg, relayFromPhrase, parseUnnick, listAliasesText, removeAlias } from "@/lib/relay";
import { saveEntry } from "@/lib/saveEntry";
import { getOrCreateUser, getInviteCode, noteTgUsername, getVoiceTextPref, setVoiceTextPref, linkTelegramToWebUser } from "@/lib/users";
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
import { getAiSpend, setAiBalance } from "@/lib/aiSpend";
import { BAND_TO_MOOD, bandMeta, type MoodBand } from "@/lib/mood";

export const runtime = "nodejs";
// Импорт Instagram-поста (скачивание видео + расшифровка + AI + загрузка всех фото
// карусели + запись в базу) не укладывается в дефолтные 10с — иначе функцию убивает
// на последнем шаге и появляется «не смог записать в Базу знаний». Даём 60с, как
// остальным тяжёлым роутам проекта.
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickLang(code?: string): "ru" | "en" | "uk" | "fr" {
  const c = (code || "").slice(0, 2);
  return c === "uk" ? "uk" : c === "en" ? "en" : c === "fr" ? "fr" : "ru";
}

// Язык сообщений бота: ВЫБОР пользователя (users.lang) важнее языка Telegram-клиента.
// Если выбор не задан — падаем на язык приложения Telegram.
function langOf(user: any, msg: any): "ru" | "en" | "uk" | "fr" {
  const v = user?.lang;
  if (v === "ru" || v === "en" || v === "uk" || v === "fr") return v;
  return pickLang(msg?.from?.language_code);
}

// Меню выбора языка (inline-кнопки) и подтверждения.
const LANG_CHOICES: { code: string; label: string }[] = [
  { code: "ru", label: "🇷🇺 Русский" },
  { code: "en", label: "🇬🇧 English" },
  { code: "uk", label: "🇺🇦 Українська" },
  { code: "fr", label: "🇫🇷 Français" },
];
const LANG_PROMPT: Record<string, string> = {
  ru: "🌐 Выбери язык бота:",
  en: "🌐 Choose the bot language:",
  uk: "🌐 Обери мову бота:",
  fr: "🌐 Choisis la langue du bot :",
};
const LANG_DONE: Record<string, string> = {
  ru: "✅ Готово! Бот теперь говорит по-русски.",
  en: "✅ Done! The bot now speaks English.",
  uk: "✅ Готово! Бот тепер розмовляє українською.",
  fr: "✅ C'est fait ! Le bot parle maintenant français.",
};
function langKeyboard() {
  return { inline_keyboard: LANG_CHOICES.map((c) => [{ text: c.label, callback_data: `lang:${c.code}` }]) };
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

// Подпись кнопки «открыть раздел» после действия бота.
const ACT_OPEN: Record<string, string> = { ru: "↗️ Открыть", en: "↗️ Open", uk: "↗️ Відкрити", fr: "↗️ Ouvrir" };
// Подтверждение удаления записи.
const DEL_BTN: Record<string, { yes: string; no: string; done: string; kept: string; gone: string }> = {
  ru: { yes: "🗑 Да, удалить", no: "Отмена", done: "🗑 Запись удалена.", kept: "Ок, оставил запись.", gone: "Записи уже нет." },
  en: { yes: "🗑 Yes, delete", no: "Cancel", done: "🗑 Entry deleted.", kept: "Ok, kept the entry.", gone: "The entry is already gone." },
  uk: { yes: "🗑 Так, видалити", no: "Скасувати", done: "🗑 Запис видалено.", kept: "Ок, залишив запис.", gone: "Запису вже немає." },
  fr: { yes: "🗑 Oui, supprimer", no: "Annuler", done: "🗑 Entrée supprimée.", kept: "Ok, entrée conservée.", gone: "L'entrée n'existe plus." },
};

const FIXED: Record<string, string> = {
  ru: "✏️ Поправил предыдущую запись:",
  en: "✏️ Updated your previous entry:",
  uk: "✏️ Виправив попередній запис:",
  fr: "✏️ J'ai corrigé l'entrée précédente :",
};

// /voicetext — настройка «показывать распознанный текст под голосовыми».
const VOICETEXT: Record<string, { on: string; off: string; na: string }> = {
  ru: {
    on: "📝 Готово! Теперь под голосовыми буду показывать распознанный текст — так проще заметить, если что-то распозналось криво (например, суммы). Выключить: /voicetext off",
    off: "🙈 Готово! Больше не дублирую распознанный текст под голосовыми — оставлю только «Коротко» и разбор. Вернуть: /voicetext on",
    na: "⏳ Настройка пока недоступна — загляни чуть позже.",
  },
  en: {
    on: "📝 Done! I'll now show the recognized text under voice messages — easier to spot if something was misheard (e.g. amounts). Turn off: /voicetext off",
    off: "🙈 Done! I'll no longer echo the recognized text under voice messages — only the summary and breakdown. Turn back on: /voicetext on",
    na: "⏳ This setting isn't available yet — try again a bit later.",
  },
  uk: {
    on: "📝 Готово! Тепер під голосовими показуватиму розпізнаний текст — так легше помітити, якщо щось розпізналося криво (напр. суми). Вимкнути: /voicetext off",
    off: "🙈 Готово! Більше не дублюю розпізнаний текст під голосовими — залишу лише «Коротко» та розбір. Повернути: /voicetext on",
    na: "⏳ Налаштування поки недоступне — зазирни трохи пізніше.",
  },
  fr: {
    on: "📝 C'est fait ! J'afficherai le texte reconnu sous les messages vocaux — plus facile de repérer une erreur (ex. montants). Désactiver : /voicetext off",
    off: "🙈 C'est fait ! Je ne répète plus le texte reconnu sous les vocaux — seulement le résumé et le détail. Réactiver : /voicetext on",
    na: "⏳ Ce réglage n'est pas encore disponible — réessaie un peu plus tard.",
  },
};

const BOOK_PHOTO: Record<string, { working: string; saved: string; open: string; failed: string }> = {
  ru: { working: "📚 Распознаю книгу…", saved: "Добавил в библиотеку:", open: "📚 Открыть Книги", failed: "Не удалось распознать книгу на фото. Сфоткай обложку или штрих-код чётче." },
  en: { working: "📚 Recognizing the book…", saved: "Added to your library:", open: "📚 Open Books", failed: "Couldn't recognize the book. Snap the cover or barcode more clearly." },
  uk: { working: "📚 Розпізнаю книгу…", saved: "Додав у бібліотеку:", open: "📚 Відкрити Книги", failed: "Не вдалося розпізнати книгу на фото. Сфоткай обкладинку або штрих-код чіткіше." },
  fr: { working: "📚 Je reconnais le livre…", saved: "Ajouté à ta bibliothèque :", open: "📚 Ouvrir les Livres", failed: "Impossible de reconnaître le livre. Photographie la couverture ou le code-barres plus nettement." },
};

const MEM_MSG: Record<string, { recognizing: string; readingDoc: string; saved: string; open: string; failed: string; unsupported: string }> = {
  ru: { recognizing: "📸 Распознаю фото…", readingDoc: "📄 Читаю документ…", saved: "Сохранил в Визуальную память:", open: "📂 Открыть память", failed: "Не получилось разобрать фото, попробуй ещё раз.", unsupported: "Пока понимаю фото и PDF. Пришли документ как PDF или фото 🙂" },
  en: { recognizing: "📸 Reading the photo…", readingDoc: "📄 Reading the document…", saved: "Saved to Visual Memory:", open: "📂 Open memory", failed: "Couldn't read the photo, try again.", unsupported: "For now I understand photos and PDFs. Send a PDF or a photo 🙂" },
  uk: { recognizing: "📸 Розпізнаю фото…", readingDoc: "📄 Читаю документ…", saved: "Зберіг у Візуальну пам'ять:", open: "📂 Відкрити пам'ять", failed: "Не вдалося розібрати фото, спробуй ще раз.", unsupported: "Поки розумію фото та PDF. Надішли PDF або фото 🙂" },
  fr: { recognizing: "📸 Je lis la photo…", readingDoc: "📄 Je lis le document…", saved: "Enregistré dans la Mémoire visuelle :", open: "📂 Ouvrir la mémoire", failed: "Impossible de lire la photo, réessaie.", unsupported: "Pour l'instant je comprends les photos et les PDF. Envoie un PDF ou une photo 🙂" },
};

const IG_MSG: Record<string, { working: string; saved: string; open: string; video: string; noAudio: string; failed: string; limited: string; saveFail: string; notFound: string }> = {
  ru: { working: "🔖 Сохраняю в Базу знаний…", saved: "Сохранил в Базу знаний:", open: "📚 Открыть Базу знаний", video: "⬇️ Скачать видео", noAudio: "ℹ️ Звук видео достать не удалось — сохранил по подписи.", failed: "Не получилось забрать этот пост из {src}. Попробуй другую ссылку или пришли скриншот/видео.", limited: "📉 Закончился месячный лимит на разбор постов. Он обновится в начале следующего месяца — или можно поднять тариф.", saveFail: "⚠️ Разобрал пост, но не смог записать его в Базу знаний. Попробуй ещё раз чуть позже.", notFound: "🔒 Этот пост недоступен — возможно, он удалён, приватный или ссылка неверная. Открой его в Instagram и проверь, а если он приватный — пришли скриншот/видео." },
  en: { working: "🔖 Saving to your Knowledge Base…", saved: "Saved to your Knowledge Base:", open: "📚 Open Knowledge Base", video: "⬇️ Download video", noAudio: "ℹ️ Couldn't get the video audio — saved from the caption.", failed: "Couldn't fetch this {src} post. Try another link or send a screenshot/video.", limited: "📉 Monthly parsing limit reached. It resets at the start of next month — or upgrade the plan.", saveFail: "⚠️ I parsed the post but couldn't save it to your Knowledge Base. Please try again a bit later.", notFound: "🔒 This post isn't available — it may be deleted, private, or the link is wrong. Open it on Instagram to check; if it's private, send a screenshot/video." },
  uk: { working: "🔖 Зберігаю в Базу знань…", saved: "Зберіг у Базу знань:", open: "📚 Відкрити Базу знань", video: "⬇️ Завантажити відео", noAudio: "ℹ️ Звук відео дістати не вдалося — зберіг за підписом.", failed: "Не вдалося забрати цей пост з {src}. Спробуй інше посилання або надішли скріншот/відео.", limited: "📉 Закінчився місячний ліміт на розбір постів. Він оновиться на початку наступного місяця — або підвищ тариф.", saveFail: "⚠️ Розібрав пост, але не зміг записати його в Базу знань. Спробуй ще раз трохи пізніше.", notFound: "🔒 Цей пост недоступний — можливо, його видалено, він приватний або посилання хибне. Відкрий його в Instagram і перевір, а якщо він приватний — надішли скріншот/відео." },
  fr: { working: "🔖 J'enregistre dans ta Base de connaissances…", saved: "Enregistré dans ta Base de connaissances :", open: "📚 Ouvrir la Base de connaissances", video: "⬇️ Télécharger la vidéo", noAudio: "ℹ️ Impossible de récupérer l'audio — enregistré depuis la légende.", failed: "Impossible de récupérer ce post {src}. Essaie un autre lien ou envoie une capture/vidéo.", limited: "📉 Limite mensuelle d'analyse atteinte. Elle se réinitialise au début du mois prochain — ou augmente le forfait.", saveFail: "⚠️ J'ai analysé le post mais je n'ai pas pu l'enregistrer dans ta Base de connaissances. Réessaie un peu plus tard.", notFound: "🔒 Ce post n'est pas disponible — il est peut-être supprimé, privé ou le lien est incorrect. Ouvre-le sur Instagram pour vérifier ; s'il est privé, envoie une capture/vidéo." },
};

const WISH_MSG: Record<string, { working: string; saved: string; open: string; failed: string; shareHint: string }> = {
  ru: { working: "🎁 Добавляю в Вишлист…", saved: "Добавил в Вишлист:", open: "🔗 Ссылка для друзей", failed: "Не получилось забрать карточку товара. Открой Вишлист на сайте и добавь вручную.", shareHint: "Делись этой ссылкой с друзьями — они увидят список и смогут тайно «забронировать» подарок. Управлять — в приложении: Меню → Вишлист." },
  en: { working: "🎁 Adding to your Wishlist…", saved: "Added to your Wishlist:", open: "🔗 Link for friends", failed: "Couldn't fetch the product card. Open the Wishlist on the site and add it manually.", shareHint: "Share this link with friends — they'll see the list and can secretly reserve a gift. Manage it in the app: Menu → Wishlist." },
  uk: { working: "🎁 Додаю у Вішліст…", saved: "Додав у Вішліст:", open: "🔗 Посилання для друзів", failed: "Не вдалося забрати картку товару. Відкрий Вішліст на сайті й додай вручну.", shareHint: "Ділись цим посиланням з друзями — вони побачать список і зможуть таємно «забронювати» подарунок. Керувати — у застосунку: Меню → Вішліст." },
  fr: { working: "🎁 J'ajoute à ta liste de souhaits…", saved: "Ajouté à ta liste de souhaits :", open: "🔗 Lien pour tes amis", failed: "Impossible de récupérer la fiche produit. Ouvre la liste sur le site et ajoute-la manuellement.", shareHint: "Partage ce lien avec tes amis — ils verront la liste et pourront réserver un cadeau en secret. Gère-la dans l'app : Menu → Liste de souhaits." },
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

// Сообщения при связке веб-аккаунта с ботом (/start link_<token>).
const LINK_TG: Record<string, { ok: string; busy: string; expired: string }> = {
  ru: {
    ok: "✅ Готово! Твой аккаунт связан с ботом.\nТеперь просто наговаривай сюда — голосом, текстом, фото. Я всё сохраню в твой дневник.",
    busy: "⚠️ Этот Telegram уже привязан к другому аккаунту LIFE OS с записями. Войди в тот аккаунт или напиши /link, чтобы открыть его дневник.",
    expired: "⚠️ Ссылка связки устарела. Открой сайт → «Подключить Telegram» ещё раз и нажми свежую ссылку.",
  },
  en: {
    ok: "✅ Done! Your account is now linked to the bot.\nJust talk to me here — voice, text, photos. I'll save it all to your diary.",
    busy: "⚠️ This Telegram is already linked to another LIFE OS account with entries. Sign in to that one, or send /link to open its diary.",
    expired: "⚠️ This link expired. Open the site → «Connect Telegram» again and tap the fresh link.",
  },
  uk: {
    ok: "✅ Готово! Твій акаунт пов'язаний з ботом.\nПросто наговорюй сюди — голосом, текстом, фото. Я збережу все у твій щоденник.",
    busy: "⚠️ Цей Telegram уже прив'язаний до іншого акаунта LIFE OS із записами. Увійди в той акаунт або напиши /link.",
    expired: "⚠️ Посилання застаріло. Відкрий сайт → «Підключити Telegram» ще раз і натисни свіже посилання.",
  },
  fr: {
    ok: "✅ C'est fait ! Ton compte est lié au bot.\nParle-moi ici — voix, texte, photos. Je note tout dans ton journal.",
    busy: "⚠️ Ce Telegram est déjà lié à un autre compte LIFE OS avec des entrées. Connecte-toi à celui-ci ou envoie /link.",
    expired: "⚠️ Ce lien a expiré. Ouvre le site → « Connecter Telegram » puis clique le nouveau lien.",
  },
};

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

  // Нажатие inline-кнопки (выбор языка).
  const cq = update?.callback_query;
  if (cq) {
    const data: string = cq.data || "";
    const cqChat: number | undefined = cq.message?.chat?.id;
    if (data.startsWith("mood:") && cqChat) {
      // mood:<YYYY-MM-DD>:<band 1-5> — one-tap evening mood check.
      const [, day, bandStr] = data.split(":");
      const band = Number(bandStr) as MoodBand;
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && band >= 1 && band <= 5) {
        try {
          const db = supabaseAdmin();
          const { data: u } = await db.from("users").select("id").eq("chat_id", cqChat).maybeSingle();
          if (u) {
            await db.from("day_moods").upsert({ user_id: (u as any).id, day, mood: BAND_TO_MOOD[band], source: "bot", updated_at: new Date().toISOString() }, { onConflict: "user_id,day" });
          }
          await answerCallback(cq.id, `Записал: ${bandMeta(band).label}`);
        } catch { await answerCallback(cq.id); }
      } else {
        await answerCallback(cq.id);
      }
    } else if (data.startsWith("lang:") && cqChat) {
      const lng = data.slice(5);
      if (["ru", "en", "uk", "fr"].includes(lng)) {
        try { await supabaseAdmin().from("users").update({ lang: lng }).eq("chat_id", cqChat); } catch {}
        await answerCallback(cq.id, LANG_DONE[lng]);
        await sendMessage(cqChat, LANG_DONE[lng], { reply_markup: mainKeyboard(lng) });
      } else {
        await answerCallback(cq.id);
      }
    } else if ((data.startsWith("delok:") || data === "delno") && cqChat) {
      // Подтверждение/отмена удаления последней записи.
      const mid = cq.message?.message_id;
      try {
        const db = supabaseAdmin();
        const { data: u } = await db.from("users").select("id, lang").eq("chat_id", cqChat).maybeSingle();
        const dl = DEL_BTN[pickLang((u as any)?.lang)] || DEL_BTN.ru;
        if (data === "delno") {
          await answerCallback(cq.id, dl.kept);
          if (mid) await editMessageText(cqChat, mid, dl.kept);
        } else {
          const entryId = data.slice(6);
          let msgText = dl.gone;
          if (u && /^[0-9a-f-]{16,}$/i.test(entryId)) {
            const { data: ent } = await db.from("entries").select("id").eq("id", entryId).eq("user_id", (u as any).id).maybeSingle();
            if (ent) {
              await db.from("entries").delete().eq("id", entryId).eq("user_id", (u as any).id); // FK cascade убирает задачи/инсайты
              msgText = dl.done;
            }
          }
          await answerCallback(cq.id, msgText);
          if (mid) await editMessageText(cqChat, mid, msgText);
        }
      } catch { await answerCallback(cq.id); }
    } else {
      await answerCallback(cq.id);
    }
    return NextResponse.json({ ok: true });
  }

  const msg = update?.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId: number = msg.chat.id;
  const origin = req.nextUrl.origin;

  // Связка веб-аккаунта с ботом: /start link_<token>. Обрабатываем ДО getOrCreateUser,
  // чтобы не плодить лишний телеграм-аккаунт.
  if (typeof msg.text === "string" && msg.text.startsWith("/start ")) {
    const p = msg.text.slice(7).trim();
    if (p.startsWith("link_")) {
      const lang = pickLang(msg.from?.language_code);
      const res = await linkTelegramToWebUser(chatId, p.slice(5), msg.from);
      if (res.ok) {
        await noteTgUsername(res.user.id, msg.from?.username);
        const link = `${origin}/u/${res.user.token}`;
        await sendMessage(chatId, LINK_TG[lang].ok, openBtn(lang, link));
      } else {
        const reason = (res as { reason?: string }).reason;
        await sendMessage(chatId, reason === "tg_busy" ? LINK_TG[lang].busy : LINK_TG[lang].expired);
      }
      return NextResponse.json({ ok: true });
    }
  }

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
  // Сохраняем настоящий Telegram-@username — чтобы по нему можно было писать (/send @username).
  await noteTgUsername(user.id, msg.from?.username);

  const link = `${origin}/u/${user.token}`;

  // Пользователь что-то прислал → засчитываем отклик на недавние пуши (аналитика).
  markPushResponded(user.id).catch(() => {});

  if (msg.text === "/start" || (typeof msg.text === "string" && msg.text.startsWith("/start "))) {
    const lang = langOf(user, msg);
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
    const lang = langOf(user, msg);
    const seq = WELCOME[lang] || WELCOME.ru;
    for (let i = 0; i < seq.length; i++) {
      await sendChatAction(chatId, "typing");
      await sleep(i === 0 ? 400 : 1300);
      await sendMessage(chatId, seq[i].replace("{link}", link), i === 0 ? { reply_markup: mainKeyboard(lang) } : i === seq.length - 1 ? openBtn(lang, link) : undefined);
    }
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/invite") {
    await sendInvite(chatId, langOf(user, msg), origin, user.id);
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/link") {
    const lang = langOf(user, msg);
    await sendMessage(chatId, `${DIARY_LABEL[lang] || DIARY_LABEL.ru}\n${link}`, openBtn(lang, link));
    return NextResponse.json({ ok: true });
  }

  if (typeof msg.text === "string" && /^\/lang(uage)?\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    await sendMessage(chatId, LANG_PROMPT[lang] || LANG_PROMPT.ru, { reply_markup: langKeyboard() });
    return NextResponse.json({ ok: true });
  }

  if (msg.text === "/resetpin") {
    try { await supabaseAdmin().from("users").update({ pin_hash: null }).eq("id", user.id); } catch {}
    await sendMessage(chatId, "🔓 PIN сброшен. Теперь можно войти в веб без кода — и при желании задать новый в разделе «Профиль».");
    return NextResponse.json({ ok: true });
  }

  // 📝 /voicetext [on|off] — показывать ли распознанный текст под голосовыми.
  if (typeof msg.text === "string" && /^\/voicetext\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    const arg = msg.text.trim().replace(/^\/voicetext\s*/i, "").toLowerCase();
    const desired = arg === "on" ? true : arg === "off" ? false : !(await getVoiceTextPref(user.id));
    const res = await setVoiceTextPref(user.id, desired);
    const V = VOICETEXT[lang] || VOICETEXT.ru;
    await sendMessage(chatId, res === null ? V.na : desired ? V.on : V.off);
    return NextResponse.json({ ok: true });
  }

  // 💰 /balance [сумма] — владелец записывает текущий баланс Anthropic (контроль расходов).
  //     Полностью серверная команда — работает независимо от веб-страницы.
  if (typeof msg.text === "string" && /^\/balance\b/i.test(msg.text.trim())) {
    if (user.id !== "00000000-0000-0000-0000-000000000000") {
      await sendMessage(chatId, "Эта команда только для владельца.");
      return NextResponse.json({ ok: true });
    }
    const arg = msg.text.trim().replace(/^\/balance\s*/i, "").replace(",", ".").replace(/[^0-9.]/g, "");
    if (!arg) {
      const s = await getAiSpend();
      await sendMessage(chatId, s.hasSnapshot
        ? `💰 Остаток Claude ≈ $${(s.balanceUsd ?? 0).toFixed(2)}\nПотрачено с пополнения $${s.spentSinceUsd.toFixed(2)} · за месяц $${s.spentMonthUsd.toFixed(2)}\n\nЗаписать новый баланс: /balance 100`
        : "Баланс ещё не задан. Впиши текущий баланс из Console: /balance 100");
      return NextResponse.json({ ok: true });
    }
    const bal = Number(arg);
    if (!isFinite(bal) || bal < 0) { await sendMessage(chatId, "Формат: /balance 100"); return NextResponse.json({ ok: true }); }
    const r = await setAiBalance(bal);
    if (!r.ok) { await sendMessage(chatId, `❌ Не сохранилось: ${r.error || "ошибка"}`); return NextResponse.json({ ok: true }); }
    const s = await getAiSpend();
    await sendMessage(chatId, `✅ Баланс записан: $${bal.toFixed(2)}. Остаток ≈ $${(s.balanceUsd ?? bal).toFixed(2)} — дальше тикает вниз по расходу Claude. Смотри в /admin.`);
    return NextResponse.json({ ok: true });
  }

  // 📨 /send @имя текст — передать сообщение другому пользователю LIFE OS (с подписью «от кого»).
  if (typeof msg.text === "string" && /^\/send\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    const parsed = parseSend(msg.text.trim());
    if (!parsed) { await sendMessage(chatId, relayHelp(lang)); return NextResponse.json({ ok: true }); }
    const r = await sendRelay({ id: user.id, name: user.name ?? null }, parsed.handle, parsed.message, lang);
    await sendMessage(chatId, r.ok ? relaySentMsg(lang, r.toName!) : r.error!);
    return NextResponse.json({ ok: true });
  }

  // 🔔/🔕 /relay — включить или выключить приём сообщений от других пользователей.
  if (msg.text === "/relay") {
    const lang = langOf(user, msg);
    const nowOff = await toggleRelay(user.id);
    await sendMessage(chatId, relayToggleMsg(lang, nowOff));
    return NextResponse.json({ ok: true });
  }

  // 🏷 /nick @имя прозвище — задать своё имя для контакта (потом /send Прозвище текст).
  if (typeof msg.text === "string" && /^\/nick\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    const parsed = parseNick(msg.text.trim());
    if (!parsed) { await sendMessage(chatId, nickHelp(lang)); return NextResponse.json({ ok: true }); }
    const r = await setAlias(user.id, parsed.recipient, parsed.alias, lang);
    await sendMessage(chatId, r.ok ? nickSavedMsg(lang, parsed.alias, r.toName!) : r.error!);
    return NextResponse.json({ ok: true });
  }

  // 🏷 /nicks — список своих прозвищ; /unnick <прозвище> — удалить.
  if (msg.text === "/nicks") {
    await sendMessage(chatId, await listAliasesText(user.id, langOf(user, msg)));
    return NextResponse.json({ ok: true });
  }
  if (typeof msg.text === "string" && /^\/unnick\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    const p = parseUnnick(msg.text.trim());
    if (!p) { await sendMessage(chatId, "Удалить прозвище: <code>/unnick Прозвище</code>"); return NextResponse.json({ ok: true }); }
    await sendMessage(chatId, await removeAlias(user.id, p.alias, lang));
    return NextResponse.json({ ok: true });
  }

  // 💬 Режим беседы с AI-другом: /chat включает, /stop выключает, /newchat — с чистого листа.
  if (typeof msg.text === "string" && /^\/chat\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    await setChatMode(user.id, true);
    const greet =
      lang === "en"
        ? "💬 Chat mode is on. I'm your friend who knows your whole story — let's just talk: ask, share, think out loud. I can also look things up online.\n\nWrite /stop to leave, /newchat to start fresh."
        : "💬 Режим беседы включён. Я — твой друг, который знает всю твою историю. Давай просто поговорим: спрашивай, делись, рассуждай вслух. Если надо — загляну и в интернет за свежим.\n\nЧтобы выйти — /stop, начать заново — /newchat.";
    await sendMessage(chatId, greet);
    return NextResponse.json({ ok: true });
  }

  if (typeof msg.text === "string" && /^\/stop\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
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
    const lang = langOf(user, msg);
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
    const lang = langOf(user, msg);
    const text = (await personalMorning(user.id, user.name ?? null, lang)) || morningMessage(lang, Math.floor(Date.now() / 86400000));
    await sendMessage(chatId, text, { reply_markup: mainKeyboard(lang) });
    // Сохраняем в историю — чтобы на «а что за…» ассистент связал с этим сообщением.
    saveChat(user.id, "☀️ (моё утреннее сообщение пользователю)", text).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // Помощь: команда /help|/guide (помощь живёт в меню команд бота).
  if (typeof msg.text === "string" && /^\/(help|guide|помощь|допомога|aide)\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
    await sendMessage(chatId, (HELP[lang] || HELP.ru)(origin));
    return NextResponse.json({ ok: true });
  }

  // Финансовый разбор: команда /money|/finance|/деньги|/финансы.
  if (typeof msg.text === "string" && /^\/(money|finance|деньги|финансы)\b/i.test(msg.text.trim())) {
    const lang = langOf(user, msg);
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
    const lang = langOf(user, msg);
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
    const lang = langOf(user, msg);
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
      const ans = await askLife(user.id, q, langOf(user, msg));
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
      const lang = langOf(user, msg);
      const L = MEM_MSG[lang] || MEM_MSG.ru;
      // 📚 Фото с подписью «книга/book» → в библиотеку (обложку или штрих-код читает AI).
      const bookMode = /книг|book|прочит|читаю|читаю/i.test(msg.caption || "");
      if (bookMode) {
        const B = BOOK_PHOTO[lang] || BOOK_PHOTO.ru;
        await sendMessage(chatId, B.working);
        try {
          const ph = msg.photo[msg.photo.length - 1];
          const fileUrl = await getFileUrl(ph.file_id);
          const buf = Buffer.from(await (await fetch(fileUrl)).arrayBuffer());
          const book = await addBookFromImage(user.id, buf.toString("base64"), "image/jpeg");
          if (!book) { await sendMessage(chatId, B.failed); return NextResponse.json({ ok: true }); }
          let body = `📚 <b>${B.saved}</b>\n\n<b>${esc(book.title)}</b>`;
          if (book.author) body += `\n${esc(book.author)}`;
          await sendMessage(chatId, body, { reply_markup: { inline_keyboard: [[{ text: B.open, url: `${origin}/u/${user.token}?next=/books` }]] } });
        } catch (e) {
          console.error("book photo", e);
          await sendMessage(chatId, B.failed);
        }
        return NextResponse.json({ ok: true });
      }
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
      const lang = langOf(user, msg);
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

    // 🛠 /igdebug <ссылка> — ТОЛЬКО владелец: показать сырой ответ RapidAPI по посту
    // (структуру и результат разбора карусели), чтобы диагностировать «пришло 1 фото».
    if (/^\/igdebug\b/i.test(text.trim())) {
      if (!process.env.TELEGRAM_ALLOWED_CHAT_ID || String(chatId) !== process.env.TELEGRAM_ALLOWED_CHAT_ID) {
        return NextResponse.json({ ok: true }); // не владелец — тихо игнорируем
      }
      const dbgUrl = extractInstagramUrl(text);
      if (!dbgUrl) {
        await sendMessage(chatId, "Использование: /igdebug &lt;ссылка на пост Instagram&gt;");
        return NextResponse.json({ ok: true });
      }
      await sendChatAction(chatId, "typing");
      try {
        const report = await igDebug(dbgUrl);
        await sendMessage(chatId, `<pre>${esc(report.slice(0, 3800))}</pre>`);
      } catch (e) {
        await sendMessage(chatId, "igdebug error: " + esc(String(e).slice(0, 300)));
      }
      return NextResponse.json({ ok: true });
    }

    // 🔖 Ссылка Instagram / YouTube → сохраняем в личную Базу знаний (НЕ в дневник).
    // ВАЖНО: ловим ДО режима беседы — иначе в /chat ссылка уходит компаньону
    // («Instagram мне недоступен…») вместо импорта. Как и фото, ссылки в обход чата.
    const igUrl = extractInstagramUrl(text);
    const yt = extractYoutubeUrl(text);
    const ttUrl = extractTiktokUrl(text);
    if (igUrl || yt || ttUrl) {
      const lang = langOf(user, msg);
      const L = IG_MSG[lang] || IG_MSG.ru;
      const srcName = igUrl ? "Instagram" : ttUrl ? "TikTok" : "YouTube";
      const failedMsg = L.failed.replace("{src}", srcName);
      await sendMessage(chatId, L.working);
      try {
        const r = igUrl
          ? await importInstagram(user.id, igUrl, lang)
          : ttUrl
            ? await importTiktok(user.id, ttUrl, lang)
            : await importYoutube(user.id, yt!.url, yt!.kind, lang);
        if (r.ok === false) {
          const reasonMsg = r.reason === "limited" ? L.limited : (r.reason as string) === "notfound" ? L.notFound : failedMsg;
          await sendMessage(chatId, reasonMsg);
          return NextResponse.json({ ok: true });
        }
        // Разбор удался, но запись в базу упала — честно предупреждаем, а не врём «сохранил».
        if (!r.saved) {
          await sendMessage(chatId, L.saveFail);
          // Владельцу дополнительно показываем реальную ошибку БД — для диагностики.
          const se = (r as any).saveError;
          if (se && process.env.TELEGRAM_ALLOWED_CHAT_ID && String(chatId) === process.env.TELEGRAM_ALLOWED_CHAT_ID) {
            await sendMessage(chatId, `🛠 DB: <code>${esc(String(se).slice(0, 500))}</code>`);
          }
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
        // Сами фото/видео тоже отправляем в чат — как «Save As Bot»: карусель одним
        // альбомом, ролик — видеофайлом. Для reel обложку отдельно не шлём (видео уже есть).
        const imgs: string[] = ((r as any).imageUrls || []).filter(Boolean);
        if (imgs.length && r.kind !== "reel") {
          // sendMediaGroup сам режет на альбомы по 10 (лимит Telegram) — так уходит вся карусель.
          const ok = await sendMediaGroup(chatId, imgs.slice(0, 20).map((u) => ({ type: "photo", media: u })));
          if (!ok) await sendMessage(chatId, imgs.map((u, i) => `🖼 <a href="${u}">${i + 1}</a>`).join("  "));
        }
        // Само видео тоже отправляем в чат. Если файл слишком крупный для отправки по ссылке
        // (лимит Telegram ~20 МБ) — даём кнопку со ссылкой на файл в хранилище.
        if (r.videoUrl) {
          const sent = await sendVideo(chatId, r.videoUrl, { caption: (a.title || "").slice(0, 200) });
          if (!sent) await sendMessage(chatId, `🎬 <a href="${r.videoUrl}">${L.video}</a>`);
        }
      } catch (e) {
        console.error("import link", e);
        await sendMessage(chatId, failedMsg);
      }
      return NextResponse.json({ ok: true });
    }

    // 🎁 Ссылка на товар → в Вишлист (НЕ в дневник). Ловим либо команду /wish <ссылка>,
    //    либо «голую» ссылку из известного магазина. Обычные ссылки (статьи) не трогаем.
    const wishCmd = /^\/wish\b/i.test(text);
    const wishUrl = wishCmd ? extractAnyUrl(text) : extractShopUrl(text);
    if (wishUrl) {
      const lang = langOf(user, msg);
      const W = WISH_MSG[lang] || WISH_MSG.ru;
      await sendMessage(chatId, W.working);
      try {
        const wish = await addWishFromUrl(user.id, wishUrl);
        if (!wish) {
          await sendMessage(chatId, W.failed);
          return NextResponse.json({ ok: true });
        }
        let body = `🎁 <b>${W.saved}</b>\n\n<b>${esc(wish.title)}</b>`;
        const price = formatPrice(wish.price, wish.currency);
        if (price) body += `\n💰 ${esc(price)}`;
        if (wish.source) body += `\n🛒 ${esc(wish.source)}`;
        // ПУБЛИЧНАЯ ссылка для друзей (/w/<slug>), а НЕ личная логин-ссылка /u/<token>!
        // Включаем публичность вишлиста, чтобы пересланная ссылка открывала список, а не аккаунт.
        let wishBtnUrl = "";
        try {
          const { slug } = await setWishPublic(user.id, user.name, true);
          if (slug) wishBtnUrl = `${origin}/w/${slug}`;
        } catch {}
        if (wishBtnUrl) body += `\n\n${esc(W.shareHint)}`;
        const wishBtn = wishBtnUrl
          ? [{ text: W.open, url: wishBtnUrl }]
          : [{ text: "🎁 Открыть Вишлист", url: `${origin}/u/${user.token}?next=/wishlist` }];
        await sendMessage(chatId, body, { reply_markup: { inline_keyboard: [wishBtn] } });
      } catch (e) {
        console.error("wishlist", e);
        await sendMessage(chatId, W.failed);
      }
      return NextResponse.json({ ok: true });
    }

    // 📨 Естественная фраза «передай <кому> …» (в т.ч. голосом) → доставить сообщение.
    //    Если получатель не распознан — не перехватываем, идём дальше (обычная запись).
    {
      const rp = await relayFromPhrase({ id: user.id, name: user.name ?? null }, text, langOf(user, msg));
      if (rp.handled) { await sendMessage(chatId, rp.reply!); return NextResponse.json({ ok: true }); }
    }

    // 💬 Режим беседы: пока он включён, текст/голос идут к AI-другу (с памятью
    //    диалога и веб-поиском), а НЕ в дневник. Выход — командой /stop (поймана выше).
    if (await getChatMode(user.id)) {
      await sendChatAction(chatId, "typing");
      try {
        const reply = await talkToCompanion(user.id, user.name ?? null, text, langOf(user, msg), (user as any).tz_offset);
        await sendMessage(chatId, mdToTelegram(reply) || "…");
        // Джарвис отвечает голосом, если к нему обратились голосом.
        if (isVoice && reply) {
          await sendChatAction(chatId, "record_voice");
          const audio = await speak(mdToPlain(reply));
          if (audio) await sendVoice(chatId, audio);
        }
      } catch (e) {
        console.error("companion", e);
        await sendMessage(chatId, "Что-то сбилось, скажи ещё раз 🙂");
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
        const lang = langOf(user, msg);
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

    // По смыслу: ДЕЙСТВИЕ (бот выполняет вместо пользователя), вопрос к ассистенту или запись?
    // (длинные голосовые > 160 символов всегда считаем записью, чтобы не потерять мысль)
    if (!forceSave && (!isVoice || text.length < 160)) {
      const route = await routeMessage(text, user.id, (user as any).tz_offset);
      if (route.kind === "action") {
        const lang = langOf(user, msg);
        const res = await runAction(user.id, route.name, route.input, lang, (user as any).tz_offset);
        let extra: any = res.openNext
          ? { reply_markup: { inline_keyboard: [[{ text: ACT_OPEN[lang] || ACT_OPEN.ru, url: `${origin}/u/${user.token}?next=${encodeURIComponent(res.openNext)}` }]] } }
          : undefined;
        // Удаление записи — с подтверждением (кнопки Да/Отмена), чтобы не потерять данные случайно.
        if (res.confirmDelete) {
          const D = DEL_BTN[lang] || DEL_BTN.ru;
          extra = { reply_markup: { inline_keyboard: [[
            { text: D.yes, callback_data: `delok:${res.confirmDelete.entryId}` },
            { text: D.no, callback_data: "delno" },
          ]] } };
        }
        await sendMessage(chatId, res.text, extra);
        return NextResponse.json({ ok: true });
      }
      if (route.kind === "question") {
        await sendChatAction(chatId, "typing");
        const ans = await askLife(user.id, text, langOf(user, msg));
        await saveChat(user.id, text, ans);
        await sendMessage(chatId, mdToTelegram(ans) || "—");
        return NextResponse.json({ ok: true });
      }
    }

    // Разбор AI. Если он упал (перегрузка/таймаут Anthropic) — НЕ теряем запись:
    // сохраняем сырой текст с минимальным разбором, чтобы мысль пользователя не пропала.
    let analysis: Analysis;
    try {
      analysis = await analyze(text, user.id);
    } catch (e) {
      console.error("analyze failed — saving raw", e);
      analysis = {
        summary: text.slice(0, 800),
        categories: [], tags: [], people: [], places: [], projects: [],
        tasks: [], insights: [], gratitude: [], good_deeds: [], promises: [], dreams: [],
      };
    }
    const entry = await saveEntry({
      userId: user.id,
      raw_text: text,
      source: isVoice ? "telegram_voice" : "telegram_text",
      analysis,
    });
    const lang = langOf(user, msg);
    const streak = await getStreak(user.id);
    const count = await getEntryCount(user.id);
    const L = CONFIRM[lang] || CONFIRM.ru;
    const financeOk = !analysis.finance?.length || ((entry as any).financeSaved ?? 0) > 0;
    if (analysis.finance?.length && !financeOk) console.error("finance not saved", (entry as any).financeError);
    const showVT = isVoice ? await getVoiceTextPref(user.id) : true;
    let body = formatConfirm(analysis, streak, lang, financeOk, isVoice ? text : undefined, showVT);
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

function formatConfirm(a: Analysis, streak: number, lang: string, financeSaved = true, fullText?: string, showVoiceText = true): string {
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
  if (isVoice && showVoiceText) {
    const ft = fullText!.trim();
    const used = head.join("\n").length + rest.join("\n").length + 80; // запас на разметку/заголовок
    const budget = Math.max(400, 4000 - used);
    const shown = ft.length > budget ? ft.slice(0, budget).trimEnd() + "…" : ft;
    head.push("", `📝 <b>${L.heard}:</b>`, esc(shown));
  }
  return [...head, ...rest].join("\n");
}
