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
  showAll: string;
  collapse: string;
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
    showAll: "Показать все", collapse: "Свернуть",
    changelog: [
      { t: "Страница «О проекте» — наша история", d: "Появилась страница «О проекте»: зачем нужен LIFE OS, личная история основателя (зачем я это создаю — чтобы сохранить свой опыт и память для близких и следующих поколений), отзывы людей и честные гарантии безопасности. Главное — твои данные навсегда твои: их можно в один клик выгрузить в Markdown и Obsidian, и они останутся с тобой даже без интернета и без нашего сервиса. Открыть страницу можно в любой момент — нажми на логотип «LIFE OS» слева вверху.", tag: "new" },
      { t: "Помощник на каждой странице", d: "Внизу справа появилась кнопка-помощник. Открой её на любой странице — увидишь, что здесь можно сделать и куда пойти дальше, найдёшь нужный раздел по названию или спросишь у AI «как мне…», и он подскажет, куда нажать. А ещё прямо из помощника можно оставить пожелание — попросить доработку или синхронизацию с другим сервисом: я прочитаю это лично.", tag: "new" },
      { t: "Деньги: учёт доходов и расходов", d: "Новый раздел «Деньги»: записывай траты и доходы, выбирай категорию — и сразу видишь баланс месяца, доходы, расходы и куда уходят деньги (наглядные полоски по категориям). Можно листать по месяцам, задавать месячные бюджеты-лимиты по категориям (предупреждение при превышении) и вести учёт в нескольких валютах с пересчётом в основную. А ещё проще: скажи боту «потратил 500 на продукты» или «получил зарплату 50000» — AI сам внесёт операцию в учёт.", tag: "new" },
      { t: "Поделиться: карточки, публичная книга и пути", d: "Теперь можно делиться успехами наружу: красивые карточки достижений в Telegram/Instagram/WhatsApp, публикация отдельных записей (AI готовит публичную версию и прячет личное), публичная страница-витрина /p/имя и «Пути» — длинные истории с публичным таймлайном. Дневник остаётся приватным: публикуешь только вручную.", tag: "new" },
      { t: "Дневник стал календарём", d: "Вместо длинной ленты — календарь по месяцам и неделям: дни с записями подсвечены, выбираешь день и видишь только его записи. Так удобнее находить нужную дату.", tag: "new" },
      { t: "Книга жизни стала полностью твоей", d: "Теперь можно править текст любой главы и дописывать свои истории, прятать и переставлять главы, чистить людей и места (переименовать, объединить дубли, скрыть) и добавлять фото из «Визуальной памяти». На странице книги — пошаговая инструкция «Как создать свою книгу».", tag: "new" },
      { t: "Визуальная память", d: "Фото и документы (чек, гарантия, важный момент) → AI понимает смысл и сохраняет в архив с категориями. Можно прислать фото боту или загрузить на сайте и добавить заметку голосом или текстом.", tag: "new" },
      { t: "Книга жизни → «Моя жизнь, [год]»", d: "Вкладка превратилась в настоящую книгу-летопись: статистика года, оглавление, AI-главы, режим «Вся жизнь» (автобиография), ридер и экспорт в PDF.", tag: "new" },
      { t: "Честная наполненность книги", d: "Книга текущего года больше не показывает «почти готова» в середине года: видно «наполнено» (собранный материал) и «год прожит на X%» — книга дополняется вместе с тобой.", tag: "improved" },
      { t: "Карта жизни без дублей", d: "В «Что заметил AI» тег и одноимённая категория (#здоровье и Здоровье) теперь объединяются в одну тему — без повторов.", tag: "improved" },
      { t: "Места: мечты отдельно от поездок", d: "Страны, о которых ты мечтаешь, больше не попадают в «Где я был». По тексту записи понимаем: поездка это или мечта.", tag: "improved" },
      { t: "Тарифы и печатная книга связаны", d: "Со страницы «Тарифы» теперь есть переход к заказу настоящей печатной «Книги жизни» — это разовый заказ, отдельно от подписки.", tag: "improved" },
      { t: "Профиль: понятная безопасность", d: "В разделе «Безопасность» честно расписано, как защищены твои данные: записи видишь только ты, люди их не читают, текст обрабатывает лишь AI для твоих резюме. Дубль настройки главной убран — она и так на главной.", tag: "improved" },
      { t: "Аккуратные ссылки-приглашения", d: "Ссылка «Пригласить друга» стала короткой и понятной (вида …/i/ab3k9z) вместо длинного кода — не пугает и легко делиться. Старые ссылки тоже работают.", tag: "improved" },
      { t: "Инсайты: поиск и вид списком", d: "На вкладке «Инсайты» (Цели и задачи) появился поиск по тексту и переключатель «Блоки / Список» — когда инсайтов много, нужное находится быстро.", tag: "improved" },
      { t: "Экспорт в Obsidian", d: "В «Профиле» можно скачать весь дневник папкой Markdown-файлов и открыть в Obsidian: ежедневные заметки, люди и места связаны ссылками, есть граф. Данные становятся полностью твоими — храни у себя.", tag: "new" },
      { t: "Виджет книги на главной", d: "Сразу видно, как наполняется твоя книга за год: готовность в % и сколько записей уже стали её страницами.", tag: "new" },
      { t: "Мечты / Карта желаний", d: "Доска желаний по сферам жизни с фото или эмодзи и статусами Мечтаю → В процессе → Сбылось ✨. AI сам достаёт мечты из записей.", tag: "new" },
      { t: "«Что заметил AI» — свежие рекорды", d: "Аналитика показывает твои актуальные максимумы (вес, дистанции, отжимания) с датами, а не зависает на старых числах.", tag: "improved" },
      { t: "Новый дизайн «Осознанность»", d: "Голос-first главная с большим живым микрофоном. Включается тумблером вверху главной — можно сравнить с классическим.", tag: "new" },
    ],
    features: [
      {
        key: "finance", icon: "ti-wallet", color: "#10b981", title: "Деньги: доходы и расходы",
        short: "Простой и понятный учёт денег. Видно баланс месяца и на что уходят деньги.",
        sections: [
          { p: "Раздел «Деньги» помогает держать финансы под контролем без таблиц. Записывай доход или трату в одну форму, а приложение само считает баланс месяца и показывает расходы по категориям." },
          { h: "Как пользоваться", steps: [
            "Открой «Деньги» в меню (группа «Жизнь и цели»).",
            "Нажми «Добавить» → выбери Доход или Расход, впиши сумму, валюту, категорию и (если нужно) заметку.",
            "Сверху — баланс месяца, доходы и расходы; ниже — разбивка расходов по категориям и лента операций по дням.",
            "Листай месяцы стрелками ← →. Лишнюю операцию удали значком корзины.",
          ] },
          { h: "Через бота — само", examples: [
            "«Потратил 500 на продукты» → расход 500, категория «Продукты».",
            "«Купил кофе за 80 грн» → расход 80 ₴, «Кафе».",
            "«Получил зарплату 50000» → доход 50000, «Зарплата».",
          ] },
          { h: "Бюджеты и валюты", steps: [
            "Лимиты: у каждой категории расходов нажми на 🎯 и задай месячный лимит — полоска станет жёлтой ближе к пределу и красной при превышении. Сверху появится сводный «Бюджет на месяц».",
            "Несколько валют: нажми ⚙ вверху → выбери основную валюту и впиши курсы остальных к ней. Итоги (баланс, доходы, расходы, бюджеты) считаются в основной валюте, а каждая операция в списке остаётся в своей.",
          ] },
          { h: "Подсказки", tips: [
            "AI вносит операцию, только если в записи названа конкретная сумма.",
            "Поддерживается 10 валют ($ € ₴ ₽ £ zł ₸ ₾ ₺ AED) — символ или слово (грн/руб) распознаётся автоматически.",
            "Пока курсы не заданы, итоги по разным валютам считаются примерно — вверху появится подсказка.",
            "Все операции попадают в общий экспорт данных, а удаление записи убирает и связанные с ней траты.",
          ] },
        ],
      },
      {
        key: "social", icon: "ti-share-2", color: "#4f46e5", title: "Поделиться: карточки, книга и пути",
        short: "Делись успехами и веди публичную книгу жизни — приватность остаётся за тобой.",
        sections: [
          { p: "Дневник остаётся приватным. Но отдельные моменты, достижения и целые истории ты можешь по своему желанию показать другим. Делишься не «постами», а своим путём — тем, что может вдохновить или помочь." },
          { h: "Что можно сделать", steps: [
            "Карточка достижения: раздел «Поделиться» → собери красивую карточку (своё достижение, прогресс «было→стало», сбывшаяся мечта или мысль) → отправь в Telegram, Instagram или WhatsApp.",
            "Опубликовать запись: на экране любой записи нажми «Опубликовать» — AI подготовит публичную версию (перепишет по-человечески и спрячет личное), ты проверишь и поправишь.",
            "Публичная страница: в «Поделиться» включи свою витрину /p/имя — туда попадают опубликованные страницы и твои цифры. Скопируй ссылку и кидай людям.",
            "Пути: в «Мои пути» создай длинную историю («Восстановление здоровья», «Запуск дела») и публикуй записи в неё — получится публичный таймлайн твоего прогресса.",
          ] },
          { h: "Примеры", examples: ["Карточка: «Пробежал первый марафон 🏃».", "Прогресс: «Вес: было 65 → стало 61».", "Путь: «АИП, день 12» с лентой обновлений."] },
          { h: "Приватность", tips: [
            "По умолчанию НИЧЕГО не публикуется — только вручную и с предпросмотром.",
            "Перед публикацией AI прячет фамилии, телефоны, адреса, медицинские детали, имена детей и финансы — и показывает, что именно скрыл.",
            "Публичную страницу и любой путь можно в любой момент выключить, а запись — убрать из публичного.",
            "Каждый, кто открывает твою публичную книгу, видит кнопку «Завести свой дневник» — так ты приглашаешь людей.",
          ] },
        ],
      },
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
    showAll: "Show all", collapse: "Collapse",
    changelog: [
      { t: "About page — our story", d: "A new About page: why LIFE OS exists, the founder's personal story (why I'm building this — to preserve my experience and memory for loved ones and the next generations), people's testimonials and honest safety guarantees. The main thing — your data is yours forever: export it to Markdown and Obsidian in one click, and it stays with you even without internet or our service. Open it anytime — tap the “LIFE OS” logo at the top left.", tag: "new" },
      { t: "Helper on every page", d: "A helper button now sits at the bottom-right. Open it on any page to see what you can do here and where to go next, find a section by name, or ask the AI “how do I…” and it tells you where to tap. You can also send a wish right from the helper — ask for a feature or a sync with another service: I read it personally.", tag: "new" },
      { t: "Money: income & expense tracking", d: "A new “Money” section: log expenses and income, pick a category — and instantly see your monthly balance, income, expenses and where the money goes (clear per-category bars). Flip between months, set monthly category budgets (with an over-limit warning) and track several currencies converted into a base one. Even easier: tell the bot “spent 500 on groceries” or “got my salary 50000” and AI logs the transaction for you.", tag: "new" },
      { t: "Share: cards, public book & paths", d: "You can now share your wins outward: beautiful achievement cards to Telegram/Instagram/WhatsApp, publishing individual entries (AI prepares a public version and hides personal data), a public showcase page /p/name and “Paths” — long stories with a public timeline. Your diary stays private: you publish only manually.", tag: "new" },
      { t: "Diary is now a calendar", d: "Instead of an endless feed — a month/week calendar: days with entries are highlighted, pick a day to see just its entries. Easier to find a specific date.", tag: "new" },
      { t: "Your Book of Life is now truly yours", d: "Edit any chapter's text and add your own stories, hide and reorder chapters, clean up people and places (rename, merge duplicates, hide) and add photos from Visual Memory. The book page has a step-by-step “How to create your book” guide.", tag: "new" },
      { t: "Visual Memory", d: "Photos and documents (a receipt, warranty, a meaningful moment) → AI understands the meaning and saves them to a categorized archive. Send a photo to the bot or upload on the site and add a note by voice or text.", tag: "new" },
      { t: "Book of Life → “My life, [year]”", d: "The tab became a real chronicle book: year stats, contents, AI chapters, a “Whole life” autobiography mode, a reader and PDF export.", tag: "new" },
      { t: "Honest book fill", d: "The current-year book no longer claims it's “almost ready” mid-year: it shows how much is “filled” (material gathered) and “the year is X% lived” — the book keeps filling with you.", tag: "improved" },
      { t: "Life map without duplicates", d: "In “Life Intelligence” a tag and the matching category (#health and Health) now merge into one theme — no more repeats.", tag: "improved" },
      { t: "Places: dreams vs visits", d: "Countries you dream about no longer land in “Where I've been”. We read the entry's context to tell a trip from a wish.", tag: "improved" },
      { t: "Plans linked to the printed book", d: "From the “Plans” page you can now jump to ordering a real printed Book of Life — a one-time order, separate from the subscription.", tag: "improved" },
      { t: "Profile: clear security", d: "The “Security” section now honestly explains how your data is protected: only you see entries, people don't read them, only the AI processes the text for your own summaries. The duplicate home-accent setting was removed — it already lives on the home screen.", tag: "improved" },
      { t: "Tidy invite links", d: "The “Invite a friend” link is now short and friendly (like …/i/ab3k9z) instead of a long code — easy to share, less scary. Old links still work.", tag: "improved" },
      { t: "Insights: search & list view", d: "The Insights tab (Goals & tasks) now has text search and a Cards/List toggle — find what you need fast when there are many.", tag: "improved" },
      { t: "Export to Obsidian", d: "In Profile you can download your whole diary as a folder of Markdown files and open it in Obsidian: daily notes, people and places linked, with a graph. Your data becomes fully yours — keep it on your own device.", tag: "new" },
      { t: "Book widget on the home screen", d: "See your book filling up in real time: readiness % and how many entries already became its pages.", tag: "new" },
      { t: "Dreams / Wish board", d: "A board of dreams by life area with photos or emoji and statuses Dreaming → In progress → Came true ✨. AI pulls dreams from your entries.", tag: "new" },
      { t: "“Life Intelligence” — fresh records", d: "Analytics now shows your current maximums (weight, distances, push-ups) with dates instead of getting stuck on old numbers.", tag: "improved" },
      { t: "New “Mindful” design", d: "A voice-first home with a big living microphone. Toggle it at the top of the home screen to compare with the classic view.", tag: "new" },
    ],
    features: [
      {
        key: "finance", icon: "ti-wallet", color: "#10b981", title: "Money: income & expenses",
        short: "Simple, clear money tracking. See your monthly balance and where money goes.",
        sections: [
          { p: "The “Money” section keeps your finances in check without spreadsheets. Log income or an expense in one form, and the app computes your monthly balance and shows spending by category." },
          { h: "How to use", steps: [
            "Open “Money” in the menu (the “Life & goals” group).",
            "Tap “Add” → choose Income or Expense, enter the amount, currency, category and an optional note.",
            "Up top — monthly balance, income and expenses; below — a per-category breakdown and a day-by-day transaction list.",
            "Flip months with the ← → arrows. Remove a transaction with the trash icon.",
          ] },
          { h: "Via the bot — automatic", examples: [
            "“Spent 500 on groceries” → expense 500, “Groceries”.",
            "“Bought coffee for 80” → expense 80, “Eating out”.",
            "“Got my salary 50000” → income 50000, “Salary”.",
          ] },
          { h: "Budgets & currencies", steps: [
            "Limits: on any expense category tap 🎯 and set a monthly limit — the bar turns amber near the limit and red once exceeded. A combined “Monthly budget” appears on top.",
            "Multiple currencies: tap ⚙ on top → pick a base currency and enter rates for the others. Totals (balance, income, expenses, budgets) are computed in the base currency, while each transaction keeps its own.",
          ] },
          { h: "Tips", tips: [
            "AI logs a transaction only when a concrete amount is mentioned.",
            "10 currencies supported ($ € ₴ ₽ £ zł ₸ ₾ ₺ AED) — a symbol or word is recognized automatically.",
            "Until rates are set, totals across currencies are approximate — a hint shows up on top.",
            "Every transaction is included in your data export, and deleting an entry also removes its linked spending.",
          ] },
        ],
      },
      {
        key: "social", icon: "ti-share-2", color: "#4f46e5", title: "Share: cards, book & paths",
        short: "Share your wins and keep a public book of life — privacy stays yours.",
        sections: [
          { p: "Your diary stays private. But you can choose to show individual moments, achievements and whole stories to others. You share a path, not “posts” — something that can inspire or help." },
          { h: "What you can do", steps: [
            "Achievement card: the “Share” section → build a beautiful card (a win, a “before→after” progress, a dream come true or a thought) → send to Telegram, Instagram or WhatsApp.",
            "Publish an entry: on any entry tap “Publish” — AI prepares a public version (rewrites it warmly and hides personal data); you review and tweak.",
            "Public page: in “Share” turn on your showcase /p/name — published pages and your numbers appear there. Copy the link and send it to people.",
            "Paths: in “My paths” create a long story (“Restoring health”, “Launching a venture”) and publish entries into it — a public timeline of your progress.",
          ] },
          { h: "Examples", examples: ["Card: “Ran my first marathon 🏃”.", "Progress: “Weight: 65 → 61”.", "Path: “AIP, day 12” with a feed of updates."] },
          { h: "Privacy", tips: [
            "By default NOTHING is published — only manually and with a preview.",
            "Before publishing, AI hides surnames, phones, addresses, medical details, kids' names and finances — and shows you what it hid.",
            "You can turn off your public page or any path, or unpublish an entry, anytime.",
            "Everyone who opens your public book sees a “Start your own diary” button — that's how you invite people.",
          ] },
        ],
      },
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
