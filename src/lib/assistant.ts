import type { Locale } from "./i18n";

// Знания «помощника» (плавающий ассистент внизу справа на каждой странице).
// Цель: помочь НЕтехническому пользователю сориентироваться по функционалу —
// где он сейчас, что здесь можно сделать, куда пойти дальше, и спросить у AI.

export type PageGuide = {
  // title берётся из nav-меток; здесь — что можно делать + куда дальше.
  can: string[]; // 2–4 пункта «что здесь можно»
  go?: { key: string; label: string }[]; // подсказки «куда дальше» (key = href или nav-key)
};

export type AssistantStrings = {
  bubble: string; // подпись/aria кнопки
  title: string;
  hereNow: string; // «Ты сейчас здесь»
  canDo: string; // «Что здесь можно»
  goNext: string; // «Куда дальше»
  searchPh: string; // плейсхолдер поиска
  searchNone: string; // ничего не найдено
  askTitle: string; // «Спросить AI»
  askPh: string; // плейсхолдер вопроса
  askBtn: string; // кнопка «Спросить»
  asking: string; // «Думаю…»
  askHint: string; // подсказка под полем
  askError: string; // ошибка
  fullGuide: string; // «Открыть полную инструкцию»
  close: string;
  greet: string; // приветствие вверху
  // Блок «Оставить пожелание» (идёт владельцу в Telegram через /api/feedback)
  fbTitle: string;
  fbSub: string;
  fbIdea: string;
  fbSync: string;
  fbOther: string;
  fbPh: string;
  fbSend: string;
  fbSending: string;
  fbThanks: string;
  fbError: string;
};

const S: Record<Locale, AssistantStrings> = {
  ru: {
    bubble: "Помощник",
    title: "Помощник",
    hereNow: "Ты сейчас здесь",
    canDo: "Что здесь можно",
    goNext: "Куда дальше",
    searchPh: "Найти раздел…",
    searchNone: "Ничего не нашлось",
    askTitle: "Спросить AI",
    askPh: "Например: как записать вес? где мои мечты?",
    askBtn: "Спросить",
    asking: "Думаю…",
    askHint: "AI знает функционал приложения и подскажет, куда нажать.",
    askError: "Не получилось ответить. Попробуй ещё раз.",
    fullGuide: "Полная инструкция",
    close: "Закрыть",
    greet: "Привет! Помогу сориентироваться.",
    fbTitle: "Оставить пожелание",
    fbSub: "Хочешь доработку, синхронизацию с сервисом или другое — напиши, я прочитаю лично.",
    fbIdea: "💡 Доработка",
    fbSync: "🔗 Синхронизация",
    fbOther: "💬 Другое",
    fbPh: "Что добавить или улучшить?",
    fbSend: "Отправить",
    fbSending: "Отправляю…",
    fbThanks: "Спасибо! 🙏 Я прочитаю это лично.",
    fbError: "Не отправилось. Попробуй ещё раз.",
  },
  en: {
    bubble: "Helper",
    title: "Helper",
    hereNow: "You are here",
    canDo: "What you can do",
    goNext: "Where to go next",
    searchPh: "Find a section…",
    searchNone: "Nothing found",
    askTitle: "Ask AI",
    askPh: "e.g. how do I log my weight? where are my dreams?",
    askBtn: "Ask",
    asking: "Thinking…",
    askHint: "AI knows the app and tells you where to tap.",
    askError: "Couldn't answer. Try again.",
    fullGuide: "Full guide",
    close: "Close",
    greet: "Hi! Let me help you find your way.",
    fbTitle: "Send a wish",
    fbSub: "Want a feature, a sync with a service, or anything else — write to me, I read it personally.",
    fbIdea: "💡 Feature",
    fbSync: "🔗 Integration",
    fbOther: "💬 Other",
    fbPh: "What to add or improve?",
    fbSend: "Send",
    fbSending: "Sending…",
    fbThanks: "Thank you! 🙏 I'll read it personally.",
    fbError: "Didn't send. Try again.",
  },
  uk: {} as AssistantStrings,
  fr: {} as AssistantStrings,
};
S.uk = {
  bubble: "Помічник",
  title: "Помічник",
  hereNow: "Ти зараз тут",
  canDo: "Що тут можна",
  goNext: "Куди далі",
  searchPh: "Знайти розділ…",
  searchNone: "Нічого не знайдено",
  askTitle: "Запитати AI",
  askPh: "Напр.: як записати вагу? де мої мрії?",
  askBtn: "Запитати",
  asking: "Думаю…",
  askHint: "AI знає функціонал застосунку й підкаже, куди натиснути.",
  askError: "Не вдалося відповісти. Спробуй ще раз.",
  fullGuide: "Повна інструкція",
  close: "Закрити",
  greet: "Привіт! Допоможу зорієнтуватися.",
  fbTitle: "Залишити побажання",
  fbSub: "Хочеш доробку, синхронізацію із сервісом чи інше — напиши, я прочитаю особисто.",
  fbIdea: "💡 Доробка",
  fbSync: "🔗 Синхронізація",
  fbOther: "💬 Інше",
  fbPh: "Що додати або покращити?",
  fbSend: "Надіслати",
  fbSending: "Надсилаю…",
  fbThanks: "Дякую! 🙏 Я прочитаю це особисто.",
  fbError: "Не надіслалося. Спробуй ще раз.",
};
S.fr = {
  bubble: "Aide",
  title: "Aide",
  hereNow: "Vous êtes ici",
  canDo: "Ce que vous pouvez faire",
  goNext: "Où aller ensuite",
  searchPh: "Trouver une section…",
  searchNone: "Rien trouvé",
  askTitle: "Demander à l'IA",
  askPh: "ex. : comment noter mon poids ? où sont mes rêves ?",
  askBtn: "Demander",
  asking: "Je réfléchis…",
  askHint: "L'IA connaît l'application et vous indique où appuyer.",
  askError: "Impossible de répondre. Réessayez.",
  fullGuide: "Guide complet",
  close: "Fermer",
  greet: "Bonjour ! Je vous aide à vous repérer.",
  fbTitle: "Faire un vœu",
  fbSub: "Une fonctionnalité, une synchro avec un service ou autre — écris-moi, je lis tout personnellement.",
  fbIdea: "💡 Amélioration",
  fbSync: "🔗 Intégration",
  fbOther: "💬 Autre",
  fbPh: "Quoi ajouter ou améliorer ?",
  fbSend: "Envoyer",
  fbSending: "Envoi…",
  fbThanks: "Merci ! 🙏 Je le lirai personnellement.",
  fbError: "Échec de l'envoi. Réessayez.",
};

export function assistantStrings(locale: Locale): AssistantStrings {
  return S[locale] || S.ru;
}

// Карта страниц: ключ = префикс пути. Подбор — самый длинный совпавший префикс.
// go[].key — это nav-ключ (резолвится в href) или прямой href со слэшем.
const GUIDES: Record<Locale, Record<string, PageGuide>> = {
  ru: {
    "/": {
      can: [
        "Быстро записать мысль или событие — текстом или голосом (🎤).",
        "Увидеть свой день: серию 🔥, метрики, добрые дела, обещания, виджет книги.",
        "Переключить вкладки Сегодня · Путь · Наследие.",
        "Собрать главную под себя — кнопка «⚙ Настроить».",
      ],
      go: [{ key: "diary", label: "Дневник" }, { key: "biographer", label: "Спросить свою жизнь" }],
    },
    "/diary": {
      can: [
        "Листать записи по календарю — дни с записями подсвечены.",
        "Выбрать день и увидеть только его записи.",
        "Поправить ✎ или удалить 🗑 запись прямо в карточке.",
      ],
      go: [{ key: "today", label: "На главную — добавить запись" }, { key: "analytics", label: "Что заметил AI" }],
    },
    "/health": {
      can: [
        "Вкладки Здоровье · Энергия · Спорт · Питание.",
        "Вести трекер веса: текущий вес, цель и график.",
        "Видеть блок «Здоровье сейчас» — что заметил AI (без диагнозов).",
      ],
      go: [{ key: "today", label: "Записать самочувствие" }, { key: "plans", label: "Цели по здоровью" }],
    },
    "/goals": {
      can: [
        "Вкладки Цели · Задачи · Мечты · Идеи.",
        "Вести цели с прогрессом и отмечать задачи.",
        "«Карта желаний»: доска мечт по сферам с фото или эмодзи.",
      ],
      go: [{ key: "today", label: "Добавить цель голосом" }, { key: "share", label: "Поделиться мечтой" }],
    },
    "/finance": {
      can: [
        "Записывать доходы и расходы, выбирать категорию.",
        "Видеть баланс месяца и куда уходят деньги.",
        "Задавать бюджеты-лимиты и вести несколько валют.",
      ],
      go: [{ key: "today", label: "Сказать боту «потратил 500»" }],
    },
    "/family": {
      can: ["Видеть записи и моменты, связанные с семьёй.", "Близкие люди и события в одном месте."],
      go: [{ key: "people", label: "Люди" }, { key: "trace", label: "Мой след" }],
    },
    "/projects": {
      can: ["Видеть свои проекты и записи по ним.", "Переименовать или удалить проект, открыть историю проекта."],
      go: [{ key: "biographer", label: "Спросить про проект" }],
    },
    "/lifebook": {
      can: [
        "Твоя жизнь, собранная в книгу-летопись по годам.",
        "Открывать AI-главы, править текст, добавлять фото и истории.",
        "Читать в режиме книги и сохранять в PDF.",
      ],
      go: [{ key: "memory", label: "Фото для книги" }, { key: "share", label: "Опубликовать страницу" }],
    },
    "/trace": {
      can: [
        "Видеть добрые дела, которые ты делаешь.",
        "Следить за обещаниями людям и отмечать выполненные.",
        "Тёплый итог за неделю — сколько добра ты принёс.",
      ],
      go: [{ key: "today", label: "Записать доброе дело" }],
    },
    "/memory": {
      can: [
        "Загрузить фото или документ — AI поймёт смысл и сохранит в архив.",
        "Хранить чеки, гарантии, важные моменты по категориям.",
        "Добавить заметку к фото — текстом или голосом.",
      ],
      go: [{ key: "lifebook", label: "Фото в Книгу жизни" }],
    },
    "/people": {
      can: ["Люди из твоих записей в одном месте.", "Переименовать, объединить дубли или скрыть человека."],
      go: [{ key: "family", label: "Семья" }, { key: "trace", label: "Мой след" }],
    },
    "/places": {
      can: ["«Где я был» — реальные места из записей.", "«Куда хочу» — мечты-направления из «Карты желаний»."],
      go: [{ key: "goals", label: "Карта желаний" }],
    },
    "/analytics": {
      can: [
        "Один взгляд AI на всю твою жизнь: что радует, что влияет на энергию.",
        "Цепочки, закономерности и «Карта жизни».",
        "Кнопка «Обновить» пересобирает наблюдения.",
      ],
      go: [{ key: "lab", label: "Проверить гипотезу" }, { key: "biographer", label: "Спросить детали" }],
    },
    "/lab": {
      can: ["Проверять гипотезы экспериментом (напр. «ложиться раньше»).", "Видеть честный итог «до/после»."],
      go: [{ key: "analytics", label: "Что заметил AI" }],
    },
    "/biographer": {
      can: ["Задать вопрос о своей жизни — AI ответит из всех твоих записей.", "Спрашивать можно и прямо в боте Telegram."],
      go: [{ key: "analytics", label: "Что заметил AI" }, { key: "lifebook", label: "Книга жизни" }],
    },
    "/share": {
      can: [
        "Собрать красивую карточку достижения для Telegram/Instagram/WhatsApp.",
        "Включить публичную страницу-витрину /p/имя.",
        "Настроить, что показывать другим — приватность остаётся за тобой.",
      ],
      go: [{ key: "paths", label: "Мои пути" }, { key: "lifebook", label: "Опубликовать страницу" }],
    },
    "/paths": {
      can: ["Создать «Путь» — длинную историю (напр. «Восстановление здоровья»).", "Публиковать записи в путь — получится публичный таймлайн."],
      go: [{ key: "share", label: "Поделиться" }],
    },
    "/profile": {
      can: [
        "Личный кабинет: ссылка-вход, язык, акцент главной.",
        "Экспорт данных, тариф, безопасность.",
        "PIN, выход и удаление аккаунта.",
      ],
      go: [{ key: "guide", label: "Инструкция" }, { key: "share", label: "Поделиться" }],
    },
    "/guide": {
      can: ["Что нового в приложении и что в работе.", "Подробные карточки возможностей с примерами и подсказками."],
      go: [{ key: "today", label: "На главную" }],
    },
    "/entry": {
      can: ["Подробности записи: причины, последствия, связи (Life Intelligence).", "Опубликовать запись или удалить её."],
      go: [{ key: "diary", label: "Назад в дневник" }],
    },
  },
  en: {
    "/": {
      can: [
        "Quickly capture a thought or event — by text or voice (🎤).",
        "See your day: streak 🔥, metrics, good deeds, promises, book widget.",
        "Switch tabs Today · Path · Legacy.",
        "Build the home your way — the “⚙ Customize” button.",
      ],
      go: [{ key: "diary", label: "Diary" }, { key: "biographer", label: "Ask your life" }],
    },
    "/diary": {
      can: ["Browse entries on a calendar — days with entries are highlighted.", "Pick a day to see just its entries.", "Edit ✎ or delete 🗑 an entry right in the card."],
      go: [{ key: "today", label: "Home — add an entry" }, { key: "analytics", label: "Life Intelligence" }],
    },
    "/health": {
      can: ["Tabs Health · Energy · Sport · Food.", "Weight tracker: current weight, goal and chart.", "“Health now” block — what AI noticed (no diagnoses)."],
      go: [{ key: "today", label: "Log how you feel" }, { key: "plans", label: "Health goals" }],
    },
    "/goals": {
      can: ["Tabs Goals · Tasks · Dreams · Ideas.", "Track goals with progress and check off tasks.", "“Wish board”: dreams by life area with photos or emoji."],
      go: [{ key: "today", label: "Add a goal by voice" }, { key: "share", label: "Share a dream" }],
    },
    "/finance": {
      can: ["Log income and expenses, pick a category.", "See your monthly balance and where money goes.", "Set budget limits and use several currencies."],
      go: [{ key: "today", label: "Tell the bot “spent 500”" }],
    },
    "/family": { can: ["See entries and moments tied to family.", "Loved ones and events in one place."], go: [{ key: "people", label: "People" }, { key: "trace", label: "My Trace" }] },
    "/projects": { can: ["See your projects and their entries.", "Rename or delete a project, open its story."], go: [{ key: "biographer", label: "Ask about a project" }] },
    "/lifebook": {
      can: ["Your life gathered into a chronicle book by year.", "Open AI chapters, edit text, add photos and stories.", "Read in book mode and save as PDF."],
      go: [{ key: "memory", label: "Photos for the book" }, { key: "share", label: "Publish a page" }],
    },
    "/trace": {
      can: ["See the good deeds you do.", "Track promises to people and check off kept ones.", "A warm weekly summary of the good you bring."],
      go: [{ key: "today", label: "Log a good deed" }],
    },
    "/memory": {
      can: ["Upload a photo or document — AI understands it and files it.", "Keep receipts, warranties, key moments by category.", "Add a note to a photo — by text or voice."],
      go: [{ key: "lifebook", label: "Photos into the Book" }],
    },
    "/people": { can: ["People from your entries in one place.", "Rename, merge duplicates or hide a person."], go: [{ key: "family", label: "Family" }, { key: "trace", label: "My Trace" }] },
    "/places": { can: ["“Where I've been” — real places from entries.", "“Where I want to go” — travel dreams."], go: [{ key: "goals", label: "Wish board" }] },
    "/analytics": {
      can: ["One AI look at your whole life: what brings joy, what affects energy.", "Chains, patterns and the “Life map”.", "The “Refresh” button rebuilds observations."],
      go: [{ key: "lab", label: "Test a hypothesis" }, { key: "biographer", label: "Ask for details" }],
    },
    "/lab": { can: ["Test hypotheses with an experiment (e.g. “sleep earlier”).", "See an honest before/after result."], go: [{ key: "analytics", label: "Life Intelligence" }] },
    "/biographer": { can: ["Ask about your life — AI answers from all your entries.", "You can also ask right in the Telegram bot."], go: [{ key: "analytics", label: "Life Intelligence" }, { key: "lifebook", label: "Book of Life" }] },
    "/share": {
      can: ["Build a beautiful achievement card for Telegram/Instagram/WhatsApp.", "Turn on your public showcase /p/name.", "Choose what others see — privacy stays yours."],
      go: [{ key: "paths", label: "My paths" }, { key: "lifebook", label: "Publish a page" }],
    },
    "/paths": { can: ["Create a “Path” — a long story (e.g. “Restoring health”).", "Publish entries into it for a public timeline."], go: [{ key: "share", label: "Share" }] },
    "/profile": {
      can: ["Your account: login link, language, home accent.", "Data export, plan, security.", "PIN, sign out and delete account."],
      go: [{ key: "guide", label: "Guide" }, { key: "share", label: "Share" }],
    },
    "/guide": { can: ["What's new and what's coming.", "Detailed feature cards with examples and tips."], go: [{ key: "today", label: "Home" }] },
    "/entry": { can: ["Entry details: causes, consequences, links (Life Intelligence).", "Publish or delete the entry."], go: [{ key: "diary", label: "Back to diary" }] },
  },
  uk: {} as Record<string, PageGuide>,
  fr: {} as Record<string, PageGuide>,
};
GUIDES.uk = GUIDES.ru;
GUIDES.fr = GUIDES.en;

export function pageGuide(locale: Locale, path: string): PageGuide | null {
  const map = GUIDES[locale] || GUIDES.ru;
  // Самый длинный совпавший префикс (но "/" — только при точном совпадении).
  let best: string | null = null;
  for (const key of Object.keys(map)) {
    if (key === "/") continue;
    if (path === key || path.startsWith(key + "/") || path.startsWith(key)) {
      if (!best || key.length > best.length) best = key;
    }
  }
  if (!best) best = path === "/" ? "/" : null;
  return best ? map[best] : null;
}

// База знаний для AI-ответов (один компактный обзор всего функционала).
// Держим коротко — это дешёвый haiku-проход.
export const APP_KNOWLEDGE = `LIFE OS — личный дневник жизни. Пользователь наговаривает или пишет боту в Telegram, AI раскладывает запись по категориям/тегам/настроению/людям/местам и извлекает задачи, инсайты, благодарности, добрые дела, обещания, мечты, финансы. На сайте всё это видно в разделах.

Разделы и где что:
- Сегодня (главная, /): быстрая запись текстом и голосом (🎤), серия 🔥, метрики дня, добрые дела, обещания, виджет книги; вкладки Сегодня/Путь/Наследие; кнопка «⚙ Настроить» собирает главную под себя.
- Дневник (/diary): все записи в календаре, выбор дня; правка ✎ и удаление 🗑 прямо в карточке.
- Самочувствие (/health): вкладки Здоровье/Энергия/Спорт/Питание; ТРЕКЕР ВЕСА (текущий вес, цель, график); блок «Здоровье сейчас» от AI. Чтобы записать вес — скажи боту «вешу 80 кг» или добавь на вкладке Здоровье.
- Цели и задачи (/goals): вкладки Цели/Задачи/МЕЧТЫ (Карта желаний — доска по сферам с фото/эмодзи, статусы Мечтаю→В процессе→Сбылось)/Идеи.
- Деньги (/finance): доходы и расходы, категории, баланс месяца, бюджеты-лимиты, несколько валют. Можно сказать боту «потратил 500 на продукты».
- Семья (/family), Проекты (/projects), Люди (/people), Места (/places — «Где я был» и «Куда хочу»).
- Книга жизни (/lifebook): твоя жизнь как книга по годам, AI-главы, правка, фото, ридер, экспорт PDF.
- Мой след (/trace): добрые дела и обещания людям.
- Память (/memory): фото и документы (чеки, гарантии, моменты) → AI понимает смысл и сохраняет; заметка голосом/текстом.
- Что заметил AI (/analytics): наблюдения по всей жизни, закономерности, «Карта жизни», кнопка «Обновить».
- Лаборатория (/lab): проверка гипотез экспериментом, честный итог до/после.
- Биограф (/biographer): задать вопрос о своей жизни, AI отвечает из всех записей (можно и в боте).
- Поделиться (/share): карточки достижений в Telegram/Instagram/WhatsApp, публичная страница /p/имя.
- Мои пути (/paths): «Путь» — длинная публичная история-таймлайн.
- Профиль (/profile): ссылка-вход, язык, акцент главной, экспорт, тариф, безопасность, PIN, выход.
- Инструкция (/guide): что нового и подробные карточки возможностей.

Главный способ что-то записать — наговорить или написать боту в Telegram; AI сам разложит по нужным разделам. Исправить последнюю запись — сказать боту «исправь…» или «на самом деле…».`;
