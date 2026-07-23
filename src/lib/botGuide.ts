// Подробная инструкция по Telegram-боту LIFE OS (отдельная страница /guide/bot).
// Самодостаточный контент, чтобы не конфликтовать с guideExtras.

export type BotSection = { icon: string; title: string; lines: string[] };
export type BotDoc = {
  title: string;
  intro: string;
  openBot: string;
  back: string;
  sections: BotSection[];
  cmdTitle: string;
  cmds: [string, string][];
};

const RU: BotDoc = {
  title: "Инструкция по Telegram-боту",
  intro:
    "Бот — это главный вход в LIFE OS. Через него ты ведёшь дневник голосом и текстом, общаешься с AI-другом, ставишь напоминания, ведёшь финансы и многое другое. Ниже — все возможности по порядку: что и как работает.",
  openBot: "Открыть бота",
  back: "Инструкция",
  cmdTitle: "Все команды бота",
  cmds: [
    ["/start", "Начать, получить личную ссылку на веб-дневник"],
    ["/chat", "Включить режим беседы с AI-другом"],
    ["/stop", "Выйти из режима беседы"],
    ["/newchat", "Начать беседу с чистого листа (очистить историю)"],
    ["/ask", "Спросить ассистента о своей жизни (/ask вопрос)"],
    ["/save", "Сохранить сообщение как запись принудительно"],
    ["/money", "Финансовый разбор и советы"],
    ["/spend", "Записать расход: /spend 250 eur кафе"],
    ["/income", "Записать доход: /income 1000 зарплата"],
    ["/wish", "Добавить товар в Вишлист по ссылке: /wish <ссылка>"],
    ["/send", "Передать сообщение другому: /send Имя текст"],
    ["/nick", "Задать прозвище контакту: /nick @имя Котик"],
    ["/nicks", "Показать свои прозвища"],
    ["/unnick", "Удалить прозвище"],
    ["/relay", "Включить/выключить приём сообщений от других"],
    ["/lang", "Сменить язык бота (рус/eng/укр/fr)"],
    ["/link", "Получить ссылку на веб-дневник"],
    ["/invite", "Пригласить друга (реферальная ссылка)"],
    ["/demo", "Показать приветствие заново"],
    ["/resetpin", "Сбросить PIN-код входа"],
    ["/help", "Краткая помощь"],
  ],
  sections: [
    {
      icon: "ti-player-play",
      title: "Как начать",
      lines: [
        "Напиши боту /start — он заведёт твой дневник и пришлёт личную ссылку на веб-версию (вида …/u/<код>). По ней открывается сайт уже под твоим аккаунтом.",
        "Эта ссылка — твой ключ. Не пересылай её: кто откроет, тот войдёт. Для защиты можно поставить PIN (в Профиле на сайте), сбросить — командой /resetpin.",
        "Внизу чата с ботом есть постоянные кнопки: Дневник, Мои задачи, Моя мотивация, Пригласить друга — быстрые переходы.",
      ],
    },
    {
      icon: "ti-microphone",
      title: "Запись дневника (голос и текст)",
      lines: [
        "Просто расскажи боту о дне — голосовым сообщением или текстом. Голос бот сам расшифрует (Whisper).",
        "AI разберёт запись: выделит категории, теги, настроение, энергию, людей и места, а также извлечёт задачи, идеи, благодарности, добрые дела, обещания и мечты — всё разложится по разделам сайта автоматически.",
        "В ответ придёт тёплое резюме от 1-го лица, серия 🔥 и кнопки (Книга жизни, Спросить, Поделиться).",
        "Ошибся или бот не так расслышал? Скажи «исправь…», «я имел в виду…», «на самом деле…» — бот поправит ПОСЛЕДНЮЮ сегодняшнюю запись, не создавая дубль.",
        "Длинные голосовые (большой рассказ) всегда сохраняются как запись целиком — мысль не потеряется.",
      ],
    },
    {
      icon: "ti-sparkles",
      title: "AI-друг (режим беседы)",
      lines: [
        "Команда /chat включает живую беседу с AI-другом. Пока режим включён, твои сообщения идут другу (не в дневник). /stop — выйти, /newchat — начать заново.",
        "Друг знает о тебе всё из дневника, заметок и финансов, ищет свежее в интернете и помнит ваш разговор. Память общая с сайтом: начал в боте — продолжил на сайте, и наоборот.",
        "Он умеет ДЕЙСТВОВАТЬ прямо в беседе: «поставь напоминание на завтра», «добавь задачу», «запиши вес 80», «поставь цель», «отметь задачу выполненной» — выполнит и подтвердит.",
        "Память по смыслу: спроси про прошлое («что я говорил про маму», «когда болел») — найдёт нужные записи, даже старые.",
        "Если напишешь другу голосовым — он и ответит голосовым сообщением.",
      ],
    },
    {
      icon: "ti-message-question",
      title: "Вопросы ассистенту",
      lines: [
        "Команда /ask <вопрос> (или просто задай вопрос вне режима беседы) — ассистент ответит по твоему дневнику, базе знаний, визуальной памяти и финансам.",
        "Примеры: «сколько я потратил на кафе в этом месяце», «какие у меня открытые обещания», «найди техпаспорт авто».",
        "В отличие от /chat, это разовый вопрос-ответ без долгой нити беседы.",
      ],
    },
    {
      icon: "ti-bolt",
      title: "Команды-действия (бот делает за тебя)",
      lines: [
        "Боту можно давать команды обычными словами — он выполнит: «добавь цель пробежать марафон», «добавь задачу записаться к врачу», «отметь задачу про дерматолога выполненной», «запиши вес 78», «добавь мечту съездить в Японию», «удали последнюю запись».",
        "Бот узнаёт команды по повелительному тону. Если ты просто описываешь день («сегодня пробежал 5 км») — это сохранится как запись, а не как команда.",
        "В ответ бот даёт кнопку «Открыть» нужный раздел на сайте.",
      ],
    },
    {
      icon: "ti-bell",
      title: "Напоминания голосом",
      lines: [
        "Скажи или напиши обычной фразой: «напомни завтра в 9 позвонить врачу», «напоминай каждый день в 8 утра пить витамины», «напомни 5 июля про день рождения мамы», «через час напомни выключить плиту».",
        "Бот сам разберёт что, когда и как часто, создаст напоминание и (если подключён Google Календарь) отправит туда событие с уведомлением.",
        "Понимает повтор (каждый день/неделю/месяц/год) и «на весь день». Управлять напоминаниями можно в разделе «Напоминания» на сайте.",
      ],
    },
    {
      icon: "ti-wallet",
      title: "Финансы",
      lines: [
        "Быстрый ввод: /spend 250 eur кафе (расход), /income 1000 зарплата (доход). Можно и просто упомянуть в записи: «потратил 500 на продукты» — AI добавит операцию сам.",
        "/money — финансовый разбор и советы по твоим тратам.",
        "Если подключён банк (Monobank), операции подтягиваются автоматически. Они делятся на Личное / Бизнес / Переводы — сводки по умолчанию считают только личные траты, без бизнес-оборота и переводов.",
      ],
    },
    {
      icon: "ti-camera",
      title: "Фото: визуальная память и книги",
      lines: [
        "Пришли боту фото документа, чека, договора, вещи или момента — AI поймёт, что на нём, извлечёт данные (даты, суммы, номера) и сохранит в раздел «Память». Потом можно спросить ассистента: «найди свидетельство», «какой VIN».",
        "Фото обложки книги или штрих-кода с подписью «книга» — добавит книгу в твой читательский дневник «Книги».",
      ],
    },
    {
      icon: "ti-send",
      title: "Сообщения друзьям",
      lines: [
        "Бот может передать сообщение другому пользователю LIFE OS. Проще всего словами: «передай Ане, что опоздаю».",
        "Или командой: /send Имя текст (по имени контакта) либо /send @имя текст (по имени-ссылке).",
        "Прозвища: /nick @имя Котик — потом «передай Котику…». Список — /nicks, удалить — /unnick.",
        "Получателю приходит сообщение с подписью, от кого оно (анонимности нет). Лимит — 20 в день. Не хочешь получать — /relay выключает приём.",
      ],
    },
    {
      icon: "ti-bell-ringing",
      title: "Уведомления и язык",
      lines: [
        "Бот мягко напоминает вести дневник: утреннее тёплое сообщение и вечернее напоминание (без спама — если ты уже писал сегодня, лишний раз не трогает).",
        "Выключить уведомления можно в Профиле на сайте (переключатель «Уведомления в Telegram»).",
        "Язык бота — команда /lang (рус/eng/укр/fr). Выбор запоминается и не сбрасывается.",
      ],
    },
    {
      icon: "ti-bulb",
      title: "Джарвис замечает (антиципация)",
      lines: [
        "Иногда бот сам, без твоей просьбы, мягко подмечает закономерности в твоей жизни и предлагает действие — как внимательный друг.",
        "Например: «давно не упоминал зал — сходим сегодня?», «ты обещал перезвонить Артуру, не забыл?», «по воскресеньям вечером у тебя чаще спад — запланируй что-то приятное».",
        "Это бывает редко (примерно раз в неделю) и только когда есть реально полезный повод — никакого спама. Сообщение помечено значком ✨.",
      ],
    },
    {
      icon: "ti-shield-lock",
      title: "Приватность",
      lines: [
        "Твои записи видишь только ты. Мы не публикуем их и не показываем другим. AI читает твой текст, чтобы разложить его по полочкам — это честно сказано, без ложных обещаний «даже мы не видим».",
        "Доверие строим проверяемостью: экспорт всех данных и удаление аккаунта доступны в Профиле, код проекта открыт.",
      ],
    },
  ],
};

const EN: BotDoc = {
  title: "Telegram bot guide",
  intro:
    "The bot is the main entry to LIFE OS. Through it you keep a diary by voice and text, talk to your AI friend, set reminders, track finances and more. Below — every feature, how it works.",
  openBot: "Open the bot",
  back: "Guide",
  cmdTitle: "All bot commands",
  cmds: [
    ["/start", "Start, get your personal web-diary link"],
    ["/chat", "Enter chat mode with the AI friend"],
    ["/stop", "Leave chat mode"],
    ["/newchat", "Start the conversation fresh (clear history)"],
    ["/ask", "Ask the assistant about your life (/ask question)"],
    ["/save", "Force-save a message as an entry"],
    ["/money", "Financial review and tips"],
    ["/spend", "Log an expense: /spend 250 eur cafe"],
    ["/income", "Log income: /income 1000 salary"],
    ["/wish", "Add an item to Wishlist by link: /wish <url>"],
    ["/send", "Relay a message: /send Name text"],
    ["/nick", "Set a nickname: /nick @name Kitty"],
    ["/nicks", "Show your nicknames"],
    ["/unnick", "Remove a nickname"],
    ["/relay", "Turn receiving messages on/off"],
    ["/lang", "Change the bot language"],
    ["/link", "Get your web-diary link"],
    ["/invite", "Invite a friend (referral link)"],
    ["/demo", "Replay the welcome"],
    ["/resetpin", "Reset your login PIN"],
    ["/help", "Quick help"],
  ],
  sections: [
    {
      icon: "ti-player-play",
      title: "Getting started",
      lines: [
        "Send /start — the bot creates your diary and sends a personal link to the web version (…/u/<code>). It opens the site already signed in as you.",
        "That link is your key. Don't forward it: whoever opens it gets in. For protection set a PIN (in Profile on the site); reset it with /resetpin.",
        "At the bottom of the chat there are persistent buttons: Diary, My tasks, My motivation, Invite a friend.",
      ],
    },
    {
      icon: "ti-microphone",
      title: "Diary entries (voice & text)",
      lines: [
        "Just tell the bot about your day — by voice or text. Voice is transcribed automatically (Whisper).",
        "AI parses the entry: categories, tags, mood, energy, people and places, plus tasks, ideas, gratitude, good deeds, promises and dreams — sorted into the site sections automatically.",
        "You get a warm first-person recap, a streak 🔥 and buttons (Life Book, Ask, Share).",
        "Misheard or wrong? Say “correct…”, “I meant…”, “actually…” — the bot fixes your LAST entry of the day instead of creating a duplicate.",
        "Long voice notes are always saved in full — your thought won't be lost.",
      ],
    },
    {
      icon: "ti-sparkles",
      title: "AI friend (chat mode)",
      lines: [
        "/chat turns on a live conversation with your AI friend. While it's on, your messages go to the friend (not the diary). /stop to leave, /newchat to restart.",
        "The friend knows everything from your diary, notes and finances, checks the web for fresh facts, and remembers the conversation. Memory is shared with the website.",
        "It can ACT right in the chat: “set a reminder for tomorrow”, “add a task”, “log my weight 80”, “set a goal”, “mark the task done” — done and confirmed.",
        "Memory by meaning: ask about the past (“what did I say about mom”, “when was I sick”) — it finds the right entries, even old ones.",
        "Message it with a voice note — it replies with a voice message too.",
      ],
    },
    {
      icon: "ti-message-question",
      title: "Asking the assistant",
      lines: [
        "/ask <question> (or just ask outside chat mode) — the assistant answers from your diary, knowledge base, visual memory and finances.",
        "Examples: “how much did I spend on cafes this month”, “what open promises do I have”, “find the car registration”.",
        "Unlike /chat, this is a one-off question and answer.",
      ],
    },
    {
      icon: "ti-bolt",
      title: "Action commands (the bot does it for you)",
      lines: [
        "Give commands in plain words and the bot performs them: “add a goal to run a marathon”, “add a task to book a doctor”, “mark the dermatologist task done”, “log weight 78”, “add a dream to visit Japan”, “delete the last entry”.",
        "The bot recognizes commands by their imperative tone. Just describing your day (“ran 5 km today”) is saved as an entry, not a command.",
        "It replies with an “Open” button to the relevant section.",
      ],
    },
    {
      icon: "ti-bell",
      title: "Reminders by voice",
      lines: [
        "Say or type a plain phrase: “remind me tomorrow at 9 to call the doctor”, “remind me every day at 8am to take vitamins”, “remind me on July 5 about mom's birthday”, “in an hour remind me to turn off the stove”.",
        "The bot figures out what, when and how often, creates the reminder and (if Google Calendar is connected) sends an event with a notification.",
        "It understands repeat (daily/weekly/monthly/yearly) and all-day. Manage reminders in the “Reminders” section on the site.",
      ],
    },
    {
      icon: "ti-wallet",
      title: "Finances",
      lines: [
        "Quick entry: /spend 250 eur cafe (expense), /income 1000 salary (income). Or just mention it in an entry: “spent 500 on groceries” — AI logs it.",
        "/money — a financial review with tips.",
        "If your bank (Monobank) is connected, transactions sync automatically. They're split into Personal / Business / Transfers — summaries count only personal spending by default.",
      ],
    },
    {
      icon: "ti-camera",
      title: "Photos: visual memory & books",
      lines: [
        "Send a photo of a document, receipt, contract, item or moment — AI understands it, extracts data (dates, amounts, numbers) and saves it to “Memory”. Later ask: “find the certificate”, “what's the VIN”.",
        "A photo of a book cover or barcode captioned “book” adds the book to your reading log “Books”.",
      ],
    },
    {
      icon: "ti-send",
      title: "Messaging friends",
      lines: [
        "The bot can relay a message to another LIFE OS user. Easiest in words: “tell Anna I'll be late”.",
        "Or by command: /send Name text (by contact name) or /send @name text (by link-name).",
        "Nicknames: /nick @name Kitty — then “tell Kitty…”. List — /nicks, remove — /unnick.",
        "The recipient gets the message signed with who sent it (no anonymity). Limit — 20 a day. Turn off your inbox with /relay.",
      ],
    },
    {
      icon: "ti-bell-ringing",
      title: "Notifications & language",
      lines: [
        "The bot gently nudges you to journal: a warm morning message and an evening reminder (no spam — if you already wrote today, it won't bug you).",
        "Turn notifications off in Profile on the site (“Telegram notifications” toggle).",
        "Bot language — /lang. The choice is remembered and won't reset.",
      ],
    },
    {
      icon: "ti-bulb",
      title: "Jarvis notices (anticipation)",
      lines: [
        "Sometimes the bot, without being asked, gently spots patterns in your life and suggests an action — like an attentive friend.",
        "For example: “haven't mentioned the gym in a while — go today?”, “you promised to call Arthur back, remember?”, “Sunday evenings tend to dip for you — plan something nice”.",
        "It's rare (about once a week) and only when there's a genuinely useful reason — no spam. Such messages are marked with ✨.",
      ],
    },
    {
      icon: "ti-shield-lock",
      title: "Privacy",
      lines: [
        "Only you see your entries. We don't publish them or show them to others. AI reads your text to sort it — stated honestly, no false “even we can't see it” promises.",
        "Trust through verifiability: export all data and delete your account from Profile; the project's code is open.",
      ],
    },
  ],
};

export function botGuide(locale: string): BotDoc {
  if (locale === "en" || locale === "fr" || locale === "es") return EN;
  return RU; // uk falls back to ru
}
