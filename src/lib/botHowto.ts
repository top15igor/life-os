// ============================================================
//  Меню «🧭 Зачем я тебе» — интерактивная «инструкция по применению».
//  Продаёт идею (CRM жизни → Книга жизни → путь к маленькому бессмертию)
//  и показывает главные способы применения: у каждого раздела — короткая
//  польза + готовые к отправке фразы. Плюс «🎲 Лайфхак» (случайный совет).
//  Рендер чистый (без БД); данные локализованы (ru+en, uk→ru, fr/es→en).
// ============================================================

export type HowtoItem = { key: string; label: string; body: string };
export type HowtoDoc = {
  intro: string;
  items: HowtoItem[];
  tipBtn: string;
  tipMore: string;
  back: string;
  fullGuide: string;
  tips: string[];
};

const RU: HowtoDoc = {
  intro:
    "🧭 <b>Зачем я тебе</b>\n\n" +
    "Я — CRM твоей жизни. Ты просто живёшь и рассказываешь мне о днях, а я запоминаю: людей, моменты, мысли, победы — раскладываю по полочкам и собираю в твою <b>Книгу жизни</b>. То, что обычно стирает время, у тебя останется навсегда.\n\n" +
    "Это твой путь к маленькому бессмертию — по одной записи в день. Выбери раздел — покажу, как это работает 👇",
  items: [
    { key: "book", label: "📖 Книга жизни", body:
      "📖 <b>Книга жизни</b>\n\n" +
      "Каждая твоя запись — страница твоей книги. Я сам собираю её по главам: люди, события, год за годом. Её можно оформить и подарить близким или оставить детям.\n\n" +
      "<b>Как наполнять:</b> просто веди дневник. Чем больше моментов — тем живее книга.\n" +
      "Открыть — кнопка «📖 Моя Книга жизни» под любой записью." },
    { key: "diary", label: "🎙 Живой дневник", body:
      "🎙 <b>Живой дневник — голосом и текстом</b>\n\n" +
      "Расскажи про день — я расшифрую голос, выделю настроение, людей, задачи и идеи, отвечу тёплым резюме.\n\n" +
      "<b>Попробуй прямо сейчас</b> — надиктуй или напиши:\n" +
      "• Сегодня встретился с Колей, поработал в машине, лёг поздно\n" +
      "• Пробежал 5 км, чувствую себя отлично\n\n" +
      "Ошибся? Скажи «исправь…» — поправлю последнюю запись, без дубля." },
    { key: "friend", label: "🤖 AI-друг", body:
      "🤖 <b>AI-друг, который тебя знает</b>\n\n" +
      "Включи беседу командой /chat — друг помнит всё из твоего дневника, ищет свежее в сети и умеет действовать: поставить напоминание, добавить задачу, записать вес.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• /chat\n" +
      "• поставь напоминание завтра в 10 позвонить маме\n\n" +
      "Выйти из беседы — /stop." },
    { key: "ask", label: "❓ Спроси свою жизнь", body:
      "❓ <b>Спроси свою жизнь</b>\n\n" +
      "Задай вопрос по своему дневнику — найду ответ даже в старых записях.\n\n" +
      "<b>Попробуй — скопируй и отправь:</b>\n" +
      "• /ask когда я был по-настоящему счастлив?\n" +
      "• /ask что я говорил про Вовчика?\n" +
      "• /ask сколько потратил на кафе в этом месяце?" },
    { key: "portrait", label: "🧠 Я тебя изучаю", body:
      "🧠 <b>Я тебя изучаю</b>\n\n" +
      "Со временем я понимаю тебя всё лучше: кто твои близкие, чем живёшь, твои привычки и спады. Иногда сам подмечу закономерность и подскажу (сообщения со значком ✨).\n\n" +
      "<b>Попробуй:</b>\n" +
      "• что ты обо мне знаешь?\n\n" +
      "Соберу твой портрет из того, что уже понял." },
    { key: "crm", label: "🗂 Жизнь под контролем", body:
      "🗂 <b>CRM твоей жизни</b>\n\n" +
      "Я держу под рукой то, что важно: задачи, цели, обещания, напоминания и финансы. Ничего не теряется.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• напомни завтра в 9 оплатить аренду\n" +
      "• добавь цель пробежать марафон\n" +
      "• /spend 250 eur кафе" },
    { key: "people", label: "👨‍👩‍👧 Для близких", body:
      "👨‍👩‍👧 <b>Для близких</b>\n\n" +
      "LIFE OS — не только про тебя. Подари Книгу жизни маме или партнёру, передавай сообщения близким прямо через меня.\n\n" +
      "<b>Попробуй:</b>\n" +
      "• передай Коле, что опоздаю на час\n" +
      "• /invite — позвать близкого" },
    { key: "immortal", label: "♾ Путь к бессмертию", body:
      "♾ <b>Путь к бессмертию</b>\n\n" +
      "Память стирается — я нет. Всё, что ты проживаешь, остаётся: твои мысли, твоя история, твой голос. Однажды это станет цифровым продолжением тебя — тем, что смогут прочитать и почувствовать те, кто будет после.\n\n" +
      "Секрет один: <b>пиши</b>. Каждый день — ещё одна страница, которая не исчезнет." },
  ],
  tipBtn: "🎲 Случайный лайфхак",
  tipMore: "🎲 Ещё лайфхак",
  back: "← Назад",
  fullGuide: "📚 Полная инструкция",
  tips: [
    "Скажи «исправь…» или «на самом деле…» — поправлю последнюю запись, без дубля.",
    "Пришли фото чека или документа — распознаю и сохраню в «Память». Потом спроси «найди техпаспорт».",
    "Длинное голосовое? Говори сколько нужно — сохраню целиком, мысль не потеряется.",
    "Скажи «передай Ане, что опоздаю» — доставлю сообщение прямо ей.",
    "Фото обложки книги с подписью «книга» — добавлю её в твой читательский дневник.",
    "Спроси /money — разберу твои траты и дам пару советов.",
    "Напоминания понимают повтор: «напоминай каждый понедельник в 8 планировать неделю».",
    "Упомяни цену в записи — «потратил 500 на продукты» — и я сам заведу расход.",
  ],
};

const EN: HowtoDoc = {
  intro:
    "🧭 <b>Why I'm here</b>\n\n" +
    "I'm the CRM of your life. You just live and tell me about your days, and I remember: people, moments, thoughts, wins — sort them out and gather them into your <b>Book of Life</b>. What time usually erases, you get to keep forever.\n\n" +
    "It's your path to a little immortality — one entry a day. Pick a section — I'll show you how it works 👇",
  items: [
    { key: "book", label: "📖 Book of Life", body:
      "📖 <b>Book of Life</b>\n\n" +
      "Every entry is a page of your book. I assemble it into chapters: people, events, year by year. You can design it and gift it to loved ones or leave it for your kids.\n\n" +
      "<b>How to fill it:</b> just keep a diary. The more moments — the richer the book.\n" +
      "Open it — the “📖 My Book of Life” button under any entry." },
    { key: "diary", label: "🎙 Living diary", body:
      "🎙 <b>Living diary — voice & text</b>\n\n" +
      "Tell me about your day — I'll transcribe the voice, capture mood, people, tasks and ideas, and reply with a warm recap.\n\n" +
      "<b>Try it now</b> — speak or type:\n" +
      "• Met Kolya today, worked from the car, went to bed late\n" +
      "• Ran 5 km, feeling great\n\n" +
      "Got it wrong? Say “correct…” — I'll fix the last entry, no duplicate." },
    { key: "friend", label: "🤖 AI friend", body:
      "🤖 <b>An AI friend who knows you</b>\n\n" +
      "Start a chat with /chat — the friend remembers everything from your diary, checks the web for fresh facts, and can act: set a reminder, add a task, log your weight.\n\n" +
      "<b>Try:</b>\n" +
      "• /chat\n" +
      "• set a reminder tomorrow at 10 to call mom\n\n" +
      "Leave the chat — /stop." },
    { key: "ask", label: "❓ Ask your life", body:
      "❓ <b>Ask your life</b>\n\n" +
      "Ask a question about your own diary — I'll find the answer even in old entries.\n\n" +
      "<b>Try — copy and send:</b>\n" +
      "• /ask when was I truly happy?\n" +
      "• /ask what did I say about my son?\n" +
      "• /ask how much did I spend on cafes this month?" },
    { key: "portrait", label: "🧠 I study you", body:
      "🧠 <b>I study you</b>\n\n" +
      "Over time I understand you better: who your close ones are, what you live for, your habits and dips. Sometimes I'll spot a pattern and nudge you (messages marked ✨).\n\n" +
      "<b>Try:</b>\n" +
      "• what do you know about me?\n\n" +
      "I'll put together your portrait from what I've gathered." },
    { key: "crm", label: "🗂 Life under control", body:
      "🗂 <b>The CRM of your life</b>\n\n" +
      "I keep what matters at hand: tasks, goals, promises, reminders and finances. Nothing slips through.\n\n" +
      "<b>Try:</b>\n" +
      "• remind me tomorrow at 9 to pay rent\n" +
      "• add a goal to run a marathon\n" +
      "• /spend 250 eur cafe" },
    { key: "people", label: "👨‍👩‍👧 For loved ones", body:
      "👨‍👩‍👧 <b>For loved ones</b>\n\n" +
      "LIFE OS isn't only about you. Gift a Book of Life to your mom or partner, relay messages to close ones right through me.\n\n" +
      "<b>Try:</b>\n" +
      "• tell Kolya I'll be an hour late\n" +
      "• /invite — bring someone close in" },
    { key: "immortal", label: "♾ Path to immortality", body:
      "♾ <b>Path to immortality</b>\n\n" +
      "Memory fades — I don't. Everything you live through stays: your thoughts, your story, your voice. One day it becomes a digital continuation of you — something those who come after can read and feel.\n\n" +
      "There's one secret: <b>write</b>. Every day is one more page that won't disappear." },
  ],
  tipBtn: "🎲 Random tip",
  tipMore: "🎲 Another tip",
  back: "← Back",
  fullGuide: "📚 Full guide",
  tips: [
    "Say “correct…” or “actually…” — I'll fix the last entry, no duplicate.",
    "Send a photo of a receipt or document — I'll read it and save it to “Memory”. Later ask “find the car registration”.",
    "Long voice note? Talk as long as you need — I'll save it in full, nothing lost.",
    "Say “tell Anna I'll be late” — I'll deliver the message to her.",
    "A photo of a book cover captioned “book” — I'll add it to your reading log.",
    "Ask /money — I'll break down your spending and give a couple of tips.",
    "Reminders understand repeats: “remind me every Monday at 8 to plan the week”.",
    "Mention an amount in an entry — “spent 500 on groceries” — and I'll log the expense myself.",
  ],
};

export function howtoDoc(lang: string): HowtoDoc {
  if (lang === "ru" || lang === "uk") return RU;
  return EN; // en / fr / es
}

type Rendered = { text: string; reply_markup: any };

// Главное меню «Зачем я тебе»: интро + разделы (2 в ряд) + лайфхак + полная инструкция.
export function howtoMenu(lang: string, origin: string, token: string): Rendered {
  const d = howtoDoc(lang);
  const rows: any[] = [];
  for (let i = 0; i < d.items.length; i += 2) {
    rows.push(d.items.slice(i, i + 2).map((it) => ({ text: it.label, callback_data: `howto:i:${it.key}` })));
  }
  rows.push([{ text: d.tipBtn, callback_data: "howto:tip" }]);
  rows.push([{ text: d.fullGuide, url: `${origin}/u/${token}?next=${encodeURIComponent("/guide/bot")}` }]);
  return { text: d.intro, reply_markup: { inline_keyboard: rows } };
}

// Экран одного раздела: польза + готовые фразы + «← Назад».
export function howtoItem(lang: string, key: string): Rendered | null {
  const d = howtoDoc(lang);
  const it = d.items.find((x) => x.key === key);
  if (!it) return null;
  return { text: it.body, reply_markup: { inline_keyboard: [[{ text: d.back, callback_data: "howto:menu" }]] } };
}

// Случайный лайфхак (Node runtime — Math.random доступен).
export function howtoTip(lang: string): Rendered {
  const d = howtoDoc(lang);
  const tip = d.tips[Math.floor(Math.random() * d.tips.length)];
  return { text: `💡 ${tip}`, reply_markup: { inline_keyboard: [[{ text: d.tipMore, callback_data: "howto:tip" }, { text: d.back, callback_data: "howto:menu" }]] } };
}
