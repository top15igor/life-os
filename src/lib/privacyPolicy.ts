// Формальная (юридическая) политика конфиденциальности — отдельно от дружелюбной
// страницы «Приватность» (/privacy, src/lib/privacy.ts). Этот текст даём Apple App Store,
// Google OAuth-верификации и любому, кто спросит документ.
// Правило: если меняется состав данных или список подрядчиков — правим здесь и двигаем UPDATED.

export type PolicyBlock = { p: string } | { ul: string[] };
export type PolicySection = { h: string; blocks: PolicyBlock[] };
export type PolicyContent = {
  title: string;
  updated: string;
  intro: string;
  friendly: string; // ссылка на человеческую версию
  termsLink: string; // ссылка на условия использования
  sections: PolicySection[];
  back: string;
};

export const POLICY_EMAIL = "top15igor@gmail.com";
export const POLICY_OWNER_EN = "Igor Kholodinsky";
// Дата вступления в силу. Меняем при существенных правках текста.
export const POLICY_UPDATED_ISO = "2026-07-29";

const P: Record<string, PolicyContent> = {
  ru: {
    title: "Политика конфиденциальности",
    updated: "Действует с 29 июля 2026 года",
    friendly: "Короткая человеческая версия",
    termsLink: "Условия использования",
    intro:
      "Этот документ описывает, какие персональные данные обрабатывает LIFE OS (сайт life-os.today, бот в Telegram и мобильное приложение), зачем, на каком основании и какие у тебя есть права.",
    sections: [
      {
        h: "1. Кто обрабатывает данные",
        blocks: [
          { p: "Сервисом LIFE OS управляет Игорь Холодинский — частный разработчик (физическое лицо). Он же является владельцем сервиса и оператором (контролёром) персональных данных." },
          { p: `Связаться по любому вопросу о данных: ${POLICY_EMAIL} или прямо в боте LIFE OS в Telegram. Мы отвечаем на обращения не дольше 30 дней.` },
        ],
      },
      {
        h: "2. Какие данные мы обрабатываем",
        blocks: [
          { p: "Мы собираем только то, что нужно для работы сервиса. Профиль для рекламы мы не строим." },
          {
            ul: [
              "Данные аккаунта: идентификатор и @username в Telegram, имя из Telegram; e-mail и хеш пароля (если вход по почте); e-mail и имя из Google-аккаунта (если вход через Google); хеш PIN-кода, персональный токен ссылки для входа, часовой пояс, язык интерфейса, тариф.",
              "Содержимое, которое ты создаёшь: записи дневника и заметки, голосовые сообщения и их расшифровки, фотографии и файлы, задачи, напоминания, обещания, цели и проекты, списки и желания, книги и цитаты, поездки, сны, настроение, а также люди и места, которых ты упоминаешь.",
              "Финансовые записи: суммы, валюты, категории и описания операций, которые ты вносишь сам или импортируешь из банка при подключении. Мы не получаем доступ к твоим счетам, не видим реквизиты карт и не можем совершать операции.",
              "Данные о здоровье и самочувствии: вес, сон, шаги, пульс, настроение — если ты вносишь их сам или подключаешь Apple Health либо Google Health (Fitbit).",
              "Техническая информация: cookies сервиса, дата и время обращений, служебные логи ошибок, счётчик обращений к AI, метка канала перехода и реферальный код.",
            ],
          },
        ],
      },
      {
        h: "3. Зачем и на каком основании",
        blocks: [
          {
            ul: [
              "Чтобы предоставить сервис — сохранить твои записи, показать их тебе, прислать напоминание, сделать резюме и подсказки. Основание: исполнение договора с тобой.",
              "Чтобы обеспечить безопасность аккаунта, предотвратить злоупотребления и починить сбои. Основание: наш законный интерес.",
              "Чтобы обрабатывать данные о здоровье, самочувствии и другую чувствительную информацию из дневника, в том числе с помощью AI. Основание: твоё явное согласие, которое ты даёшь, когда сам вносишь эти данные или подключаешь интеграцию. Согласие можно отозвать в любой момент.",
              "Чтобы улучшать продукт — по обезличенной статистике (сколько записей, какие разделы используются), без чтения текста.",
              "Чтобы выполнить закон, если поступит законный запрос уполномоченного органа.",
            ],
          },
        ],
      },
      {
        h: "4. Кому мы передаём данные",
        blocks: [
          { p: "Мы не продаём данные, не передаём их рекламным сетям и брокерам данных и не используем для показа рекламы. Данные получают только подрядчики (обработчики), без которых сервис не работает, и только в нужном объёме:" },
          {
            ul: [
              "Supabase — база данных и хранилище файлов.",
              "Vercel — хостинг сайта и серверных функций.",
              "Telegram — доставка сообщений бота: переписка с ботом проходит через инфраструктуру Telegram.",
              "Anthropic (Claude) — разбор и анализ текста записей, ответы AI-друга.",
              "OpenAI — расшифровка голосовых сообщений, голосовые ответы и голосовой режим.",
              "Google — вход через Google-аккаунт, а также Google Календарь и Google Health (Fitbit): только если ты сам подключишь эти интеграции.",
              "Monobank и A-Bank — импорт твоих операций, только если ты сам подключишь банк своим токеном.",
              "Google Maps, TMDB, сервисы импорта из Instagram и YouTube — обрабатывают только конкретный запрос: адрес, название фильма, присланную тобой ссылку.",
            ],
          },
          { p: "По условиям API Anthropic и OpenAI переданные данные не используются для обучения их моделей." },
          { p: "Кроме подрядчиков, данные могут увидеть только те люди, которым ты сам их открыл: тот, кому ты дал публичную ссылку, назначенный тобой наследник, адресат передачи сообщения." },
        ],
      },
      {
        h: "5. Где хранятся данные",
        blocks: [
          { p: "Серверы наших подрядчиков расположены в Европейском союзе и США. Передача данных за пределы страны твоего проживания происходит на основании стандартных договорных условий (SCC) и иных механизмов, предусмотренных этими подрядчиками." },
        ],
      },
      {
        h: "6. Что становится публичным",
        blocks: [
          { p: "По умолчанию всё, что ты записываешь, видно только тебе. Публичным что-либо становится, только если ты сам это включишь:" },
          {
            ul: [
              "публичная страница книги жизни, вишлист, библиотека книг, публичный путь — по ссылке вида life-os.today/p/<имя>;",
              "отдельные записи, которые ты решил опубликовать;",
              "данные, которые увидит назначенный тобой наследник — по правилам, которые ты сам задал.",
            ],
          },
          { p: "Любую публикацию можно выключить в настройках, после чего страница перестаёт открываться. Копии, которые кто-то успел сохранить, и кэш поисковых систем мы контролировать не можем." },
        ],
      },
      {
        h: "7. Сколько мы храним",
        blocks: [
          {
            ul: [
              "Содержимое аккаунта — пока существует аккаунт: дневник имеет смысл, только если хранится годами.",
              "После удаления аккаунта данные стираются из рабочей базы и хранилища сразу и безвозвратно; из резервных копий они исчезают в течение 30 дней.",
              "Служебные логи — до 90 дней.",
            ],
          },
        ],
      },
      {
        h: "8. Твои права",
        blocks: [
          { p: "Если к тебе применяется GDPR (ЕС/ЕЭЗ, Великобритания) или закон Украины «О защите персональных данных», у тебя есть право:" },
          {
            ul: [
              "получить копию своих данных и информацию об их обработке;",
              "исправить неточные данные;",
              "удалить данные («право быть забытым»);",
              "ограничить обработку или возразить против неё;",
              "перенести данные в другой сервис в машиночитаемом виде;",
              "отозвать согласие в любой момент — это не отменяет законность обработки до отзыва;",
              "подать жалобу в надзорный орган по защите данных своей страны.",
            ],
          },
          { p: "Плата за реализацию этих прав не взимается." },
        ],
      },
      {
        h: "9. Как воспользоваться правами прямо сейчас",
        blocks: [
          {
            ul: [
              "Скачать всё: «Профиль → Твои данные → Скачать все мои данные» — один файл со всем содержимым аккаунта, читаемый без нашего приложения.",
              "Удалить аккаунт: там же, блок «Право уйти» — одна кнопка стирает аккаунт целиком, включая фотографии и голосовые в хранилище. Писать в поддержку и ждать не нужно.",
              "Исправить или ограничить: правь и удаляй записи прямо в приложении либо напиши нам.",
              "Отключить интеграции и уведомления: «Профиль → Интеграции» и настройки уведомлений.",
            ],
          },
        ],
      },
      {
        h: "10. Безопасность",
        blocks: [
          {
            ul: [
              "Передача — по защищённому каналу (HTTPS/TLS), хранение — в зашифрованном виде на стороне подрядчиков.",
              "Доступ разделён на уровне базы (row-level security): запрос одного пользователя не достаёт до чужих строк.",
              "Вход по личной ссылке из бота: ссылка живёт ограниченное время и обновляется при каждом запросе; дополнительно можно поставить PIN-код.",
              "Доступ разработчика к рабочей базе используется только для поддержки, диагностики и по твоему обращению.",
              "Код сервиса открыт — любой может проверить, что именно происходит с данными.",
            ],
          },
          { p: "Сервис не обеспечивает end-to-end шифрования, при котором мы физически не смогли бы прочитать содержимое: тогда AI не смог бы работать с записями. Учитывай это, решая, что доверить дневнику." },
        ],
      },
      {
        h: "11. Cookies",
        blocks: [
          { p: "Мы используем только строго необходимые cookies: токен входа (lifeos_token), признак снятия PIN-блокировки (lifeos_unlocked), выбранный язык (locale) и тему оформления. Рекламных и трекинговых cookies, сторонних счётчиков аналитики и пикселей на сайте нет." },
        ],
      },
      {
        h: "12. Дети",
        blocks: [
          { p: "Сервис не предназначен для детей младше 16 лет, и мы сознательно не собираем их данные. Если такие данные всё же попали к нам, напиши — мы удалим аккаунт." },
        ],
      },
      {
        h: "13. Автоматизированные решения",
        blocks: [
          { p: "AI помогает разобрать и структурировать записи, но не принимает юридически значимых решений о тебе. Подсказки AI носят информационный характер и не являются медицинской, юридической или финансовой консультацией." },
        ],
      },
      {
        h: "14. Изменения политики",
        blocks: [
          { p: "Если политика существенно изменится, мы сообщим об этом в боте или на сайте до вступления изменений в силу. Дата последнего обновления указана вверху страницы." },
        ],
      },
      {
        h: "15. Контакты",
        blocks: [
          { p: `Вопросы, запросы по правам и жалобы: ${POLICY_EMAIL}. Также можно написать прямо в бот LIFE OS в Telegram.` },
        ],
      },
    ],
    back: "На страницу «Приватность»",
  },

  en: {
    title: "Privacy Policy",
    updated: "Effective from 29 July 2026",
    friendly: "Short human-readable version",
    termsLink: "Terms of Service",
    intro:
      "This document explains what personal data LIFE OS (the life-os.today website, the Telegram bot and the mobile app) processes, why, on what legal basis, and what rights you have.",
    sections: [
      {
        h: "1. Who processes your data",
        blocks: [
          { p: `LIFE OS is operated by ${POLICY_OWNER_EN}, an individual independent developer, who is also the owner of the service and the data controller.` },
          { p: `For any data-related question: ${POLICY_EMAIL} or the LIFE OS bot in Telegram. We reply to requests within 30 days at most.` },
        ],
      },
      {
        h: "2. What data we process",
        blocks: [
          { p: "We collect only what the service needs to work. We do not build an advertising profile." },
          {
            ul: [
              "Account data: your Telegram ID, @username and name; e-mail and a password hash (if you sign in by e-mail); e-mail and name from your Google account (if you sign in with Google); a PIN hash, the personal sign-in link token, time zone, interface language, plan.",
              "Content you create: diary entries and notes, voice messages and their transcripts, photos and files, tasks, reminders, promises, goals and projects, lists and wishes, books and quotes, trips, dreams, mood, and the people and places you mention.",
              "Financial records: amounts, currencies, categories and descriptions of transactions you enter yourself or import from your bank if you connect one. We get no access to your accounts, never see card details and cannot make any payment.",
              "Health and wellbeing data: weight, sleep, steps, heart rate, mood — if you enter them yourself or connect Apple Health or Google Health (Fitbit).",
              "Technical information: service cookies, date and time of requests, error logs, an AI usage counter, the acquisition-channel tag and referral code.",
            ],
          },
        ],
      },
      {
        h: "3. Why and on what legal basis",
        blocks: [
          {
            ul: [
              "To provide the service — store your entries, show them to you, send reminders, produce summaries and insights. Basis: performance of our contract with you.",
              "To keep your account secure, prevent abuse and fix failures. Basis: our legitimate interest.",
              "To process health, wellbeing and other sensitive information from your diary, including with AI. Basis: your explicit consent, given when you enter such data or connect an integration. You can withdraw consent at any time.",
              "To improve the product — using anonymous statistics (how many entries, which sections are used), without reading the text.",
              "To comply with the law if we receive a lawful request from a competent authority.",
            ],
          },
        ],
      },
      {
        h: "4. Who we share data with",
        blocks: [
          { p: "We do not sell your data, do not pass it to ad networks or data brokers, and do not use it to show ads. Data is shared only with processors the service cannot run without, and only to the extent needed:" },
          {
            ul: [
              "Supabase — database and file storage.",
              "Vercel — hosting for the website and server functions.",
              "Telegram — delivery of bot messages: your conversation with the bot travels through Telegram's infrastructure.",
              "Anthropic (Claude) — parsing and analysing entry text, AI friend replies.",
              "OpenAI — voice message transcription, spoken replies and voice mode.",
              "Google — sign-in with Google, plus Google Calendar and Google Health (Fitbit): only if you connect those integrations yourself.",
              "Monobank and A-Bank — importing your transactions, only if you connect your bank with your own token.",
              "Google Maps, TMDB, Instagram and YouTube import services — they handle only the specific request: an address, a film title, a link you sent.",
            ],
          },
          { p: "Under the Anthropic and OpenAI API terms, data sent to them is not used to train their models." },
          { p: "Apart from processors, your data can be seen only by the people you opened it to yourself: whoever you gave a public link, an heir you designated, the recipient of a relayed message." },
        ],
      },
      {
        h: "5. Where data is stored",
        blocks: [
          { p: "Our processors' servers are located in the European Union and the United States. Transfers outside your country of residence rely on Standard Contractual Clauses (SCC) and other mechanisms provided by those processors." },
        ],
      },
      {
        h: "6. What becomes public",
        blocks: [
          { p: "By default everything you write is visible only to you. Something becomes public only if you turn it on yourself:" },
          {
            ul: [
              "a public Book of Life page, wishlist, book library or public path — at a link like life-os.today/p/<name>;",
              "individual entries you chose to publish;",
              "data an heir you designated will see — under the rules you set yourself.",
            ],
          },
          { p: "Any publication can be switched off in settings, after which the page stops opening. Copies someone already saved and search-engine caches are beyond our control." },
        ],
      },
      {
        h: "7. How long we keep data",
        blocks: [
          {
            ul: [
              "Account content — for as long as the account exists: a diary only makes sense if it is kept for years.",
              "After you delete your account, data is erased from the live database and storage immediately and permanently; it disappears from backups within 30 days.",
              "Service logs — up to 90 days.",
            ],
          },
        ],
      },
      {
        h: "8. Your rights",
        blocks: [
          { p: "If the GDPR (EU/EEA, UK) or the Ukrainian Personal Data Protection Act applies to you, you have the right to:" },
          {
            ul: [
              "obtain a copy of your data and information about its processing;",
              "correct inaccurate data;",
              "erase your data (the “right to be forgotten”);",
              "restrict processing or object to it;",
              "port your data to another service in a machine-readable form;",
              "withdraw consent at any time — this does not affect the lawfulness of processing before withdrawal;",
              "lodge a complaint with the data protection authority in your country.",
            ],
          },
          { p: "Exercising these rights is free of charge." },
        ],
      },
      {
        h: "9. How to exercise your rights right now",
        blocks: [
          {
            ul: [
              "Download everything: “Profile → Your data → Download all my data” — a single file with all account content, readable without our app.",
              "Delete your account: same page, the “Right to leave” block — one button erases the whole account, including photos and voice messages in storage. No support e-mails, no waiting.",
              "Correct or restrict: edit and delete entries right in the app, or write to us.",
              "Turn integrations and notifications off: “Profile → Integrations” and notification settings.",
            ],
          },
        ],
      },
      {
        h: "10. Security",
        blocks: [
          {
            ul: [
              "Data travels over a secure channel (HTTPS/TLS) and is stored encrypted on our processors' side.",
              "Access is separated at the database level (row-level security): one user's query cannot reach another user's rows.",
              "Sign-in uses a personal link from the bot: the link has a limited lifetime and is rotated on every request; you can also set a PIN.",
              "The developer's access to the production database is used only for support, diagnostics and when you ask for help.",
              "The service code is open — anyone can verify what actually happens with the data.",
            ],
          },
          { p: "The service does not provide end-to-end encryption where we would physically be unable to read the content: AI could not work with your entries then. Please keep that in mind when deciding what to trust to the diary." },
        ],
      },
      {
        h: "11. Cookies",
        blocks: [
          { p: "We use strictly necessary cookies only: the sign-in token (lifeos_token), the PIN-unlocked flag (lifeos_unlocked), your language (locale) and the theme. There are no advertising or tracking cookies, third-party analytics counters or pixels on the site." },
        ],
      },
      {
        h: "12. Children",
        blocks: [
          { p: "The service is not intended for children under 16 and we do not knowingly collect their data. If such data has reached us, write to us and we will delete the account." },
        ],
      },
      {
        h: "13. Automated decisions",
        blocks: [
          { p: "AI helps parse and structure your entries but makes no decisions about you with legal effect. AI suggestions are informational and are not medical, legal or financial advice." },
        ],
      },
      {
        h: "14. Changes to this policy",
        blocks: [
          { p: "If the policy changes materially, we will announce it in the bot or on the site before the changes take effect. The last update date is shown at the top of this page." },
        ],
      },
      {
        h: "15. Contact",
        blocks: [
          { p: `Questions, rights requests and complaints: ${POLICY_EMAIL}. You can also write straight to the LIFE OS bot in Telegram.` },
        ],
      },
    ],
    back: "Back to Privacy",
  },

  uk: {
    title: "Політика конфіденційності",
    updated: "Діє з 29 липня 2026 року",
    friendly: "Коротка людяна версія",
    termsLink: "Умови використання",
    intro:
      "Цей документ пояснює, які персональні дані обробляє LIFE OS (сайт life-os.today, бот у Telegram і мобільний застосунок), навіщо, на якій підставі та які права ти маєш.",
    sections: [
      {
        h: "1. Хто обробляє дані",
        blocks: [
          { p: "Сервісом LIFE OS керує Ігор Холодинський — приватний розробник (фізична особа). Він же власник сервісу та оператор (контролер) персональних даних." },
          { p: `Звернутися з будь-яким питанням щодо даних: ${POLICY_EMAIL} або прямо в боті LIFE OS у Telegram. Ми відповідаємо на звернення не довше ніж за 30 днів.` },
        ],
      },
      {
        h: "2. Які дані ми обробляємо",
        blocks: [
          { p: "Ми збираємо лише те, що потрібно для роботи сервісу. Профіль для реклами ми не будуємо." },
          {
            ul: [
              "Дані акаунта: ідентифікатор і @username у Telegram, ім'я з Telegram; e-mail і хеш пароля (якщо вхід поштою); e-mail та ім'я з Google-акаунта (якщо вхід через Google); хеш PIN-коду, персональний токен посилання для входу, часовий пояс, мова інтерфейсу, тариф.",
              "Вміст, який ти створюєш: записи щоденника й нотатки, голосові повідомлення та їхні розшифровки, фотографії та файли, задачі, нагадування, обіцянки, цілі й проєкти, списки та бажання, книжки й цитати, подорожі, сни, настрій, а також люди й місця, яких ти згадуєш.",
              "Фінансові записи: суми, валюти, категорії та описи операцій, які ти вносиш сам або імпортуєш із банку при підключенні. Ми не отримуємо доступу до твоїх рахунків, не бачимо реквізитів карток і не можемо здійснювати операції.",
              "Дані про здоров'я та самопочуття: вага, сон, кроки, пульс, настрій — якщо ти вносиш їх сам або підключаєш Apple Health чи Google Health (Fitbit).",
              "Технічна інформація: cookies сервісу, дата й час звернень, службові логи помилок, лічильник звернень до AI, мітка каналу переходу та реферальний код.",
            ],
          },
        ],
      },
      {
        h: "3. Навіщо і на якій підставі",
        blocks: [
          {
            ul: [
              "Щоб надати сервіс — зберегти твої записи, показати їх тобі, надіслати нагадування, зробити резюме та підказки. Підстава: виконання договору з тобою.",
              "Щоб забезпечити безпеку акаунта, запобігти зловживанням і полагодити збої. Підстава: наш законний інтерес.",
              "Щоб обробляти дані про здоров'я, самопочуття та іншу чутливу інформацію зі щоденника, зокрема за допомогою AI. Підстава: твоя явна згода, яку ти даєш, коли сам вносиш ці дані або підключаєш інтеграцію. Згоду можна відкликати будь-коли.",
              "Щоб покращувати продукт — за знеособленою статистикою (скільки записів, які розділи використовуються), без читання тексту.",
              "Щоб виконати закон, якщо надійде законний запит уповноваженого органу.",
            ],
          },
        ],
      },
      {
        h: "4. Кому ми передаємо дані",
        blocks: [
          { p: "Ми не продаємо дані, не передаємо їх рекламним мережам і брокерам даних та не використовуємо для показу реклами. Дані отримують лише підрядники (обробники), без яких сервіс не працює, і лише в потрібному обсязі:" },
          {
            ul: [
              "Supabase — база даних і сховище файлів.",
              "Vercel — хостинг сайту та серверних функцій.",
              "Telegram — доставка повідомлень бота: листування з ботом проходить через інфраструктуру Telegram.",
              "Anthropic (Claude) — розбір і аналіз тексту записів, відповіді AI-друга.",
              "OpenAI — розшифровка голосових повідомлень, голосові відповіді та голосовий режим.",
              "Google — вхід через Google-акаунт, а також Google Календар і Google Health (Fitbit): лише якщо ти сам підключиш ці інтеграції.",
              "Monobank та A-Bank — імпорт твоїх операцій, лише якщо ти сам підключиш банк своїм токеном.",
              "Google Maps, TMDB, сервіси імпорту з Instagram і YouTube — обробляють тільки конкретний запит: адресу, назву фільму, надіслане тобою посилання.",
            ],
          },
          { p: "За умовами API Anthropic та OpenAI передані дані не використовуються для навчання їхніх моделей." },
          { p: "Крім підрядників, дані можуть побачити лише ті люди, яким ти сам їх відкрив: той, кому ти дав публічне посилання, призначений тобою спадкоємець, адресат передачі повідомлення." },
        ],
      },
      {
        h: "5. Де зберігаються дані",
        blocks: [
          { p: "Сервери наших підрядників розташовані в Європейському Союзі та США. Передача даних за межі країни твого проживання відбувається на підставі стандартних договірних умов (SCC) та інших механізмів, передбачених цими підрядниками." },
        ],
      },
      {
        h: "6. Що стає публічним",
        blocks: [
          { p: "За замовчуванням усе, що ти записуєш, бачиш лише ти. Публічним щось стає, тільки якщо ти сам це увімкнеш:" },
          {
            ul: [
              "публічна сторінка книги життя, вішліст, бібліотека книжок, публічний шлях — за посиланням виду life-os.today/p/<ім'я>;",
              "окремі записи, які ти вирішив опублікувати;",
              "дані, які побачить призначений тобою спадкоємець — за правилами, які ти сам задав.",
            ],
          },
          { p: "Будь-яку публікацію можна вимкнути в налаштуваннях, після чого сторінка перестає відкриватися. Копії, які хтось встиг зберегти, і кеш пошукових систем ми контролювати не можемо." },
        ],
      },
      {
        h: "7. Скільки ми зберігаємо",
        blocks: [
          {
            ul: [
              "Вміст акаунта — доки існує акаунт: щоденник має сенс, лише якщо зберігається роками.",
              "Після видалення акаунта дані стираються з робочої бази та сховища одразу й безповоротно; з резервних копій вони зникають протягом 30 днів.",
              "Службові логи — до 90 днів.",
            ],
          },
        ],
      },
      {
        h: "8. Твої права",
        blocks: [
          { p: "Якщо до тебе застосовується GDPR (ЄС/ЄЕЗ, Велика Британія) або Закон України «Про захист персональних даних», ти маєш право:" },
          {
            ul: [
              "отримати копію своїх даних та інформацію про їх обробку;",
              "виправити неточні дані;",
              "видалити дані («право бути забутим»);",
              "обмежити обробку або заперечити проти неї;",
              "перенести дані до іншого сервісу в машиночитаному вигляді;",
              "відкликати згоду будь-коли — це не скасовує законність обробки до відкликання;",
              "подати скаргу до наглядового органу із захисту даних своєї країни.",
            ],
          },
          { p: "Плата за реалізацію цих прав не стягується." },
        ],
      },
      {
        h: "9. Як скористатися правами просто зараз",
        blocks: [
          {
            ul: [
              "Завантажити все: «Профіль → Твої дані → Завантажити всі мої дані» — один файл з усім вмістом акаунта, читабельний без нашого застосунку.",
              "Видалити акаунт: там само, блок «Право піти» — одна кнопка стирає акаунт повністю, разом із фотографіями та голосовими у сховищі. Писати в підтримку й чекати не потрібно.",
              "Виправити або обмежити: редагуй і видаляй записи прямо в застосунку або напиши нам.",
              "Вимкнути інтеграції та сповіщення: «Профіль → Інтеграції» і налаштування сповіщень.",
            ],
          },
        ],
      },
      {
        h: "10. Безпека",
        blocks: [
          {
            ul: [
              "Передача — захищеним каналом (HTTPS/TLS), зберігання — у зашифрованому вигляді на боці підрядників.",
              "Доступ розділено на рівні бази (row-level security): запит одного користувача не дістає до чужих рядків.",
              "Вхід за особистим посиланням із бота: посилання живе обмежений час і оновлюється щоразу; додатково можна поставити PIN-код.",
              "Доступ розробника до робочої бази використовується лише для підтримки, діагностики та за твоїм зверненням.",
              "Код сервісу відкритий — будь-хто може перевірити, що саме відбувається з даними.",
            ],
          },
          { p: "Сервіс не забезпечує end-to-end шифрування, за якого ми фізично не змогли б прочитати вміст: тоді AI не зміг би працювати із записами. Врахуй це, вирішуючи, що довірити щоденнику." },
        ],
      },
      {
        h: "11. Cookies",
        blocks: [
          { p: "Ми використовуємо лише строго необхідні cookies: токен входу (lifeos_token), ознаку зняття PIN-блокування (lifeos_unlocked), обрану мову (locale) і тему оформлення. Рекламних і трекінгових cookies, сторонніх лічильників аналітики та пікселів на сайті немає." },
        ],
      },
      {
        h: "12. Діти",
        blocks: [
          { p: "Сервіс не призначений для дітей молодших за 16 років, і ми свідомо не збираємо їхні дані. Якщо такі дані все ж потрапили до нас, напиши — ми видалимо акаунт." },
        ],
      },
      {
        h: "13. Автоматизовані рішення",
        blocks: [
          { p: "AI допомагає розібрати та структурувати записи, але не ухвалює юридично значущих рішень щодо тебе. Підказки AI мають інформаційний характер і не є медичною, юридичною чи фінансовою консультацією." },
        ],
      },
      {
        h: "14. Зміни політики",
        blocks: [
          { p: "Якщо політика суттєво зміниться, ми повідомимо про це в боті або на сайті до набуття змінами чинності. Дата останнього оновлення вказана вгорі сторінки." },
        ],
      },
      {
        h: "15. Контакти",
        blocks: [
          { p: `Питання, запити щодо прав і скарги: ${POLICY_EMAIL}. Також можна написати прямо в бот LIFE OS у Telegram.` },
        ],
      },
    ],
    back: "На сторінку «Приватність»",
  },

  fr: {
    title: "Politique de confidentialité",
    updated: "En vigueur depuis le 29 juillet 2026",
    friendly: "Version courte et lisible",
    termsLink: "Conditions d'utilisation",
    intro:
      "Ce document explique quelles données personnelles LIFE OS (le site life-os.today, le bot Telegram et l'application mobile) traite, dans quel but, sur quelle base légale, et quels sont tes droits.",
    sections: [
      {
        h: "1. Qui traite les données",
        blocks: [
          { p: "LIFE OS est exploité par Igor Kholodinsky, développeur indépendant (personne physique), qui est également propriétaire du service et responsable du traitement." },
          { p: `Pour toute question sur les données : ${POLICY_EMAIL} ou directement le bot LIFE OS sur Telegram. Nous répondons aux demandes en 30 jours au maximum.` },
        ],
      },
      {
        h: "2. Quelles données nous traitons",
        blocks: [
          { p: "Nous ne collectons que ce qui est nécessaire au fonctionnement du service. Nous ne constituons aucun profil publicitaire." },
          {
            ul: [
              "Données du compte : identifiant, @username et nom Telegram ; e-mail et empreinte du mot de passe (connexion par e-mail) ; e-mail et nom du compte Google (connexion via Google) ; empreinte du code PIN, jeton du lien personnel de connexion, fuseau horaire, langue de l'interface, formule d'abonnement.",
              "Contenu que tu crées : entrées du journal et notes, messages vocaux et leurs transcriptions, photos et fichiers, tâches, rappels, promesses, objectifs et projets, listes et souhaits, livres et citations, voyages, rêves, humeur, ainsi que les personnes et lieux que tu mentionnes.",
              "Données financières : montants, devises, catégories et descriptions des opérations que tu saisis toi-même ou importes de ta banque si tu la connectes. Nous n'avons aucun accès à tes comptes, ne voyons aucune coordonnée de carte et ne pouvons effectuer aucune opération.",
              "Données de santé et de bien-être : poids, sommeil, pas, fréquence cardiaque, humeur — si tu les saisis toi-même ou connectes Apple Health ou Google Health (Fitbit).",
              "Informations techniques : cookies du service, date et heure des requêtes, journaux d'erreurs, compteur d'appels à l'IA, étiquette du canal d'acquisition et code de parrainage.",
            ],
          },
        ],
      },
      {
        h: "3. Finalités et bases légales",
        blocks: [
          {
            ul: [
              "Fournir le service — conserver tes entrées, te les afficher, envoyer des rappels, produire des résumés et des insights. Base : exécution du contrat conclu avec toi.",
              "Sécuriser ton compte, prévenir les abus et corriger les incidents. Base : notre intérêt légitime.",
              "Traiter les données de santé, de bien-être et d'autres informations sensibles du journal, y compris avec l'IA. Base : ton consentement explicite, donné lorsque tu saisis ces données ou actives une intégration. Tu peux le retirer à tout moment.",
              "Améliorer le produit — à partir de statistiques anonymes (nombre d'entrées, sections utilisées), sans lire le texte.",
              "Respecter la loi en cas de demande légale d'une autorité compétente.",
            ],
          },
        ],
      },
      {
        h: "4. À qui nous transmettons les données",
        blocks: [
          { p: "Nous ne vendons pas tes données, ne les transmettons ni aux régies publicitaires ni aux courtiers en données, et ne les utilisons pas pour afficher de la publicité. Elles ne sont partagées qu'avec les sous-traitants indispensables au service, et uniquement dans la mesure nécessaire :" },
          {
            ul: [
              "Supabase — base de données et stockage de fichiers.",
              "Vercel — hébergement du site et des fonctions serveur.",
              "Telegram — acheminement des messages du bot : tes échanges avec le bot transitent par l'infrastructure de Telegram.",
              "Anthropic (Claude) — analyse du texte des entrées, réponses de l'ami IA.",
              "OpenAI — transcription des messages vocaux, réponses vocales et mode vocal.",
              "Google — connexion via un compte Google, ainsi que Google Agenda et Google Health (Fitbit) : uniquement si tu actives ces intégrations.",
              "Monobank et A-Bank — import de tes opérations, uniquement si tu connectes ta banque avec ton propre jeton.",
              "Google Maps, TMDB, services d'import Instagram et YouTube — ne traitent que la requête concernée : une adresse, un titre de film, un lien que tu as envoyé.",
            ],
          },
          { p: "Selon les conditions des API d'Anthropic et d'OpenAI, les données transmises ne servent pas à entraîner leurs modèles." },
          { p: "En dehors des sous-traitants, seules les personnes à qui tu as toi-même ouvert l'accès peuvent voir tes données : le destinataire d'un lien public, l'héritier que tu as désigné, le destinataire d'un message relayé." },
        ],
      },
      {
        h: "5. Où les données sont stockées",
        blocks: [
          { p: "Les serveurs de nos sous-traitants se trouvent dans l'Union européenne et aux États-Unis. Les transferts hors de ton pays de résidence reposent sur les clauses contractuelles types (CCT) et les autres mécanismes prévus par ces sous-traitants." },
        ],
      },
      {
        h: "6. Ce qui devient public",
        blocks: [
          { p: "Par défaut, tout ce que tu écris n'est visible que par toi. Quelque chose ne devient public que si tu l'actives toi-même :" },
          {
            ul: [
              "page publique du Livre de vie, liste de souhaits, bibliothèque, parcours public — via un lien du type life-os.today/p/<nom> ;",
              "les entrées que tu as choisi de publier ;",
              "les données que verra l'héritier que tu as désigné — selon les règles que tu as définies.",
            ],
          },
          { p: "Toute publication peut être désactivée dans les réglages ; la page cesse alors de s'ouvrir. Les copies déjà enregistrées par quelqu'un et les caches des moteurs de recherche échappent à notre contrôle." },
        ],
      },
      {
        h: "7. Durées de conservation",
        blocks: [
          {
            ul: [
              "Le contenu du compte — tant que le compte existe : un journal n'a de sens que conservé sur des années.",
              "Après la suppression du compte, les données sont effacées de la base et du stockage immédiatement et définitivement ; elles disparaissent des sauvegardes sous 30 jours.",
              "Journaux techniques — jusqu'à 90 jours.",
            ],
          },
        ],
      },
      {
        h: "8. Tes droits",
        blocks: [
          { p: "Si le RGPD (UE/EEE, Royaume-Uni) ou la loi ukrainienne sur la protection des données personnelles s'applique à toi, tu as le droit de :" },
          {
            ul: [
              "obtenir une copie de tes données et des informations sur leur traitement ;",
              "faire rectifier des données inexactes ;",
              "faire effacer tes données (« droit à l'oubli ») ;",
              "limiter le traitement ou t'y opposer ;",
              "recevoir tes données dans un format lisible par machine et les transférer ailleurs ;",
              "retirer ton consentement à tout moment — sans remettre en cause la licéité du traitement antérieur ;",
              "introduire une réclamation auprès de l'autorité de protection des données de ton pays.",
            ],
          },
          { p: "L'exercice de ces droits est gratuit." },
        ],
      },
      {
        h: "9. Comment exercer tes droits tout de suite",
        blocks: [
          {
            ul: [
              "Tout télécharger : « Profil → Tes données → Télécharger toutes mes données » — un fichier unique avec tout le contenu du compte, lisible sans notre application.",
              "Supprimer le compte : au même endroit, le bloc « Le droit de partir » — un bouton efface l'intégralité du compte, y compris les photos et les vocaux stockés. Aucun e-mail au support, aucune attente.",
              "Rectifier ou limiter : modifie et supprime les entrées directement dans l'application, ou écris-nous.",
              "Désactiver intégrations et notifications : « Profil → Intégrations » et les réglages de notifications.",
            ],
          },
        ],
      },
      {
        h: "10. Sécurité",
        blocks: [
          {
            ul: [
              "Transmission par canal sécurisé (HTTPS/TLS), stockage chiffré chez nos sous-traitants.",
              "Accès cloisonné au niveau de la base (row-level security) : la requête d'un utilisateur ne peut pas atteindre les lignes d'un autre.",
              "Connexion via un lien personnel envoyé par le bot : ce lien a une durée de vie limitée et est renouvelé à chaque demande ; tu peux aussi définir un code PIN.",
              "L'accès du développeur à la base de production sert uniquement au support, au diagnostic et à tes demandes.",
              "Le code du service est ouvert — chacun peut vérifier ce qui se passe réellement avec les données.",
            ],
          },
          { p: "Le service n'offre pas de chiffrement de bout en bout qui nous empêcherait physiquement de lire le contenu : l'IA ne pourrait alors plus travailler sur tes entrées. Garde-le en tête au moment de décider ce que tu confies à ton journal." },
        ],
      },
      {
        h: "11. Cookies",
        blocks: [
          { p: "Nous n'utilisons que des cookies strictement nécessaires : le jeton de connexion (lifeos_token), l'indicateur de déverrouillage du PIN (lifeos_unlocked), la langue choisie (locale) et le thème. Aucun cookie publicitaire ou de pistage, aucun compteur d'analyse tiers ni pixel sur le site." },
        ],
      },
      {
        h: "12. Enfants",
        blocks: [
          { p: "Le service n'est pas destiné aux moins de 16 ans et nous ne collectons pas sciemment leurs données. Si de telles données nous sont parvenues, écris-nous et nous supprimerons le compte." },
        ],
      },
      {
        h: "13. Décisions automatisées",
        blocks: [
          { p: "L'IA aide à analyser et structurer tes entrées mais ne prend aucune décision produisant des effets juridiques à ton égard. Ses suggestions sont informatives et ne constituent pas un conseil médical, juridique ou financier." },
        ],
      },
      {
        h: "14. Modifications de la politique",
        blocks: [
          { p: "En cas de modification substantielle, nous l'annoncerons dans le bot ou sur le site avant son entrée en vigueur. La date de dernière mise à jour figure en haut de cette page." },
        ],
      },
      {
        h: "15. Contact",
        blocks: [
          { p: `Questions, demandes d'exercice de droits et réclamations : ${POLICY_EMAIL}. Tu peux aussi écrire directement au bot LIFE OS sur Telegram.` },
        ],
      },
    ],
    back: "Retour à Confidentialité",
  },

  es: {
    title: "Política de privacidad",
    updated: "En vigor desde el 29 de julio de 2026",
    friendly: "Versión corta y sencilla",
    termsLink: "Condiciones de uso",
    intro:
      "Este documento explica qué datos personales trata LIFE OS (el sitio life-os.today, el bot de Telegram y la aplicación móvil), para qué, con qué base legal y qué derechos tienes.",
    sections: [
      {
        h: "1. Quién trata los datos",
        blocks: [
          { p: "LIFE OS está gestionado por Igor Kholodinsky, desarrollador independiente (persona física), que es también el propietario del servicio y el responsable del tratamiento." },
          { p: `Para cualquier consulta sobre datos: ${POLICY_EMAIL} o directamente el bot de LIFE OS en Telegram. Respondemos a las solicitudes en un máximo de 30 días.` },
        ],
      },
      {
        h: "2. Qué datos tratamos",
        blocks: [
          { p: "Recogemos solo lo que el servicio necesita para funcionar. No creamos ningún perfil publicitario." },
          {
            ul: [
              "Datos de la cuenta: identificador, @username y nombre de Telegram; e-mail y hash de la contraseña (si entras por correo); e-mail y nombre de la cuenta de Google (si entras con Google); hash del PIN, token del enlace personal de acceso, zona horaria, idioma de la interfaz y plan.",
              "Contenido que creas: entradas del diario y notas, mensajes de voz y sus transcripciones, fotos y archivos, tareas, recordatorios, promesas, metas y proyectos, listas y deseos, libros y citas, viajes, sueños, estado de ánimo, y las personas y lugares que mencionas.",
              "Registros financieros: importes, monedas, categorías y descripciones de operaciones que introduces tú mismo o importas de tu banco si lo conectas. No tenemos acceso a tus cuentas, no vemos datos de tarjetas y no podemos realizar ninguna operación.",
              "Datos de salud y bienestar: peso, sueño, pasos, pulso, ánimo — si los introduces tú mismo o conectas Apple Health o Google Health (Fitbit).",
              "Información técnica: cookies del servicio, fecha y hora de las peticiones, registros de errores, contador de llamadas a la IA, etiqueta del canal de captación y código de referido.",
            ],
          },
        ],
      },
      {
        h: "3. Para qué y con qué base legal",
        blocks: [
          {
            ul: [
              "Para prestar el servicio — guardar tus entradas, mostrártelas, enviar recordatorios, elaborar resúmenes e insights. Base: ejecución del contrato contigo.",
              "Para proteger tu cuenta, prevenir abusos y reparar fallos. Base: nuestro interés legítimo.",
              "Para tratar datos de salud, bienestar y otra información sensible del diario, también mediante IA. Base: tu consentimiento explícito, que das al introducir esos datos o activar una integración. Puedes retirarlo en cualquier momento.",
              "Para mejorar el producto — con estadísticas anónimas (cuántas entradas, qué secciones se usan), sin leer el texto.",
              "Para cumplir la ley si recibimos una solicitud legítima de una autoridad competente.",
            ],
          },
        ],
      },
      {
        h: "4. Con quién compartimos los datos",
        blocks: [
          { p: "No vendemos tus datos, no los cedemos a redes publicitarias ni a intermediarios de datos y no los usamos para mostrar anuncios. Solo se comparten con los proveedores (encargados) sin los que el servicio no funciona, y únicamente en la medida necesaria:" },
          {
            ul: [
              "Supabase — base de datos y almacenamiento de archivos.",
              "Vercel — alojamiento del sitio y de las funciones de servidor.",
              "Telegram — entrega de los mensajes del bot: tu conversación con el bot pasa por la infraestructura de Telegram.",
              "Anthropic (Claude) — análisis del texto de las entradas y respuestas del amigo IA.",
              "OpenAI — transcripción de mensajes de voz, respuestas habladas y modo de voz.",
              "Google — inicio de sesión con Google, además de Google Calendar y Google Health (Fitbit): solo si activas tú esas integraciones.",
              "Monobank y A-Bank — importación de tus operaciones, solo si conectas tu banco con tu propio token.",
              "Google Maps, TMDB, servicios de importación de Instagram y YouTube — procesan únicamente la petición concreta: una dirección, el título de una película, un enlace que enviaste.",
            ],
          },
          { p: "Según las condiciones de las API de Anthropic y OpenAI, los datos enviados no se usan para entrenar sus modelos." },
          { p: "Aparte de los proveedores, solo pueden ver tus datos las personas a las que tú se los has abierto: quien recibe un enlace público, el heredero que designaste o el destinatario de un mensaje reenviado." },
        ],
      },
      {
        h: "5. Dónde se almacenan los datos",
        blocks: [
          { p: "Los servidores de nuestros proveedores están en la Unión Europea y en Estados Unidos. Las transferencias fuera de tu país de residencia se amparan en las cláusulas contractuales tipo (CCT) y otros mecanismos previstos por esos proveedores." },
        ],
      },
      {
        h: "6. Qué se hace público",
        blocks: [
          { p: "Por defecto, todo lo que escribes solo lo ves tú. Algo se vuelve público únicamente si lo activas tú:" },
          {
            ul: [
              "página pública del Libro de la vida, lista de deseos, biblioteca de libros o camino público — en un enlace del tipo life-os.today/p/<nombre>;",
              "entradas concretas que decidiste publicar;",
              "los datos que verá el heredero que designaste, según las reglas que tú fijaste.",
            ],
          },
          { p: "Cualquier publicación puede desactivarse en los ajustes y la página deja de abrirse. Las copias que alguien ya guardó y la caché de los buscadores quedan fuera de nuestro control." },
        ],
      },
      {
        h: "7. Cuánto tiempo conservamos los datos",
        blocks: [
          {
            ul: [
              "El contenido de la cuenta — mientras la cuenta exista: un diario solo tiene sentido si se guarda durante años.",
              "Tras eliminar la cuenta, los datos se borran de la base y del almacenamiento de inmediato y de forma irreversible; desaparecen de las copias de seguridad en un plazo de 30 días.",
              "Registros técnicos — hasta 90 días.",
            ],
          },
        ],
      },
      {
        h: "8. Tus derechos",
        blocks: [
          { p: "Si te aplica el RGPD (UE/EEE, Reino Unido) o la ley ucraniana de protección de datos personales, tienes derecho a:" },
          {
            ul: [
              "obtener una copia de tus datos e información sobre su tratamiento;",
              "rectificar datos inexactos;",
              "suprimir tus datos («derecho al olvido»);",
              "limitar el tratamiento u oponerte a él;",
              "portar tus datos a otro servicio en formato legible por máquina;",
              "retirar el consentimiento en cualquier momento — sin afectar a la licitud del tratamiento anterior;",
              "presentar una reclamación ante la autoridad de protección de datos de tu país.",
            ],
          },
          { p: "El ejercicio de estos derechos es gratuito." },
        ],
      },
      {
        h: "9. Cómo ejercer tus derechos ahora mismo",
        blocks: [
          {
            ul: [
              "Descargarlo todo: «Perfil → Tus datos → Descargar todos mis datos» — un único archivo con todo el contenido de la cuenta, legible sin nuestra aplicación.",
              "Eliminar la cuenta: en el mismo sitio, el bloque «El derecho a irte» — un botón borra la cuenta entera, incluidas las fotos y los audios del almacenamiento. Sin correos a soporte ni esperas.",
              "Rectificar o limitar: edita y borra entradas dentro de la aplicación, o escríbenos.",
              "Desactivar integraciones y avisos: «Perfil → Integraciones» y los ajustes de notificaciones.",
            ],
          },
        ],
      },
      {
        h: "10. Seguridad",
        blocks: [
          {
            ul: [
              "Transmisión por canal seguro (HTTPS/TLS) y almacenamiento cifrado en los proveedores.",
              "Acceso separado a nivel de base de datos (row-level security): la consulta de un usuario no puede alcanzar las filas de otro.",
              "Acceso mediante enlace personal del bot: el enlace tiene una vida limitada y se renueva en cada solicitud; además puedes poner un PIN.",
              "El acceso del desarrollador a la base de producción se usa solo para soporte, diagnóstico y cuando tú lo pides.",
              "El código del servicio es abierto — cualquiera puede comprobar qué ocurre realmente con los datos.",
            ],
          },
          { p: "El servicio no ofrece cifrado de extremo a extremo que nos impidiera físicamente leer el contenido: entonces la IA no podría trabajar con tus entradas. Tenlo en cuenta al decidir qué confías al diario." },
        ],
      },
      {
        h: "11. Cookies",
        blocks: [
          { p: "Usamos solo cookies estrictamente necesarias: el token de acceso (lifeos_token), el indicador de PIN desbloqueado (lifeos_unlocked), el idioma elegido (locale) y el tema. No hay cookies publicitarias ni de rastreo, ni contadores de analítica de terceros ni píxeles en el sitio." },
        ],
      },
      {
        h: "12. Menores",
        blocks: [
          { p: "El servicio no está dirigido a menores de 16 años y no recogemos sus datos de forma consciente. Si esos datos han llegado hasta nosotros, escríbenos y eliminaremos la cuenta." },
        ],
      },
      {
        h: "13. Decisiones automatizadas",
        blocks: [
          { p: "La IA ayuda a analizar y estructurar tus entradas, pero no toma decisiones con efectos jurídicos sobre ti. Sus sugerencias son informativas y no constituyen asesoramiento médico, jurídico ni financiero." },
        ],
      },
      {
        h: "14. Cambios en la política",
        blocks: [
          { p: "Si la política cambia de forma sustancial, lo anunciaremos en el bot o en el sitio antes de que los cambios entren en vigor. La fecha de la última actualización aparece al principio de esta página." },
        ],
      },
      {
        h: "15. Contacto",
        blocks: [
          { p: `Consultas, solicitudes de derechos y reclamaciones: ${POLICY_EMAIL}. También puedes escribir directamente al bot de LIFE OS en Telegram.` },
        ],
      },
    ],
    back: "Volver a Privacidad",
  },
};

export function policyContent(locale: string): PolicyContent {
  return P[locale] || P.ru;
}
