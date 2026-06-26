import type { Locale } from "./i18n";

// Журнал изменений + подробные «активные» возможности (модалки) для Инструкции.
// ПРАВИЛО (договорённость с Игорем): каждое глобальное изменение добавляем сюда —
// в changelog (этот месяц / ожидаемое) и при необходимости в features.

export type ChangeItem = { t: string; d: string; tag: "new" | "improved" | "soon" };
export type FSection = { h?: string; p?: string; steps?: string[]; examples?: string[]; tips?: string[] };
export type Feature = { key: string; icon: string; color: string; title: string; short: string; sections: FSection[] };

export type Extras = {
  whatsNew: string;
  whatsNewLead: string;
  thisMonth: string;
  upcoming: string;
  featuresTitle: string;
  featuresLead: string;
  open: string;
  close: string;
  stepsL: string;
  examplesL: string;
  tipsL: string;
  badges: { new: string; improved: string; soon: string };
  changelog: ChangeItem[];
  features: Feature[];
};

const E: Record<Locale, Extras> = {
  ru: {
    whatsNew: "Что нового",
    whatsNewLead: "Мы постоянно улучшаем LIFE OS. Здесь — что появилось недавно и что в работе.",
    thisMonth: "Доработки этого месяца",
    upcoming: "Ожидаемые доработки",
    featuresTitle: "Возможности — подробно",
    featuresLead: "Нажми на любую карточку — откроется окно с инструкцией, примерами и подсказками.",
    open: "Подробнее",
    close: "Закрыть",
    stepsL: "Как пользоваться",
    examplesL: "Примеры",
    tipsL: "Подсказки",
    badges: { new: "Новое", improved: "Улучшено", soon: "Скоро" },
    changelog: [
      { t: "Книга жизни стала полностью твоей", d: "Теперь можно править текст любой главы и дописывать свои истории, прятать и переставлять главы, чистить людей и места (переименовать, объединить дубли, скрыть) и добавлять фото из «Визуальной памяти». На странице книги — пошаговая инструкция «Как создать свою книгу».", tag: "new" },
      { t: "Визуальная память", d: "Фото и документы (чек, гарантия, важный момент) → AI понимает смысл и сохраняет в архив с категориями. Можно прислать фото боту или загрузить на сайте и добавить заметку голосом или текстом.", tag: "new" },
      { t: "Книга жизни → «Моя жизнь, [год]»", d: "Вкладка превратилась в настоящую книгу-летопись: статистика года, оглавление, AI-главы, режим «Вся жизнь» (автобиография), ридер и экспорт в PDF.", tag: "new" },
      { t: "Честная наполненность книги", d: "Книга текущего года больше не показывает «почти готова» в середине года: видно «наполнено» (собранный материал) и «год прожит на X%» — книга дополняется вместе с тобой.", tag: "improved" },
      { t: "Карта жизни без дублей", d: "В «Что заметил AI» тег и одноимённая категория (#здоровье и Здоровье) теперь объединяются в одну тему — без повторов.", tag: "improved" },
      { t: "Места: мечты отдельно от поездок", d: "Страны, о которых ты мечтаешь, больше не попадают в «Где я был». По тексту записи понимаем: поездка это или мечта.", tag: "improved" },
      { t: "Тарифы и печатная книга связаны", d: "Со страницы «Тарифы» теперь есть переход к заказу настоящей печатной «Книги жизни» — это разовый заказ, отдельно от подписки.", tag: "improved" },
      { t: "Профиль: понятная безопасность", d: "В разделе «Безопасность» честно расписано, как защищены твои данные: записи видишь только ты, люди их не читают, текст обрабатывает лишь AI для твоих резюме. Дубль настройки главной убран — она и так на главной.", tag: "improved" },
      { t: "Виджет книги на главной", d: "Сразу видно, как наполняется твоя книга за год: готовность в % и сколько записей уже стали её страницами.", tag: "new" },
      { t: "Мечты / Карта желаний", d: "Доска желаний по сферам жизни с фото или эмодзи и статусами Мечтаю → В процессе → Сбылось ✨. AI сам достаёт мечты из записей.", tag: "new" },
      { t: "«Что заметил AI» — свежие рекорды", d: "Аналитика показывает твои актуальные максимумы (вес, дистанции, отжимания) с датами, а не зависает на старых числах.", tag: "improved" },
      { t: "Новый дизайн «Осознанность»", d: "Голос-first главная с большим живым микрофоном. Включается тумблером вверху главной — можно сравнить с классическим.", tag: "new" },
    ],
    features: [
      {
        key: "book", icon: "ti-book-2", color: "var(--accent)", title: "Книга жизни",
        short: "Твоя жизнь, собранная в книгу. Можно читать, печатать и дарить близким.",
        sections: [
          { p: "LIFE OS собирает твои записи, людей, места и события в красивую книгу-летопись. Выбери год — или «Вся жизнь» для автобиографии. Это будущее наследие, которое можно подарить родителям, детям и внукам." },
          {
            h: "Как пользоваться", steps: [
              "Открой раздел «Книга жизни» в меню.",
              "Выбери период вверху: конкретный год или «Вся жизнь».",
              "Укажи тип книги (Мой год / Для близких / Семейная / История жизни) и кому она.",
              "Заполни «Посвящение» и при желании «Письмо себе» и «Письмо близким».",
              "В «Оглавлении» открывай главы — AI напишет их по твоим записям.",
              "Нажми «Открыть книгу», чтобы листать её целиком, и «Скачать / Печать (PDF)».",
            ],
          },
          { h: "Примеры посвящения", examples: ["«Моим детям — чтобы вы знали меня настоящим».", "«Маме и папе — с благодарностью за всё».", "«Тому, кто прочитает это через много лет»."] },
          { h: "Подсказки", tips: ["Чем больше записей — тем полнее главы. Готовность каждой главы видна в %.", "Голосовые в боте — самый быстрый способ наполнить книгу.", "Книгу можно пересобирать в любой момент: AI обновит главы по новым записям.", "Печать в типографии и подарочные версии — скоро; пока можно сохранить PDF и распечатать где угодно."] },
        ],
      },
      {
        key: "capture", icon: "ti-microphone", color: "#ec4899", title: "Запись: голос и текст",
        short: "Главное действие. Наговори или напиши боту — остальное сделает AI.",
        sections: [
          { p: "Не нужно ничего заполнять вручную. Просто расскажи, что произошло — голосом или текстом, — и AI разложит это по категориям, тегам, людям, настроению и задачам." },
          { h: "Как пользоваться", steps: ["Открой бота в Telegram.", "Запиши голосовое или напиши пару строк о дне, мыслях, тренировке, идее.", "AI распознает речь и сохранит структурированную запись.", "Ошибся? Скажи «исправь…» или «на самом деле…» — бот поправит последнюю запись."] },
          { h: "Примеры", examples: ["«Сегодня пробежал 5 км, чувствую себя отлично».", "«Встретился с Андреем, обсудили проект LIFE OS».", "«Спал плохо, настроение так себе, но много успел»."] },
          { h: "Подсказки", tips: ["Голос быстрее текста: 30 секунд на ходу = полноценная запись.", "Упоминай имена и проекты — AI построит связи и карту жизни.", "Плохой день — тоже запись: именно из них видно, что влияет на настроение."] },
        ],
      },
      {
        key: "home", icon: "ti-home", color: "var(--accent)", title: "Главная и её настройка",
        short: "Твой день в одном экране. Можно собрать главную под себя.",
        sections: [
          { p: "На главной — быстрая запись, твоя серия 🔥, метрики дня, добрые дела, обещания и виджет книги. Три вкладки: Сегодня, Путь, Наследие." },
          { h: "Как настроить", steps: ["Нажми «⚙ Настроить» вверху главной.", "Выбери готовый акцент (Осознанность, Фокус, Добрый след, Баланс, Минимум).", "Или собери свою — отметь нужные блоки в режиме «Собрать свою».", "Изменения применяются сразу."] },
          { h: "Подсказки", tips: ["Виджет «Моя книга жизни» можно включить/выключить в настройке главной.", "Серия 🔥 важнее объёма — пиши хоть пару строк каждый день.", "На главной тоже можно наговаривать голосом — кнопка 🎤 рядом с «Добавить»."] },
        ],
      },
      {
        key: "trace", icon: "ti-heart-handshake", color: "#ec4899", title: "Мой след",
        short: "Добро, которое ты делаешь, и обещания, которые держишь.",
        sections: [
          { p: "AI замечает в твоих записях добрые дела и обещания людям и собирает их в тёплый «след» — чтобы видеть, сколько хорошего ты приносишь в мир." },
          { h: "Как работает", steps: ["Просто упоминай в записях, что сделал доброе или кому что обещал.", "AI сам вынесет это в «Мой след».", "Отмечай выполненные обещания галочкой."] },
          { h: "Примеры", examples: ["«Помог соседке донести сумки».", "«Обещал сыну сходить в выходные в парк».", "«Перевёл деньги на благотворительность»."] },
          { h: "Подсказки", tips: ["Долг или оплата — это НЕ доброе дело, AI их различает.", "Раз в неделю загляни в «След за неделю» — это мотивирует."] },
        ],
      },
      {
        key: "ai", icon: "ti-sparkles", color: "var(--insight)", title: "Что заметил AI · Лаборатория",
        short: "Закономерности твоей жизни и честная проверка гипотез.",
        sections: [
          { p: "«Что заметил AI» — один взгляд на всю твою жизнь: что радует, что влияет на энергию, какие цепочки и закономерности. «Лаборатория» — проверка гипотез экспериментом." },
          { h: "Как пользоваться", steps: ["Открой «Что заметил AI» — увидишь наблюдения по всем записям.", "Нажми «Обновить», чтобы пересобрать заново.", "В «Лаборатории» выбери гипотезу (напр. «ложиться раньше») и запусти эксперимент.", "После периода увидишь честный итог «до/после»."] },
          { h: "Примеры гипотез", examples: ["«Если ложиться до 23:00 — энергия выше».", "«Спорт улучшает настроение».", "«Меньше кофе — лучше сон»."] },
          { h: "Подсказки", tips: ["Чем больше записей, тем точнее наблюдения.", "AI не выдумывает — берёт только реальные числа и факты из записей."] },
        ],
      },
      {
        key: "biographer", icon: "ti-messages", color: "var(--insight)", title: "AI-Биограф",
        short: "Спроси свою жизнь — AI ответит из всех твоих записей.",
        sections: [
          { p: "Биограф знает всё, что ты записал. Задай вопрос о себе — и получишь ответ, опирающийся на твою настоящую историю." },
          { h: "Как пользоваться", steps: ["Открой «Биограф» в меню (или спроси прямо в боте Telegram).", "Задай вопрос своими словами.", "Получи ответ со ссылками на даты и события."] },
          { h: "Примеры вопросов", examples: ["«Когда я был счастливее всего в этом году?»", "«Расскажи историю проекта LIFE OS».", "«Что влияло на моё здоровье?»", "«Как прошла моя неделя?»"] },
          { h: "Подсказки", tips: ["Спрашивать можно прямо в боте — он сам поймёт, вопрос это или запись.", "Чем конкретнее вопрос, тем точнее ответ."] },
        ],
      },
    ],
  },

  en: {
    whatsNew: "What's new",
    whatsNewLead: "We keep improving LIFE OS. Here's what shipped recently and what's coming.",
    thisMonth: "Shipped this month",
    upcoming: "Coming next",
    featuresTitle: "Features — in detail",
    featuresLead: "Tap any card to open a guide with steps, examples and tips.",
    open: "Details",
    close: "Close",
    stepsL: "How to use",
    examplesL: "Examples",
    tipsL: "Tips",
    badges: { new: "New", improved: "Improved", soon: "Soon" },
    changelog: [
      { t: "Your Book of Life is now truly yours", d: "Edit any chapter's text and add your own stories, hide and reorder chapters, clean up people and places (rename, merge duplicates, hide) and add photos from Visual Memory. The book page has a step-by-step “How to create your book” guide.", tag: "new" },
      { t: "Visual Memory", d: "Photos and documents (a receipt, warranty, a meaningful moment) → AI understands the meaning and saves them to a categorized archive. Send a photo to the bot or upload on the site and add a note by voice or text.", tag: "new" },
      { t: "Book of Life → “My life, [year]”", d: "The tab became a real chronicle book: year stats, contents, AI chapters, a “Whole life” autobiography mode, a reader and PDF export.", tag: "new" },
      { t: "Honest book fill", d: "The current-year book no longer claims it's “almost ready” mid-year: it shows how much is “filled” (material gathered) and “the year is X% lived” — the book keeps filling with you.", tag: "improved" },
      { t: "Life map without duplicates", d: "In “Life Intelligence” a tag and the matching category (#health and Health) now merge into one theme — no more repeats.", tag: "improved" },
      { t: "Places: dreams vs visits", d: "Countries you dream about no longer land in “Where I've been”. We read the entry's context to tell a trip from a wish.", tag: "improved" },
      { t: "Plans linked to the printed book", d: "From the “Plans” page you can now jump to ordering a real printed Book of Life — a one-time order, separate from the subscription.", tag: "improved" },
      { t: "Profile: clear security", d: "The “Security” section now honestly explains how your data is protected: only you see entries, people don't read them, only the AI processes the text for your own summaries. The duplicate home-accent setting was removed — it already lives on the home screen.", tag: "improved" },
      { t: "Book widget on the home screen", d: "See your book filling up in real time: readiness % and how many entries already became its pages.", tag: "new" },
      { t: "Dreams / Wish board", d: "A board of dreams by life area with photos or emoji and statuses Dreaming → In progress → Came true ✨. AI pulls dreams from your entries.", tag: "new" },
      { t: "“Life Intelligence” — fresh records", d: "Analytics now shows your current maximums (weight, distances, push-ups) with dates instead of getting stuck on old numbers.", tag: "improved" },
      { t: "New “Mindful” design", d: "A voice-first home with a big living microphone. Toggle it at the top of the home screen to compare with the classic view.", tag: "new" },
    ],
    features: [
      {
        key: "book", icon: "ti-book-2", color: "var(--accent)", title: "Book of Life",
        short: "Your life gathered into a book — to read, print and gift to loved ones.",
        sections: [
          { p: "LIFE OS gathers your entries, people, places and events into a beautiful chronicle book. Pick a year — or “Whole life” for an autobiography. A future legacy to give to parents, children and grandchildren." },
          { h: "How to use", steps: ["Open “Book of Life” in the menu.", "Pick a period at the top: a specific year or “Whole life”.", "Choose the book type and who it's for.", "Fill in the dedication and, if you like, the letters.", "In “Contents”, open chapters — AI writes them from your entries.", "Tap “Open the book” to read it all, then “Download / Print (PDF)”."] },
          { h: "Dedication examples", examples: ["“To my children — so you know the real me.”", "“To Mom and Dad — with gratitude for everything.”", "“To whoever reads this many years from now.”"] },
          { h: "Tips", tips: ["The more entries, the fuller the chapters — each shows readiness %.", "Voice notes in the bot are the fastest way to fill the book.", "You can rebuild the book anytime — AI refreshes chapters from new entries.", "Print and gift editions are coming; for now save a PDF and print anywhere."] },
        ],
      },
      {
        key: "capture", icon: "ti-microphone", color: "#ec4899", title: "Capture: voice & text",
        short: "The core action. Speak or type to the bot — AI does the rest.",
        sections: [
          { p: "No manual forms. Just tell it what happened — by voice or text — and AI sorts it into categories, tags, people, mood and tasks." },
          { h: "How to use", steps: ["Open the bot in Telegram.", "Record a voice note or write a few lines.", "AI transcribes and saves a structured entry.", "Made a mistake? Say “correct…” or “actually…” and it fixes the last entry."] },
          { h: "Examples", examples: ["“Ran 5 km today, feeling great.”", "“Met Andrew, discussed the LIFE OS project.”", "“Slept badly, mood so-so, but got a lot done.”"] },
          { h: "Tips", tips: ["Voice is faster: 30 seconds on the go = a full entry.", "Mention names and projects so AI builds your life map.", "A bad day is an entry too — those reveal what affects your mood."] },
        ],
      },
      {
        key: "home", icon: "ti-home", color: "var(--accent)", title: "Home & customization",
        short: "Your day on one screen. Build the home your way.",
        sections: [
          { p: "Home has quick capture, your streak 🔥, day metrics, good deeds, promises and the book widget. Three tabs: Today, Path, Legacy." },
          { h: "How to customize", steps: ["Tap “Customize” at the top of home.", "Pick a preset (Mindful, Focus, Kind trace, Balance, Minimal).", "Or build your own — toggle the blocks you want.", "Changes apply instantly."] },
          { h: "Tips", tips: ["Toggle the “My Book of Life” widget in home settings.", "The streak 🔥 matters more than length — write a little daily.", "You can record by voice on home too — the 🎤 button."] },
        ],
      },
      {
        key: "trace", icon: "ti-heart-handshake", color: "#ec4899", title: "My Trace",
        short: "The good you do and the promises you keep.",
        sections: [
          { p: "AI notices good deeds and promises to people in your entries and gathers them into a warm “trace” of the good you bring into the world." },
          { h: "How it works", steps: ["Just mention in entries what kind thing you did or what you promised.", "AI moves it into “My Trace”.", "Check off kept promises."] },
          { h: "Examples", examples: ["“Helped my neighbor carry her bags.”", "“Promised my son a trip to the park this weekend.”", "“Donated to charity.”"] },
          { h: "Tips", tips: ["A debt or payment is NOT a good deed — AI tells them apart.", "Check “Trace this week” weekly — it's motivating."] },
        ],
      },
      {
        key: "ai", icon: "ti-sparkles", color: "var(--insight)", title: "Life Intelligence · Lab",
        short: "Patterns of your life and an honest test of hypotheses.",
        sections: [
          { p: "“Life Intelligence” is one look at your whole life: what brings joy, what affects energy, chains and patterns. The “Lab” tests hypotheses with experiments." },
          { h: "How to use", steps: ["Open “Life Intelligence” for observations across all entries.", "Tap “Refresh” to rebuild.", "In the “Lab” pick a hypothesis and run an experiment.", "After the period you'll see an honest before/after."] },
          { h: "Hypothesis examples", examples: ["“Sleeping before 11pm raises my energy.”", "“Sport improves my mood.”", "“Less coffee, better sleep.”"] },
          { h: "Tips", tips: ["More entries → more accurate observations.", "AI doesn't make things up — only real numbers and facts from entries."] },
        ],
      },
      {
        key: "biographer", icon: "ti-messages", color: "var(--insight)", title: "AI Biographer",
        short: "Ask your life — AI answers from all your entries.",
        sections: [
          { p: "The Biographer knows everything you've written. Ask about yourself and get an answer grounded in your real history." },
          { h: "How to use", steps: ["Open “Biographer” in the menu (or ask right in the Telegram bot).", "Ask a question in your own words.", "Get an answer referencing dates and events."] },
          { h: "Example questions", examples: ["“When was I happiest this year?”", "“Tell the story of the LIFE OS project.”", "“What affected my health?”", "“How was my week?”"] },
          { h: "Tips", tips: ["You can ask right in the bot — it knows if it's a question or an entry.", "The more specific the question, the better the answer."] },
        ],
      },
    ],
  },

  // UK/FR наследуют контент (ru/en) ниже через guideExtras(); подписи разделов берём из ru/en.
  uk: {} as Extras,
  fr: {} as Extras,
};

// UK ≈ RU, FR ≈ EN (контент новых разделов; основной гид остаётся полностью переведённым в guide.ts).
E.uk = E.ru;
E.fr = E.en;

export function guideExtras(locale: Locale): Extras {
  return E[locale] || E.ru;
}

// Ожидаемые доработки (общий список, локализуется отдельно).
export function upcoming(locale: Locale): ChangeItem[] {
  const ru: ChangeItem[] = [
    { t: "Печать книги в типографии и доставка", d: "Заказ твёрдой обложки и подарочных версий прямо из приложения, с доставкой.", tag: "soon" },
    { t: "Оплата подписки", d: "Расширенные возможности и полная книга по подписке.", tag: "soon" },
    { t: "QR-коды в книге", d: "Сканируешь страницу — слышишь голос автора, записанный в тот период.", tag: "soon" },
    { t: "Поиск по смыслу", d: "Находить записи не по словам, а по смыслу.", tag: "soon" },
    { t: "Утреннее напоминание", d: "Мягкий пуш, чтобы не забыть записать день.", tag: "soon" },
    { t: "Семейная книга", d: "Общая летопись нескольких поколений.", tag: "soon" },
  ];
  const en: ChangeItem[] = [
    { t: "Print & delivery", d: "Order hardcover and gift editions right from the app, delivered to you.", tag: "soon" },
    { t: "Subscription", d: "Advanced features and the full book via subscription.", tag: "soon" },
    { t: "QR codes in the book", d: "Scan a page — hear the author's voice from that period.", tag: "soon" },
    { t: "Semantic search", d: "Find entries by meaning, not just words.", tag: "soon" },
    { t: "Morning reminder", d: "A gentle push so you don't forget to log your day.", tag: "soon" },
    { t: "Family book", d: "A shared chronicle across generations.", tag: "soon" },
  ];
  return locale === "en" || locale === "fr" ? en : ru;
}
