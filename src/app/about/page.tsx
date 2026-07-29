import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { intlOf } from "@/lib/i18n";
import AboutModern from "@/components/about/AboutModern";
import ProductPeek from "@/components/about/ProductPeek";
import LandingNav from "@/components/about/LandingNav";
import LangMenu from "@/components/LangMenu";
import { capabilities } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

const C = {
  ru: {
    nav_login: "Войти",
    nav_why: "Зачем это", nav_how: "Как работает", nav_feat: "Возможности", nav_rev: "Отзывы",
    back_to_app: "В приложение",
    hero_badge: "Память стирается. История — нет.",
    hero_title: "Сохранись.",
    hero_sub:
      "Твоя жизнь — слишком ценная, чтобы её забыть. Просто расскажи, как прошёл день — голосом или текстом. AI расшифрует, поймёт и соберёт из этого твою историю: дневник, книгу жизни, цели, здоровье, людей и места.",
    hero_note: "чтобы было куда вернуться",
    cta_create: "Начать сохраняться",
    cta_tg: "Открыть в Telegram",
    cta_hint: "Через Google или обычную почту — за минуту",

    idea_kicker: "Зачем это",
    idea_title: "Мы почти ничего не помним",
    idea_p1:
      "Через неделю ты забудешь, о чём думал сегодня. Через год — каким был этот месяц. Мы фотографируем отпуск, но почти никогда не сохраняем свои мысли, решения и идеи — а ведь именно из них и состоит жизнь.",
    idea_p2:
      "LIFE OS убирает всё трение. Не нужно ничего заполнять и систематизировать. Ты говоришь — остальное делает AI. Со временем он начинает понимать тебя: что даёт энергию, какие привычки работают, какие решения меняли твою жизнь.",

    crm_kicker: "Для тех, кто ведёт дела",
    crm_title: "Ты помнишь про клиентов лучше, чем про свою жизнь",
    crm_p1: "У тебя есть CRM, заметки, таблицы — целая система, чтобы не забыть про работу и клиентов. А своя жизнь — мысли, здоровье, близкие, решения — нигде. Она просто утекает.",
    crm_p2: "LIFE OS — это CRM наоборот: система, которая помнит не клиентов, а тебя. И вести её не надо — просто говори, остальное сделает AI.",
    crm_histT: "Так делали те, кто добился большего",
    crm_hist: [
      { n: "Бенджамин Франклин", d: "вёл записи о людях, встречах и договорённостях — и считал круг знакомств одним из главных своих активов." },
      { n: "Эндрю Карнеги", d: "его секретари вели картотеки о партнёрах и клиентах: кто, о чём договаривались, что важно помнить." },
      { n: "Джон Рокфеллер", d: "вёл детальные журналы встреч и договорённостей, придавая огромное значение людям и репутации." },
    ],

    mem_kicker: "Ничего не забывается",
    mem_title: "Все заметки и напоминания — в одном месте",
    mem_lead: "Не нужно жонглировать пятью приложениями: напоминалки, заметки, списки. Просто скажи боту — как живому помощнику.",
    mem_cards: [
      { i: "ti-alarm", t: "Напоминания приходят сами", d: "Бот напишет точно в срок — с кнопками «Готово» и «Через час». Понимает повторы: «каждый день в 8».", ex: "«Напомни завтра в 9 позвонить маме»" },
      { i: "ti-note", t: "Заметки, которые находятся", d: "Коды, размеры, адреса — отдельно от дневника. Спроси — бот мгновенно ответит.", ex: "«Какой код от домофона?»" },
      { i: "ti-list-check", t: "Списки покупок", d: "Пункты добавляются голосом, вычёркиваются кнопкой прямо в чате. Списков может быть несколько.", ex: "«Добавь молоко и хлеб в список»" },
    ],
    mem_foot: "А утром спроси: «Что у меня сегодня?» — и получишь весь день одним списком.",

    how_kicker: "Как это работает",
    how: [
      { n: "1", t: "Рассказываешь", d: "Голосом или текстом — в Telegram-бота или прямо на сайте. Как другу: «сегодня было…»." },
      { n: "2", t: "AI понимает", d: "Расшифровывает речь, выделяет инсайты, задачи, настроение, людей и места, связывает с проектами." },
      { n: "3", t: "Видишь свою жизнь", d: "Лента, аналитика, книга жизни, карта здоровья и целей. Спрашиваешь — AI-биограф отвечает по твоим записям." },
    ],

    feat_kicker: "Что внутри",
    feats: [
      { i: "ti-book", t: "Книга жизни", d: "AI собирает из твоих дней настоящую летопись по главам и годам." },
      { i: "ti-heart-rate-monitor", t: "Здоровье", d: "Вес, энергия, самочувствие — в динамике, без ручного ведения." },
      { i: "ti-target", t: "Цели и мечты", d: "Карта желаний и задачи — AI сам достаёт их из того, что ты рассказал." },
      { i: "ti-users", t: "Люди и места", d: "Кто рядом и где ты был — само складывается в карту твоей жизни." },
      { i: "ti-sparkles", t: "Что заметил AI", d: "Закономерности, что даёт тебе энергию и счастье — взгляд со стороны." },
      { i: "ti-message-chatbot", t: "AI-биограф", d: "«Когда я был счастливее всего?» — ответ за секунды по твоим записям." },
      { i: "ti-bookmarks", t: "База знаний", d: "Ссылки из Instagram и YouTube — AI вытащит суть и сохранит, чтобы найти по смыслу." },
      { i: "ti-camera", t: "Память в фото", d: "Чеки, гарантии, важные моменты — AI понимает фото и раскладывает по полкам." },
      { i: "ti-books", t: "Книги и чтение", d: "Что читаешь и прочитал, оценки и цитаты, цель года и AI-советы." },
    ],

    feat_more_n: "50+",
    feat_more_t: "возможностей уже внутри",
    feat_more_d: "И каждую неделю появляются новые. Загляни в полный каталог — там точно есть то, чего ты не ждёшь от дневника.",
    feat_more_cta: "Смотреть все возможности",

    founder_kicker: "Об основателе",
    founder_title: "Почему я создаю LIFE OS",
    founder_paras: [
      "Меня зовут Игорь. Я начал создавать LIFE OS не как бизнес-проект, а как письмо тем, кто будет после меня.",
      "Однажды я поймал себя на простой и немного страшной мысли: я почти не помню собственную жизнь. Отпуска, разговоры, важные решения, идеи, от которых когда-то горели глаза, — всё это постепенно стирается. Фотографии остаются, но мы уже не помним, что было за кадром и почему этот день был для нас важен.",
      "А ещё я понял: всё, что я узнал за свою жизнь — мои ошибки, открытия и моменты, ради которых стоило жить, — однажды может уйти вместе со мной. Мои дети и внуки увидят фотографии, но не узнают меня настоящего. Мы сохраняем изображения своей жизни, но почти не сохраняем себя.",
      "Я хотел инструмент, который не требует дисциплины. Где достаточно просто говорить — как близкому человеку, — а технология сама понимает, что произошло, находит важное и превращает это в историю жизни. Такого не было. Поэтому я начал создавать его сам — для себя и своей семьи.",
      "LIFE OS — это мой личный дневник, архив всех данных и будущая книга жизни. А теперь я открываю его для каждого, кто тоже не хочет, чтобы его опыт и самые важные моменты однажды исчезли.",
    ],
    founder_quote:
      "Я не хочу подстраивать свою жизнь под сложные системы. Достаточно просто говорить — а технология пусть делает остальное. LIFE OS создаётся не для технических специалистов, а для обычных людей.",
    founder_sign: "Игорь Холодинский, основатель LIFE OS",

    testi_kicker: "Отзывы",
    testi_title: "Люди в восторге от LIFE OS",
    // TODO: заменить на реальные отзывы пользователей (пока — примеры для вёрстки)
    testi: [
      { text: "Веду LIFE OS три месяца и впервые в жизни не забросил дневник. Просто говорю в Telegram по дороге домой — а вечером читаю свою жизнь, разложенную по полочкам.", name: "Анна", role: "маркетолог" },
      { text: "Пробовал десятки приложений для заметок — всё бросал. Здесь ничего не надо настраивать: говоришь как другу, остальное делает AI.", name: "Дмитрий", role: "предприниматель" },
      { text: "Выгрузил всё в Obsidian и понял — это правда моё. Я не привязан к сервису, мои воспоминания всегда со мной.", name: "Сергей", role: "инженер" },
      { text: "Делаю это для дочери. Хочу, чтобы однажды она смогла прочитать, о чём я думала, когда она была маленькой.", name: "Мария", role: "мама в декрете" },
    ],

    trust_own: "Данные — ваши навсегда",
    trust_own_d: "Выгрузка в Markdown и Obsidian в один клик. Ваша книга жизни останется с вами — даже без интернета и без нашего сервиса.",
    trust_open: "Открытый код",
    trust_open_d: "Проект публичный — можно проверить, как всё устроено.",
    trust_priv: "Честная приватность",
    trust_priv_d: "Дневник видишь только ты. Скачать или удалить всё — в один клик.",

    final_title: "Начни первую страницу своей книги жизни",
    final_sub: "Бесплатно. Через Google или почту.",

    foot_priv: "Безопасно и приватно",
    foot_code: "Код на GitHub",
    foot_tester: "Тестировщикам",
    foot_terms: "Условия",
    design_a: "Классика",
    design_b: "Новый",
  },
  en: {
    nav_login: "Sign in",
    nav_why: "Why", nav_how: "How it works", nav_feat: "Features", nav_rev: "Stories",
    back_to_app: "Back to app",
    hero_badge: "Memory fades. Your story doesn't.",
    hero_title: "Save yourself.",
    hero_sub:
      "Your life is too precious to forget. Just tell how your day went — by voice or text. AI transcribes it, makes sense of it and builds your story: a diary, a book of life, goals, health, people and places.",
    hero_note: "so you have somewhere to return",
    cta_create: "Start saving yourself",
    cta_tg: "Open in Telegram",
    cta_hint: "With Google or regular email — in a minute",

    idea_kicker: "Why",
    idea_title: "We remember almost nothing",
    idea_p1:
      "In a week you'll forget what you thought about today. In a year — what this month was like. We photograph our vacations but almost never save our thoughts, decisions and ideas — yet that's what life is made of.",
    idea_p2:
      "LIFE OS removes all the friction. Nothing to fill in or organize. You speak — AI does the rest. Over time it starts to understand you: what gives you energy, which habits work, which decisions changed your life.",

    crm_kicker: "For people who run things",
    crm_title: "You remember your customers better than your own life",
    crm_p1: "You've got a CRM, notes, spreadsheets — a whole system so you never forget work and clients. But your own life — thoughts, health, the people you love, decisions — lives nowhere. It just slips away.",
    crm_p2: "LIFE OS is a CRM in reverse: a system that remembers you, not your customers. And you don't manage it — you just talk, AI does the rest.",
    crm_histT: "The people who achieved more did exactly this",
    crm_hist: [
      { n: "Benjamin Franklin", d: "kept records of people, meetings and agreements — and saw his network as one of his key assets." },
      { n: "Andrew Carnegie", d: "had secretaries keep card files on partners and clients: who, what was agreed, what to remember." },
      { n: "John D. Rockefeller", d: "kept detailed journals of meetings and agreements, valuing people and reputation immensely." },
    ],

    mem_kicker: "Nothing gets forgotten",
    mem_title: "All your notes and reminders — in one place",
    mem_lead: "No juggling five apps for reminders, notes and lists. Just tell the bot — like a real assistant.",
    mem_cards: [
      { i: "ti-alarm", t: "Reminders that arrive on their own", d: "The bot messages you right on time — with “Done” and “In an hour” buttons. Understands recurrence: “every day at 8”.", ex: "“Remind me tomorrow at 9 to call mom”" },
      { i: "ti-note", t: "Notes that can be found", d: "Codes, sizes, addresses — separate from the diary. Ask, and the bot answers instantly.", ex: "“What's the door code?”" },
      { i: "ti-list-check", t: "Shopping lists", d: "Add items by voice, check them off with a tap right in the chat. Keep several lists.", ex: "“Add milk and bread to the list”" },
    ],
    mem_foot: "And in the morning ask: “What's on today?” — your whole day in one list.",

    how_kicker: "How it works",
    how: [
      { n: "1", t: "You tell", d: "By voice or text — to a Telegram bot or right on the site. Like to a friend: “today was…”." },
      { n: "2", t: "AI understands", d: "Transcribes speech, extracts insights, tasks, mood, people and places, links to projects." },
      { n: "3", t: "You see your life", d: "Feed, analytics, book of life, health and goals map. Ask — the AI biographer answers from your entries." },
    ],

    feat_kicker: "What's inside",
    feats: [
      { i: "ti-book", t: "Book of life", d: "AI turns your days into a real chronicle by chapters and years." },
      { i: "ti-heart-rate-monitor", t: "Health", d: "Weight, energy, wellbeing — tracked over time, no manual logging." },
      { i: "ti-target", t: "Goals & dreams", d: "A wish map and tasks — AI pulls them from what you said." },
      { i: "ti-users", t: "People & places", d: "Who's around and where you've been — your life map builds itself." },
      { i: "ti-sparkles", t: "What AI noticed", d: "Patterns, what gives you energy and happiness — an outside view." },
      { i: "ti-message-chatbot", t: "AI biographer", d: "“When was I happiest?” — answered in seconds from your entries." },
      { i: "ti-bookmarks", t: "Knowledge base", d: "Instagram and YouTube links — AI pulls the gist and saves it so you can find it by meaning." },
      { i: "ti-camera", t: "Memory in photos", d: "Receipts, warranties, moments — AI understands photos and files them for you." },
      { i: "ti-books", t: "Books & reading", d: "What you read and finished, ratings and quotes, a year goal and AI picks." },
    ],

    feat_more_n: "50+",
    feat_more_t: "features already inside",
    feat_more_d: "And new ones ship every week. Browse the full catalog — there's definitely something you don't expect from a diary.",
    feat_more_cta: "See all features",

    founder_kicker: "About the founder",
    founder_title: "Why I'm building LIFE OS",
    founder_paras: [
      "My name is Igor. I started building LIFE OS not as a business, but as a letter to those who come after me.",
      "One day a simple, slightly frightening thought caught me: I barely remember my own life. Vacations, conversations, important decisions, ideas that once lit me up — all of it slowly fades. The photos remain, but we no longer recall what happened off-camera or why that day mattered.",
      "And I realized something else: everything I've learned in my life — my mistakes, discoveries and the moments worth living for — could one day leave with me. My children and grandchildren will see photos, but won't know the real me. We save the images of our lives, but we hardly save ourselves.",
      "I wanted a tool that needs no discipline. Where it's enough to just speak — like to someone close — and technology understands what happened, finds what matters and turns it into a life story. It didn't exist. So I started building it myself — for me and my family.",
      "LIFE OS is my personal diary, the archive of all my data and my future book of life. And now I'm opening it to everyone who also doesn't want their experience and most important moments to one day disappear.",
    ],
    founder_quote:
      "I don't want to bend my life around complex systems. It should be enough to just speak — and let technology do the rest. LIFE OS isn't built for tech specialists; it's built for ordinary people.",
    founder_sign: "Igor Kholodinsky, founder of LIFE OS",

    testi_kicker: "Testimonials",
    testi_title: "People love LIFE OS",
    // TODO: replace with real user testimonials (these are placeholders for layout)
    testi: [
      { text: "I've used LIFE OS for three months and for the first time I haven't abandoned a diary. I just talk into Telegram on my way home — and in the evening I read my life, neatly sorted.", name: "Anna", role: "marketer" },
      { text: "I've tried dozens of note apps and quit them all. Here there's nothing to set up: you talk like to a friend, AI does the rest.", name: "Dmitry", role: "entrepreneur" },
      { text: "I exported everything to Obsidian and realized — it's truly mine. I'm not locked to the service, my memories are always with me.", name: "Sergey", role: "engineer" },
      { text: "I'm doing this for my daughter. I want her to one day read what I was thinking when she was little.", name: "Maria", role: "mom" },
    ],

    trust_own: "Your data, forever yours",
    trust_own_d: "Export to Markdown and Obsidian in one click. Your book of life stays with you — even without internet and without our service.",
    trust_open: "Open source",
    trust_open_d: "The project is public — you can check how everything works.",
    trust_priv: "Honest privacy",
    trust_priv_d: "Only you see your diary. Export or delete everything in one click.",

    final_title: "Start the first page of your book of life",
    final_sub: "Free. With Google or email.",

    foot_priv: "Safe and private",
    foot_code: "Code on GitHub",
    foot_tester: "For testers",
    foot_terms: "Terms",
    design_a: "Classic",
    design_b: "New",
  },
  uk: {
    nav_login: "Увійти",
    nav_why: "Навіщо це", nav_how: "Як працює", nav_feat: "Можливості", nav_rev: "Відгуки",
    back_to_app: "До застосунку",
    hero_badge: "Пам'ять стирається. Історія — ні.",
    hero_title: "Збережися.",
    hero_sub:
      "Твоє життя — надто цінне, щоб його забути. Просто розкажи, як минув день — голосом або текстом. AI розшифрує, зрозуміє й збере з цього твою історію: щоденник, книгу життя, цілі, здоров'я, людей і місця.",
    hero_note: "щоб було куди повернутися",
    cta_create: "Почати зберігатися",
    cta_tg: "Відкрити в Telegram",
    cta_hint: "Через Google або звичайну пошту — за хвилину",

    idea_kicker: "Навіщо це",
    idea_title: "Ми майже нічого не пам'ятаємо",
    idea_p1:
      "За тиждень ти забудеш, про що думав сьогодні. За рік — яким був цей місяць. Ми фотографуємо відпустку, але майже ніколи не зберігаємо свої думки, рішення та ідеї — а саме з них і складається життя.",
    idea_p2:
      "LIFE OS прибирає все тертя. Не треба нічого заповнювати й систематизувати. Ти говориш — решту робить AI. З часом він починає розуміти тебе: що дає енергію, які звички працюють, які рішення змінювали твоє життя.",

    crm_kicker: "Для тих, хто веде справи",
    crm_title: "Ти пам'ятаєш про клієнтів краще, ніж про власне життя",
    crm_p1: "У тебе є CRM, нотатки, таблиці — ціла система, щоб не забути про роботу й клієнтів. А власне життя — думки, здоров'я, близькі, рішення — ніде. Воно просто витікає.",
    crm_p2: "LIFE OS — це CRM навпаки: система, що пам'ятає не клієнтів, а тебе. І вести її не треба — просто говори, решту зробить AI.",
    crm_histT: "Так робили ті, хто досяг більшого",
    crm_hist: [
      { n: "Бенджамін Франклін", d: "вів записи про людей, зустрічі й домовленості — і вважав коло знайомств одним із головних активів." },
      { n: "Ендрю Карнегі", d: "його секретарі вели картотеки про партнерів і клієнтів: хто, про що домовлялися, що важливо." },
      { n: "Джон Рокфеллер", d: "вів детальні журнали зустрічей і домовленостей, надаючи величезне значення людям і репутації." },
    ],

    mem_kicker: "Ніщо не забувається",
    mem_title: "Усі нотатки й нагадування — в одному місці",
    mem_lead: "Не треба жонглювати п'ятьма застосунками: нагадування, нотатки, списки. Просто скажи боту — як живому помічнику.",
    mem_cards: [
      { i: "ti-alarm", t: "Нагадування приходять самі", d: "Бот напише точно в строк — із кнопками «Готово» та «За годину». Розуміє повтори: «щодня о 8».", ex: "«Нагадай завтра о 9 подзвонити мамі»" },
      { i: "ti-note", t: "Нотатки, які знаходяться", d: "Коди, розміри, адреси — окремо від щоденника. Спитай — бот миттєво відповість.", ex: "«Який код від домофона?»" },
      { i: "ti-list-check", t: "Списки покупок", d: "Пункти додаються голосом, викреслюються кнопкою прямо в чаті. Списків може бути кілька.", ex: "«Додай молоко і хліб у список»" },
    ],
    mem_foot: "А вранці спитай: «Що в мене сьогодні?» — і отримаєш весь день одним списком.",

    how_kicker: "Як це працює",
    how: [
      { n: "1", t: "Розповідаєш", d: "Голосом або текстом — Telegram-боту або прямо на сайті. Як другу: «сьогодні було…»." },
      { n: "2", t: "AI розуміє", d: "Розшифровує мову, виділяє інсайти, задачі, настрій, людей і місця, пов'язує з проєктами." },
      { n: "3", t: "Бачиш своє життя", d: "Стрічка, аналітика, книга життя, карта здоров'я та цілей. Питаєш — AI-біограф відповідає за твоїми записами." },
    ],

    feat_kicker: "Що всередині",
    feats: [
      { i: "ti-book", t: "Книга життя", d: "AI збирає з твоїх днів справжній літопис за главами та роками." },
      { i: "ti-heart-rate-monitor", t: "Здоров'я", d: "Вага, енергія, самопочуття — у динаміці, без ручного ведення." },
      { i: "ti-target", t: "Цілі та мрії", d: "Карта бажань і задачі — AI сам дістає їх з того, що ти розповів." },
      { i: "ti-users", t: "Люди та місця", d: "Хто поруч і де ти був — само складається в карту твого життя." },
      { i: "ti-sparkles", t: "Що помітив AI", d: "Закономірності, що дає тобі енергію і щастя — погляд збоку." },
      { i: "ti-message-chatbot", t: "AI-біограф", d: "«Коли я був найщасливіший?» — відповідь за секунди за твоїми записами." },
      { i: "ti-bookmarks", t: "База знань", d: "Посилання з Instagram і YouTube — AI витягне суть і збереже, щоб знайти за змістом." },
      { i: "ti-camera", t: "Пам'ять у фото", d: "Чеки, гарантії, важливі моменти — AI розуміє фото й розкладає по поличках." },
      { i: "ti-books", t: "Книги та читання", d: "Що читаєш і прочитав, оцінки й цитати, ціль року та AI-поради." },
    ],

    feat_more_n: "50+",
    feat_more_t: "можливостей уже всередині",
    feat_more_d: "І щотижня з'являються нові. Зазирни в повний каталог — там точно є те, чого не чекаєш від щоденника.",
    feat_more_cta: "Дивитися всі можливості",

    founder_kicker: "Про засновника",
    founder_title: "Чому я створюю LIFE OS",
    founder_paras: [
      "Мене звати Ігор. Я почав створювати LIFE OS не як бізнес-проєкт, а як лист тим, хто буде після мене.",
      "Одного разу я впіймав себе на простій і трохи страшній думці: я майже не пам'ятаю власне життя. Відпустки, розмови, важливі рішення, ідеї, від яких колись горіли очі, — усе це поступово стирається. Фотографії залишаються, але ми вже не пам'ятаємо, що було за кадром і чому цей день був для нас важливим.",
      "А ще я зрозумів: усе, що я дізнався за своє життя — мої помилки, відкриття й моменти, заради яких варто було жити, — одного дня може піти разом зі мною. Мої діти й онуки побачать фотографії, але не впізнають мене справжнього. Ми зберігаємо зображення свого життя, але майже не зберігаємо себе.",
      "Я хотів інструмент, який не вимагає дисципліни. Де достатньо просто говорити — як близькій людині, — а технологія сама розуміє, що сталося, знаходить важливе і перетворює це на історію життя. Такого не було. Тому я почав створювати його сам — для себе і своєї родини.",
      "LIFE OS — це мій особистий щоденник, архів усіх даних і майбутня книга життя. А тепер я відкриваю його для кожного, хто теж не хоче, щоб його досвід і найважливіші моменти одного дня зникли.",
    ],
    founder_quote:
      "Я не хочу підлаштовувати своє життя під складні системи. Достатньо просто говорити — а технологія нехай робить решту. LIFE OS створюється не для технічних фахівців, а для звичайних людей.",
    founder_sign: "Ігор Холодінський, засновник LIFE OS",

    testi_kicker: "Відгуки",
    testi_title: "Люди в захваті від LIFE OS",
    testi: [
      { text: "Веду LIFE OS три місяці й уперше в житті не закинув щоденник. Просто говорю в Telegram дорогою додому — а ввечері читаю своє життя, розкладене по поличках.", name: "Анна", role: "маркетолог" },
      { text: "Пробував десятки застосунків для нотаток — усе кидав. Тут нічого не треба налаштовувати: говориш як другу, решту робить AI.", name: "Дмитро", role: "підприємець" },
      { text: "Вивантажив усе в Obsidian і зрозумів — це справді моє. Я не прив'язаний до сервісу, мої спогади завжди зі мною.", name: "Сергій", role: "інженер" },
      { text: "Роблю це для доньки. Хочу, щоб одного дня вона змогла прочитати, про що я думала, коли вона була маленькою.", name: "Марія", role: "мама в декреті" },
    ],

    trust_own: "Дані — ваші назавжди",
    trust_own_d: "Вивантаження в Markdown і Obsidian в один клік. Ваша книга життя залишиться з вами — навіть без інтернету і без нашого сервісу.",
    trust_open: "Відкритий код",
    trust_open_d: "Проєкт публічний — можна перевірити, як усе влаштовано.",
    trust_priv: "Чесна приватність",
    trust_priv_d: "Щоденник бачиш лише ти. Завантажити або видалити все — в один клік.",

    final_title: "Почни першу сторінку своєї книги життя",
    final_sub: "Безкоштовно. Через Google або пошту.",

    foot_priv: "Безпечно і приватно",
    foot_code: "Код на GitHub",
    foot_tester: "Тестувальникам",
    foot_terms: "Умови",
    design_a: "Класика",
    design_b: "Новий",
  },
  fr: {
    nav_login: "Se connecter",
    nav_why: "Pourquoi", nav_how: "Comment ça marche", nav_feat: "Fonctions", nav_rev: "Témoignages",
    back_to_app: "Vers l'app",
    hero_badge: "La mémoire s'efface. Ton histoire, non.",
    hero_title: "Sauvegarde-toi.",
    hero_sub:
      "Ta vie est trop précieuse pour être oubliée. Raconte simplement ta journée — à la voix ou au texte. L'IA transcrit, donne du sens et bâtit ton histoire : journal, livre de vie, objectifs, santé, gens et lieux.",
    hero_note: "pour avoir un endroit où revenir",
    cta_create: "Commencer à te sauvegarder",
    cta_tg: "Ouvrir dans Telegram",
    cta_hint: "Avec Google ou un e-mail ordinaire — en une minute",

    idea_kicker: "Pourquoi",
    idea_title: "On ne se souvient presque de rien",
    idea_p1:
      "Dans une semaine, tu auras oublié à quoi tu pensais aujourd'hui. Dans un an — comment était ce mois. On photographie nos vacances, mais on ne garde presque jamais nos pensées, décisions et idées — pourtant c'est de cela qu'est faite la vie.",
    idea_p2:
      "LIFE OS supprime toute friction. Rien à remplir ni à organiser. Tu parles — l'IA fait le reste. Avec le temps, elle apprend à te comprendre : ce qui te donne de l'énergie, quelles habitudes marchent, quelles décisions ont changé ta vie.",

    crm_kicker: "Pour ceux qui gèrent",
    crm_title: "Tu te souviens mieux de tes clients que de ta propre vie",
    crm_p1: "Tu as un CRM, des notes, des tableurs — tout un système pour ne rien oublier du travail et des clients. Mais ta propre vie — pensées, santé, proches, décisions — n'existe nulle part. Elle file, tout simplement.",
    crm_p2: "LIFE OS, c'est un CRM à l'envers : un système qui se souvient de toi, pas de tes clients. Et tu n'as rien à gérer — parle, l'IA fait le reste.",
    crm_histT: "Ceux qui ont réussi le plus faisaient exactement ça",
    crm_hist: [
      { n: "Benjamin Franklin", d: "tenait des notes sur les gens, les rencontres et les accords — et voyait son réseau comme l'un de ses principaux atouts." },
      { n: "Andrew Carnegie", d: "ses secrétaires tenaient des fichiers sur partenaires et clients : qui, quoi, ce qui avait été convenu." },
      { n: "John D. Rockefeller", d: "tenait des journaux détaillés de ses rencontres et accords, accordant une immense valeur aux gens et à la réputation." },
    ],

    mem_kicker: "Rien ne s'oublie",
    mem_title: "Toutes tes notes et rappels — au même endroit",
    mem_lead: "Plus besoin de jongler entre cinq applis : rappels, notes, listes. Dis-le au bot — comme à un vrai assistant.",
    mem_cards: [
      { i: "ti-alarm", t: "Des rappels qui arrivent tout seuls", d: "Le bot t'écrit pile à l'heure — avec les boutons « Fait » et « Dans une heure ». Il comprend la récurrence : « chaque jour à 8h ».", ex: "« Rappelle-moi demain à 9h d'appeler maman »" },
      { i: "ti-note", t: "Des notes qui se retrouvent", d: "Codes, tailles, adresses — séparés du journal. Demande, et le bot répond instantanément.", ex: "« Quel est le code de la porte ? »" },
      { i: "ti-list-check", t: "Listes de courses", d: "Ajoute à la voix, raye d'un tap dans le chat. Plusieurs listes possibles.", ex: "« Ajoute le lait et le pain à la liste »" },
    ],
    mem_foot: "Et le matin, demande : « Qu'est-ce que j'ai aujourd'hui ? » — toute ta journée en une liste.",

    how_kicker: "Comment ça marche",
    how: [
      { n: "1", t: "Tu racontes", d: "À la voix ou au texte — au bot Telegram ou directement sur le site. Comme à un ami : « aujourd'hui… »." },
      { n: "2", t: "L'IA comprend", d: "Transcrit la parole, dégage insights, tâches, humeur, gens et lieux, relie aux projets." },
      { n: "3", t: "Tu vois ta vie", d: "Fil, analytique, livre de vie, carte de santé et d'objectifs. Tu demandes — le biographe IA répond d'après tes entrées." },
    ],

    feat_kicker: "Ce qu'il y a dedans",
    feats: [
      { i: "ti-book", t: "Livre de vie", d: "L'IA fait de tes journées une vraie chronique, par chapitres et par années." },
      { i: "ti-heart-rate-monitor", t: "Santé", d: "Poids, énergie, bien-être — suivis dans le temps, sans saisie manuelle." },
      { i: "ti-target", t: "Objectifs et rêves", d: "Une carte des envies et des tâches — l'IA les tire de ce que tu as dit." },
      { i: "ti-users", t: "Gens et lieux", d: "Qui est là et où tu es allé — la carte de ta vie se construit seule." },
      { i: "ti-sparkles", t: "Ce que l'IA a remarqué", d: "Des tendances, ce qui te donne énergie et bonheur — un regard extérieur." },
      { i: "ti-message-chatbot", t: "Biographe IA", d: "« Quand étais-je le plus heureux ? » — réponse en secondes d'après tes entrées." },
      { i: "ti-bookmarks", t: "Base de connaissances", d: "Liens Instagram et YouTube — l'IA en tire l'essentiel et l'enregistre pour le retrouver par le sens." },
      { i: "ti-camera", t: "Mémoire en photos", d: "Reçus, garanties, moments — l'IA comprend les photos et les classe pour toi." },
      { i: "ti-books", t: "Livres & lecture", d: "Ce que tu lis et as lu, notes et citations, objectif de l'année et suggestions IA." },
    ],

    feat_more_n: "50+",
    feat_more_t: "fonctionnalités déjà là",
    feat_more_d: "Et de nouvelles arrivent chaque semaine. Parcours le catalogue complet — il y a sûrement ce que tu n'attends pas d'un journal.",
    feat_more_cta: "Voir toutes les fonctionnalités",

    founder_kicker: "À propos du fondateur",
    founder_title: "Pourquoi je crée LIFE OS",
    founder_paras: [
      "Je m'appelle Igor. J'ai commencé à créer LIFE OS non comme une entreprise, mais comme une lettre à ceux qui viendront après moi.",
      "Un jour, une pensée simple et un peu effrayante m'a saisi : je ne me souviens presque pas de ma propre vie. Vacances, conversations, décisions importantes, idées qui me faisaient autrefois briller les yeux — tout cela s'efface peu à peu. Les photos restent, mais on ne se rappelle plus ce qui se passait hors champ ni pourquoi ce jour comptait.",
      "Et j'ai compris autre chose : tout ce que j'ai appris dans ma vie — mes erreurs, mes découvertes et les moments pour lesquels il valait la peine de vivre — pourrait un jour partir avec moi. Mes enfants et petits-enfants verront des photos, mais ne connaîtront pas le vrai moi. On sauvegarde les images de notre vie, mais on ne se sauvegarde presque pas soi-même.",
      "Je voulais un outil qui n'exige aucune discipline. Où il suffit de parler — comme à un proche — et où la technologie comprend ce qui s'est passé, repère l'essentiel et en fait une histoire de vie. Ça n'existait pas. Alors je l'ai créé moi-même — pour moi et ma famille.",
      "LIFE OS, c'est mon journal personnel, l'archive de toutes mes données et mon futur livre de vie. Et maintenant je l'ouvre à tous ceux qui, eux aussi, ne veulent pas que leur expérience et leurs moments les plus précieux disparaissent un jour.",
    ],
    founder_quote:
      "Je ne veux pas plier ma vie à des systèmes complexes. Il suffit de parler — et que la technologie fasse le reste. LIFE OS n'est pas conçu pour les spécialistes techniques, mais pour les gens ordinaires.",
    founder_sign: "Igor Kholodinsky, fondateur de LIFE OS",

    testi_kicker: "Témoignages",
    testi_title: "Les gens adorent LIFE OS",
    testi: [
      { text: "Je tiens LIFE OS depuis trois mois et, pour la première fois, je n'ai pas abandonné mon journal. Je parle simplement dans Telegram en rentrant — et le soir je relis ma vie, bien rangée.", name: "Anna", role: "marketeuse" },
      { text: "J'ai essayé des dizaines d'applis de notes — je les ai toutes lâchées. Ici, rien à configurer : tu parles comme à un ami, l'IA fait le reste.", name: "Dmitri", role: "entrepreneur" },
      { text: "J'ai tout exporté vers Obsidian et j'ai compris — c'est vraiment à moi. Je ne dépends pas du service, mes souvenirs sont toujours avec moi.", name: "Sergueï", role: "ingénieur" },
      { text: "Je le fais pour ma fille. Je veux qu'un jour elle puisse lire ce à quoi je pensais quand elle était petite.", name: "Maria", role: "maman en congé" },
    ],

    trust_own: "Tes données, à toi pour toujours",
    trust_own_d: "Export vers Markdown et Obsidian en un clic. Ton livre de vie reste avec toi — même sans internet et sans notre service.",
    trust_open: "Code ouvert",
    trust_open_d: "Le projet est public — tu peux vérifier comment tout fonctionne.",
    trust_priv: "Une vraie confidentialité",
    trust_priv_d: "Toi seul vois ton journal. Télécharge ou supprime tout en un clic.",

    final_title: "Commence la première page de ton livre de vie",
    final_sub: "Gratuit. Avec Google ou e-mail.",

    foot_priv: "Sécurisé et privé",
    foot_code: "Code sur GitHub",
    foot_tester: "Pour les testeurs",
    foot_terms: "Conditions",
    design_a: "Classique",
    design_b: "Nouveau",
  },
  es: {
    nav_login: "Iniciar sesión",
    nav_why: "Por qué", nav_how: "Cómo funciona", nav_feat: "Funciones", nav_rev: "Opiniones",
    back_to_app: "Volver a la app",
    hero_badge: "La memoria se borra. Tu historia, no.",
    hero_title: "Guárdate.",
    hero_sub:
      "Tu vida es demasiado valiosa para olvidarla. Solo cuenta cómo fue tu día — por voz o texto. La IA lo transcribe, le da sentido y construye tu historia: un diario, un libro de vida, metas, salud, personas y lugares.",
    hero_note: "para tener adónde volver",
    cta_create: "Empezar a guardarte",
    cta_tg: "Abrir en Telegram",
    cta_hint: "Con Google o correo normal — en un minuto",

    idea_kicker: "Por qué",
    idea_title: "Casi no recordamos nada",
    idea_p1:
      "En una semana olvidarás en qué pensabas hoy. En un año, cómo fue este mes. Fotografiamos nuestras vacaciones, pero casi nunca guardamos nuestros pensamientos, decisiones e ideas — y de eso está hecha la vida.",
    idea_p2:
      "LIFE OS elimina toda la fricción. No hay que rellenar ni organizar nada. Tú hablas — la IA hace el resto. Con el tiempo empieza a entenderte: qué te da energía, qué hábitos funcionan, qué decisiones cambiaron tu vida.",

    crm_kicker: "Para quien lleva las riendas",
    crm_title: "Recuerdas a tus clientes mejor que tu propia vida",
    crm_p1: "Tienes un CRM, notas, hojas de cálculo — todo un sistema para no olvidar el trabajo y los clientes. Pero tu propia vida — pensamientos, salud, seres queridos, decisiones — no está en ningún lado. Simplemente se escapa.",
    crm_p2: "LIFE OS es un CRM al revés: un sistema que te recuerda a ti, no a tus clientes. Y no hay que gestionarlo — solo habla, la IA hace el resto.",
    crm_histT: "Los que lograron más hacían exactamente esto",
    crm_hist: [
      { n: "Benjamin Franklin", d: "llevaba registros de personas, reuniones y acuerdos — y veía su red de contactos como uno de sus principales activos." },
      { n: "Andrew Carnegie", d: "sus secretarios llevaban fichas de socios y clientes: quién, qué se acordó, qué recordar." },
      { n: "John D. Rockefeller", d: "llevaba diarios detallados de reuniones y acuerdos, dando enorme valor a las personas y la reputación." },
    ],

    mem_kicker: "Nada se olvida",
    mem_title: "Todas tus notas y recordatorios — en un solo lugar",
    mem_lead: "Sin hacer malabares con cinco apps: recordatorios, notas, listas. Solo díselo al bot — como a un asistente de verdad.",
    mem_cards: [
      { i: "ti-alarm", t: "Recordatorios que llegan solos", d: "El bot te escribe justo a tiempo — con botones «Hecho» y «En una hora». Entiende repeticiones: «cada día a las 8».", ex: "«Recuérdame mañana a las 9 llamar a mamá»" },
      { i: "ti-note", t: "Notas que se encuentran", d: "Códigos, tallas, direcciones — aparte del diario. Pregunta y el bot responde al instante.", ex: "«¿Cuál es el código del portal?»" },
      { i: "ti-list-check", t: "Listas de compras", d: "Añade con la voz, tacha con un toque en el chat. Puedes tener varias listas.", ex: "«Añade leche y pan a la lista»" },
    ],
    mem_foot: "Y por la mañana pregunta: «¿Qué tengo hoy?» — todo tu día en una lista.",

    how_kicker: "Cómo funciona",
    how: [
      { n: "1", t: "Cuentas", d: "Por voz o texto — a un bot de Telegram o directo en el sitio. Como a un amigo: «hoy fue…»." },
      { n: "2", t: "La IA entiende", d: "Transcribe el habla, extrae ideas clave, tareas, estado de ánimo, personas y lugares, y los conecta con tus proyectos." },
      { n: "3", t: "Ves tu vida", d: "Feed, analítica, libro de vida, mapa de salud y metas. Preguntas — el biógrafo IA responde según tus entradas." },
    ],

    feat_kicker: "Qué incluye",
    feats: [
      { i: "ti-book", t: "Libro de vida", d: "La IA convierte tus días en una verdadera crónica por capítulos y años." },
      { i: "ti-heart-rate-monitor", t: "Salud", d: "Peso, energía, bienestar — seguidos en el tiempo, sin registro manual." },
      { i: "ti-target", t: "Metas y sueños", d: "Un mapa de deseos y tareas — la IA los extrae de lo que contaste." },
      { i: "ti-users", t: "Personas y lugares", d: "Quién está cerca y dónde has estado — el mapa de tu vida se arma solo." },
      { i: "ti-sparkles", t: "Lo que la IA notó", d: "Patrones, qué te da energía y felicidad — una mirada externa." },
      { i: "ti-message-chatbot", t: "Biógrafo IA", d: "«¿Cuándo fui más feliz?» — respuesta en segundos según tus entradas." },
      { i: "ti-bookmarks", t: "Base de conocimiento", d: "Enlaces de Instagram y YouTube — la IA saca la esencia y la guarda para encontrarla por significado." },
      { i: "ti-camera", t: "Memoria en fotos", d: "Recibos, garantías, momentos — la IA entiende las fotos y las organiza por ti." },
      { i: "ti-books", t: "Libros y lectura", d: "Qué lees y terminaste, valoraciones y citas, meta del año y recomendaciones de la IA." },
    ],

    feat_more_n: "50+",
    feat_more_t: "funciones ya dentro",
    feat_more_d: "Y cada semana llegan nuevas. Mira el catálogo completo — seguro hay algo que no esperas de un diario.",
    feat_more_cta: "Ver todas las funciones",

    founder_kicker: "Sobre el fundador",
    founder_title: "Por qué estoy creando LIFE OS",
    founder_paras: [
      "Me llamo Igor. Empecé a crear LIFE OS no como un negocio, sino como una carta para quienes vengan después de mí.",
      "Un día me sorprendió un pensamiento simple y un poco aterrador: apenas recuerdo mi propia vida. Vacaciones, conversaciones, decisiones importantes, ideas que alguna vez me hicieron brillar los ojos — todo eso se va borrando poco a poco. Las fotos quedan, pero ya no recordamos qué pasaba fuera de cuadro ni por qué ese día importó.",
      "Y entendí algo más: todo lo que aprendí en mi vida — mis errores, descubrimientos y los momentos que valió la pena vivir — un día podría irse conmigo. Mis hijos y nietos verán fotos, pero no conocerán a la persona real que fui. Guardamos las imágenes de nuestra vida, pero casi no nos guardamos a nosotros mismos.",
      "Quería una herramienta que no exigiera disciplina. Donde bastara con hablar — como a alguien cercano — y la tecnología entendiera lo que pasó, encontrara lo importante y lo convirtiera en una historia de vida. Eso no existía. Así que empecé a crearlo yo mismo — para mí y mi familia.",
      "LIFE OS es mi diario personal, el archivo de todos mis datos y mi futuro libro de vida. Y ahora lo abro para todos los que tampoco quieren que su experiencia y sus momentos más importantes desaparezcan algún día.",
    ],
    founder_quote:
      "No quiero doblar mi vida para encajar en sistemas complejos. Debería bastar con hablar — y que la tecnología haga el resto. LIFE OS no está pensado para especialistas técnicos, sino para personas comunes.",
    founder_sign: "Igor Kholodinsky, fundador de LIFE OS",

    testi_kicker: "Testimonios",
    testi_title: "A la gente le encanta LIFE OS",
    // TODO: reemplazar con testimonios reales de usuarios (por ahora son ejemplos para el diseño)
    testi: [
      { text: "Uso LIFE OS desde hace tres meses y por primera vez no abandoné un diario. Simplemente hablo por Telegram camino a casa — y por la noche leo mi vida, ordenada por capas.", name: "Anna", role: "marketera" },
      { text: "Probé decenas de apps de notas y las dejé todas. Aquí no hay que configurar nada: hablas como a un amigo, la IA hace el resto.", name: "Dmitry", role: "emprendedor" },
      { text: "Exporté todo a Obsidian y entendí — de verdad es mío. No dependo del servicio, mis recuerdos siempre están conmigo.", name: "Sergey", role: "ingeniero" },
      { text: "Lo hago por mi hija. Quiero que algún día pueda leer en qué pensaba yo cuando ella era pequeña.", name: "Maria", role: "mamá" },
    ],

    trust_own: "Tus datos, siempre tuyos",
    trust_own_d: "Exportación a Markdown y Obsidian en un clic. Tu libro de vida se queda contigo — incluso sin internet y sin nuestro servicio.",
    trust_open: "Código abierto",
    trust_open_d: "El proyecto es público — puedes revisar cómo funciona todo.",
    trust_priv: "Privacidad honesta",
    trust_priv_d: "Solo tú ves tu diario. Descarga o elimina todo en un clic.",

    final_title: "Empieza la primera página de tu libro de vida",
    final_sub: "Gratis. Con Google o correo.",

    foot_priv: "Seguro y privado",
    foot_code: "Código en GitHub",
    foot_tester: "Para testers",
    foot_terms: "Condiciones",
    design_a: "Clásico",
    design_b: "Nuevo",
  },
};

// Премиальный светлый лендинг: ховеры, градиенты, мягкие тени, типографика.
const LP_CSS = `
@media (prefers-reduced-motion: no-preference){ html{ scroll-behavior:smooth; } }
.lp{ font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif; -webkit-font-smoothing:antialiased; letter-spacing:-.011em; }
.lp *{ box-sizing:border-box; }
.lp a{ text-decoration:none; color:inherit; }
.lp [id]{ scroll-margin-top:78px; }
.lp .lp-topbar{ position:sticky; top:0; z-index:50; background:rgba(247,248,252,.85); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid rgba(15,15,40,.06); }
.lp .lp-nav{ display:flex; align-items:center; gap:26px; }
.lp .lp-nav a{ font-size:14px; font-weight:500; color:var(--text-2); transition:color .15s; }
.lp .lp-nav a:hover{ color:var(--text); }
.lp .lp-nav a.active{ color:var(--accent); font-weight:600; }
.lp .lp-burger{ display:none; background:none; border:none; padding:6px; cursor:pointer; color:var(--text); }
.lp .lp-topbar a{ white-space:nowrap; }
@media (max-width:900px){ .lp .lp-nav{ display:none; } .lp .lp-burger{ display:inline-flex; } }
@media (max-width:640px){
  .lp .lp-topbar-in{ gap:8px !important; padding:12px 14px !important; }
  .lp .lp-topbar-in > a > span{ font-size:16px !important; }
  .lp .lp-topbar .lp-btn{ padding:8px 12px !important; font-size:13px !important; }
}
/* Панель меню и мобильная CTA рендерятся порталом в body (fixed внутри
   .lp-topbar ломается из-за backdrop-filter) — поэтому селекторы без .lp */
.lp-drawer{ position:fixed; inset:0; z-index:70; background:rgba(15,15,40,.35); backdrop-filter:blur(2px); font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif; }
.lp-drawer-panel{ position:absolute; top:0; right:0; width:min(320px, 86vw); height:100%; background:#fff; padding:76px 26px 26px; display:flex; flex-direction:column; gap:4px; box-shadow:-18px 0 44px rgba(15,15,40,.18); }
.lp-drawer-panel a{ text-decoration:none; }
.lp-drawer-panel > a:not(.lp-cta-btn){ font-size:17px; font-weight:600; color:var(--text); padding:12px 4px; border-bottom:1px solid rgba(15,15,40,.06); }
.lp-drawer-panel > a.active:not(.lp-cta-btn){ color:var(--accent); }
.lp-cta-btn{ background:linear-gradient(135deg,#6d6bf6,#8b5cf6); color:#fff !important; box-shadow:0 12px 28px -12px rgba(91,91,245,.55); }
.lp-mcta{ display:none; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif; }
.lp-mcta a{ text-decoration:none; }
@media (max-width:640px){
  .lp-mcta{ display:block; position:fixed; left:14px; right:14px; bottom:calc(14px + env(safe-area-inset-bottom)); z-index:60; opacity:0; transform:translateY(16px); pointer-events:none; transition:opacity .25s, transform .25s; }
  .lp-mcta.on{ opacity:1; transform:none; pointer-events:auto; }
}
.lp .lp-kicker{ font-size:12.5px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--accent); }
.lp .lp-h1{ font-size:clamp(34px,6.4vw,60px); font-weight:800; line-height:1.06; letter-spacing:-.03em; margin:0 0 20px; text-wrap:balance; }
.lp .lp-h2{ font-size:clamp(25px,4vw,36px); font-weight:800; letter-spacing:-.025em; margin:0; text-wrap:balance; }
.lp .lp-badge{ display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:var(--accent-text); background:#fff; border:1px solid var(--border); padding:7px 14px; border-radius:999px; box-shadow:0 2px 10px -4px rgba(20,24,40,.14); }
.lp .lp-badge .dot{ width:6px; height:6px; border-radius:50%; background:linear-gradient(135deg,#6d6bf6,#8b5cf6); box-shadow:0 0 0 3px rgba(124,92,246,.16); }
.lp .lp-btn{ background:linear-gradient(135deg,#6d6bf6,#8b5cf6); color:#fff; box-shadow:0 12px 28px -12px rgba(91,91,245,.55); transition:transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.lp .lp-btn:hover{ transform:translateY(-2px); box-shadow:0 18px 40px -12px rgba(91,91,245,.62); filter:brightness(1.04); }
.lp .lp-ghost{ background:#fff; color:var(--text); border:1px solid var(--border); box-shadow:0 2px 10px -6px rgba(20,24,40,.18); transition:transform .18s ease, box-shadow .18s ease; }
.lp .lp-ghost:hover{ transform:translateY(-2px); box-shadow:0 14px 30px -14px rgba(20,24,40,.3); }
.lp .lp-card{ background:var(--surface); border:1px solid var(--border); border-radius:18px; box-shadow:0 1px 2px rgba(20,24,40,.04), 0 12px 32px -20px rgba(20,24,40,.18); transition:transform .2s ease, box-shadow .2s ease; }
.lp .lp-card:hover{ transform:translateY(-4px); box-shadow:0 1px 2px rgba(20,24,40,.05), 0 26px 50px -24px rgba(20,24,40,.26); }
.lp .lp-link{ transition:color .15s; }
.lp .lp-link:hover{ color:var(--text); }
.lp .lp-band{ background:var(--surface); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.lp .about-caps summary::-webkit-details-marker{ display:none; }
.lp details[open] .about-caps-chevron{ transform:rotate(180deg); }
@media (max-width:600px){ .lp .lp-h1{ font-size:34px; } }
`;

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ ref?: string; d?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = C[locale] || C.ru;
  const GH = "https://github.com/top15igor/life-os";
  // Залогиненный гость пришёл по логотипу — прячем призывы «войти/создать аккаунт».
  const isAuthed = !!(await getCurrentUser());
  // Реферал: пробрасываем метку на страницу входа, чтобы пригласивший засчитался.
  const ref = sp.ref && /^[A-Za-z0-9-]{3,40}$/.test(sp.ref) ? sp.ref : "";
  const loginHref = ref ? `/login?ref=${encodeURIComponent(ref)}` : "/login";
  // Какой дизайн показывать: B (новый) или A (классический, по умолчанию).
  const design = sp.d === "b" ? "b" : "a";

  // Новый дизайн (Дизайн B) — основной остаётся A, переключатель-пилюля внизу справа.
  if (design === "b") {
    return <AboutModern locale={locale} intl={intlOf(locale)} isAuthed={isAuthed} loginHref={loginHref} refCode={ref} />;
  }

  const section: React.CSSProperties = { maxWidth: 920, margin: "0 auto", padding: "0 22px" };
  const kicker: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 10,
  };

  // Полный перечень возможностей для раскрывающегося блока «Как использовать».
  const caps = capabilities(locale);

  // Врезка-мост на лендинг /one-place (заметки, списки, напоминания в одном месте).
  const ONE_PLACE: Record<string, { t: string; d: string; cta: string }> = {
    ru: { t: "Все заметки и напоминания — в одном месте", d: "Заметки айфона, сохранёнки Инстаграма, файлы, стикеры и будильники — в одной базе, которая сама напоминает вовремя.", cta: "Посмотреть" },
    en: { t: "All your notes and reminders — in one place", d: "iPhone notes, Instagram saves, files, sticky notes and alarms — in one base that reminds you on time.", cta: "Take a look" },
    uk: { t: "Усі нотатки й нагадування — в одному місці", d: "Нотатки айфона, збережене з Інстаграму, файли, наліпки й будильники — в одній базі, що нагадує вчасно.", cta: "Подивитись" },
    fr: { t: "Toutes vos notes et rappels — en un seul endroit", d: "Notes iPhone, enregistrements Instagram, fichiers, post-it et alarmes — dans une seule base qui vous rappelle à temps.", cta: "Voir" },
    es: { t: "Todas tus notas y recordatorios — en un solo lugar", d: "Notas del iPhone, guardados de Instagram, archivos, pósits y alarmas — en una sola base que te recuerda a tiempo.", cta: "Ver" },
  };
  const onePlace = ONE_PLACE[locale] || ONE_PLACE.ru;

  // Лендинг — СВОЯ светлая палитра (не зависит от темы посетителя): чистый премиальный
  // вид + мягкая «аврора» под первым экраном. Ховеры/градиенты — в LP_CSS ниже.
  const shell = {
    ["--bg" as any]: "#f7f8fc",
    ["--surface" as any]: "#ffffff",
    ["--surface-2" as any]: "#eef1f8",
    ["--text" as any]: "#14161c",
    ["--text-2" as any]: "#4a5261",
    ["--text-3" as any]: "#8b93a3",
    ["--border" as any]: "rgba(20,24,40,0.08)",
    ["--accent" as any]: "#5b5bf5",
    ["--accent-bg" as any]: "#edecff",
    ["--accent-text" as any]: "#4338ca",
    colorScheme: "light",
    color: "var(--text)",
    minHeight: "100dvh",
    background:
      "radial-gradient(820px 460px at 16% -8%, rgba(124,92,246,0.20), transparent 60%)," +
      "radial-gradient(820px 460px at 86% -4%, rgba(91,91,245,0.16), transparent 60%)," +
      "#f7f8fc",
  } as React.CSSProperties;

  return (
    <div style={shell} className="lp" id="top">
      <style dangerouslySetInnerHTML={{ __html: LP_CSS }} />
      {/* Top bar — липкая шапка с якорной навигацией */}
      <div className="lp-topbar">
        <div className="lp-topbar-in" style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 22px" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
            <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>LIFE OS</span>
          </a>
          <LandingNav
            links={[
              { href: "#why", label: (t as any).nav_why },
              { href: "#how", label: (t as any).nav_how },
              { href: "#inside", label: (t as any).nav_feat },
              { href: "#reviews", label: (t as any).nav_rev },
            ]}
            ctaLabel={t.cta_create}
            ctaHref={isAuthed ? "/" : loginHref}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LangMenu current={locale} align="right" />
            <a
              href={isAuthed ? "/" : loginHref}
              className="lp-btn"
              style={{ padding: "9px 17px", borderRadius: 11, fontSize: 14, fontWeight: 600 }}
            >
              {isAuthed ? t.back_to_app : t.nav_login}
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ ...section, textAlign: "center", padding: "64px 22px 40px" }}>
        <div className="lp-badge" style={{ marginBottom: 26 }}>
          <span className="dot" />{t.hero_badge}
        </div>
        <h1 className="lp-h1">{t.hero_title}</h1>
        <p style={{ fontSize: "clamp(16px, 2.4vw, 20px)", color: "var(--text-2)", lineHeight: 1.6, maxWidth: 640, margin: "0 auto 32px" }}>
          {t.hero_sub}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={isAuthed ? "/" : loginHref} className="lp-btn" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 30px", borderRadius: 14, fontSize: 16, fontWeight: 600 }}>
            {t.cta_create}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>
        {(t as any).hero_note && <div style={{ fontSize: 14, color: "var(--text-2)", fontStyle: "italic", marginTop: 13, fontFamily: "var(--font-serif, Georgia, serif)" }}>— {(t as any).hero_note}</div>}
        {!isAuthed && <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 10 }}>{t.cta_hint}</div>}

        {/* Живой показ продукта: голосовое → разбор → карточка записи */}
        <ProductPeek locale={locale} />
      </div>

      {/* Idea */}
      <div id="why" style={{ ...section, padding: "56px 22px" }}>
        <div className="lp-kicker">{t.idea_kicker}</div>
        <h2 className="lp-h2" style={{ margin: "10px 0 18px" }}>{t.idea_title}</h2>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 14px", maxWidth: 700 }}>{t.idea_p1}</p>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: 0, maxWidth: 700 }}>{t.idea_p2}</p>
      </div>

      {/* CRM-контраст — для прагматиков/предпринимателей */}
      {(t as any).crm_title && (
        <div style={{ ...section, padding: "0 22px 56px" }}>
          <div className="card" style={{ borderLeft: "3px solid var(--accent)", background: "var(--accent-bg)", padding: "22px 24px" }}>
            <div className="lp-kicker" style={{ marginBottom: 10 }}>{(t as any).crm_kicker}</div>
            <h2 className="lp-h2" style={{ margin: "0 0 14px", fontSize: "clamp(22px, 3vw, 30px)", maxWidth: 720 }}>{(t as any).crm_title}</h2>
            <p style={{ fontSize: 16.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 12px", maxWidth: 720 }}>{(t as any).crm_p1}</p>
            <p style={{ fontSize: 16.5, color: "var(--text)", fontWeight: 500, lineHeight: 1.6, margin: 0, maxWidth: 720 }}>{(t as any).crm_p2}</p>
            {(t as any).crm_hist && (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>{(t as any).crm_histT}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {(t as any).crm_hist.map((it: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <i className="ti ti-user-check" style={{ fontSize: 17, color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 700 }}>
                        <b style={{ color: "var(--text)" }}>{it.n}</b> {it.d}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Заметки и напоминания — маркет-фича «всё в одном месте» */}
      {(t as any).mem_title && (
        <div style={{ ...section, padding: "0 22px 56px" }}>
          <div className="lp-kicker">{(t as any).mem_kicker}</div>
          <h2 className="lp-h2" style={{ margin: "10px 0 12px" }}>{(t as any).mem_title}</h2>
          <p style={{ fontSize: 16.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 700 }}>{(t as any).mem_lead}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {(t as any).mem_cards.map((f: any) => (
              <div key={f.t} className="lp-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column" }}>
                <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 13, background: "var(--accent-bg)", alignItems: "center", justifyContent: "center" }}>
                  <i className={`ti ${f.i}`} style={{ fontSize: 23, color: "var(--accent)" }} />
                </span>
                <div style={{ fontSize: 17, fontWeight: 700, margin: "14px 0 6px", letterSpacing: "-0.01em" }}>{f.t}</div>
                <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>{f.d}</div>
                <div style={{ marginTop: "auto", fontSize: 13.5, color: "var(--accent-text, var(--accent))", background: "var(--accent-bg)", borderRadius: 11, padding: "8px 12px", lineHeight: 1.45 }}>{f.ex}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, margin: "18px 0 0", fontStyle: "italic" }}>{(t as any).mem_foot}</p>
        </div>
      )}

      {/* How */}
      <div id="how" className="lp-band" style={{ padding: "60px 0" }}>
        <div style={section}>
          <div className="lp-kicker">{t.how_kicker}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginTop: 18 }}>
            {t.how.map((s) => (
              <div key={s.n}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, marginBottom: 14, boxShadow: "0 10px 22px -10px rgba(91,91,245,.6)" }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 18.5, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>{s.t}</div>
                <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="inside" style={{ ...section, padding: "60px 22px" }}>
        <div className="lp-kicker" style={{ marginBottom: 22 }}>{t.feat_kicker}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          {t.feats.map((f) => (
            <div key={f.t} className="lp-card" style={{ padding: "22px 20px" }}>
              <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 13, background: "var(--accent-bg)", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${f.i}`} style={{ fontSize: 23, color: "var(--accent)" }} />
              </span>
              <div style={{ fontSize: 17, fontWeight: 700, margin: "14px 0 6px", letterSpacing: "-0.01em" }}>{f.t}</div>
              <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55 }}>{f.d}</div>
            </div>
          ))}
        </div>

        {/* «50+ возможностей» — мост в полный каталог /features */}
        <a
          href="/features"
          className="lp-card"
          style={{
            display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
            marginTop: 16, padding: "26px 28px", textDecoration: "none",
            border: "1px solid var(--accent)", background: "var(--accent-bg)",
          }}
        >
          <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(44px, 7vw, 64px)", fontWeight: 600, lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.02em" }}>
            {t.feat_more_n}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 5 }}>{t.feat_more_t}</div>
            <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 520 }}>{t.feat_more_d}</div>
          </div>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 20px", borderRadius: 12, background: "var(--accent)",
              color: "#fff", fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap",
            }}
          >
            {t.feat_more_cta}
            <i className="ti ti-arrow-right" style={{ fontSize: 17 }} />
          </span>
        </a>

        {/* Мост на лендинг «Всё в одном месте» — заметки, списки, напоминания */}
        <a
          href="/one-place"
          className="lp-card"
          style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 12, padding: "20px 24px", textDecoration: "none" }}
        >
          <span style={{ fontSize: 26, lineHeight: 1 }}>🗂</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 4 }}>{onePlace.t}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 560 }}>{onePlace.d}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14.5, fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap" }}>
            {onePlace.cta}
            <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
          </span>
        </a>
      </div>

      {/* Capabilities — how to use / full feature list (expandable) */}
      <div className="lp-band" style={{ padding: "60px 0" }}>
        <div style={section}>
          <div className="lp-kicker">{caps.kicker}</div>
          <h2 className="lp-h2" style={{ margin: "10px 0 12px" }}>{caps.title}</h2>
          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 640 }}>{caps.sub}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 12, alignItems: "start" }}>
            {caps.groups.map((grp, gi) => (
              <details
                key={grp.title}
                className="about-caps"
                open={gi === 0}
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}
              >
                <summary
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 18px",
                    cursor: "pointer",
                    listStyle: "none",
                    userSelect: "none",
                  }}
                >
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${grp.icon}`} style={{ fontSize: 20, color: grp.color }} />
                  </span>
                  <span style={{ flex: 1, fontSize: 16.5, fontWeight: 600 }}>{grp.title}</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)", flexShrink: 0 }}>{grp.items.length}</span>
                  <i className="ti ti-chevron-down about-caps-chevron" style={{ fontSize: 18, color: "var(--text-3)", flexShrink: 0, transition: "transform 0.2s" }} />
                </summary>
                <div style={{ padding: "2px 18px 16px" }}>
                  {grp.items.map((it) => (
                    <div key={it.name} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                      <i className={`ti ${it.icon}`} style={{ fontSize: 18, color: grp.color, flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3 }}>{it.name}</div>
                        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{it.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Founder */}
      <div style={{ padding: "64px 0" }}>
        <div style={{ ...section, maxWidth: 720 }}>
          <div className="lp-kicker">{t.founder_kicker}</div>
          <h2 className="lp-h2" style={{ fontSize: "clamp(23px, 3.6vw, 32px)", margin: "10px 0 20px" }}>{t.founder_title}</h2>
          {t.founder_paras.map((p, i) => (
            <p key={i} style={{ fontSize: 17, color: i === 0 ? "var(--text)" : "var(--text-2)", lineHeight: 1.65, margin: "0 0 14px" }}>{p}</p>
          ))}
          <blockquote
            style={{
              borderLeft: "3px solid var(--accent)",
              background: "var(--accent-bg)",
              borderRadius: "0 12px 12px 0",
              padding: "16px 20px",
              margin: "22px 0",
              fontSize: 17.5,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--text)",
              lineHeight: 1.6,
            }}
          >
            {t.founder_quote}
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
              И
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t.founder_sign}</div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="reviews" className="lp-band" style={{ padding: "60px 0" }}>
        <div style={section}>
        <div className="lp-kicker">{t.testi_kicker}</div>
        <h2 className="lp-h2" style={{ margin: "10px 0 26px" }}>{t.testi_title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {t.testi.map((r, i) => (
            <div key={i} className="lp-card" style={{ background: "var(--bg)", padding: "24px 22px", display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#f5a623", fontSize: 15, letterSpacing: 2, marginBottom: 12 }}>★★★★★</div>
              <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.6, margin: "0 0 18px", flex: 1 }}>«{r.text}»</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Trust */}
      <div style={{ ...section, padding: "60px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          <div className="lp-card" style={{ padding: "22px 20px" }}>
            <i className="ti ti-download" style={{ fontSize: 24, color: "var(--accent)" }} />
            <div style={{ fontSize: 16.5, fontWeight: 700, margin: "12px 0 5px" }}>{t.trust_own}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_own_d}</div>
          </div>
          <a href={GH} target="_blank" rel="noreferrer" className="lp-card" style={{ display: "block", padding: "22px 20px", color: "var(--text)" }}>
            <i className="ti ti-brand-github" style={{ fontSize: 24 }} />
            <div style={{ fontSize: 16.5, fontWeight: 700, margin: "12px 0 5px" }}>{t.trust_open}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_open_d}</div>
          </a>
          <a href="/privacy" className="lp-card" style={{ display: "block", padding: "22px 20px", color: "var(--text)" }}>
            <span style={{ fontSize: 23 }}>🔒</span>
            <div style={{ fontSize: 16.5, fontWeight: 700, margin: "12px 0 5px" }}>{t.trust_priv}</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{t.trust_priv_d}</div>
          </a>
        </div>
      </div>

      {/* Final CTA (id=start: рядом с ним мобильная липкая CTA прячется) */}
      <div id="start" style={{ ...section, padding: "10px 22px 72px" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: "56px 40px", textAlign: "center", color: "#fff", background: "linear-gradient(135deg,#5b5bf5,#8b5cf6 55%,#a855f7)", boxShadow: "0 30px 70px -30px rgba(91,91,245,.7)" }}>
          <div style={{ position: "absolute", top: -80, right: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.22),transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 12px", textWrap: "balance" }}>{t.final_title}</h2>
          {!isAuthed && <p style={{ position: "relative", fontSize: 16.5, color: "rgba(255,255,255,.9)", margin: "0 0 26px" }}>{t.final_sub}</p>}
          <a href={isAuthed ? "/" : loginHref} className="lp-ghost" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9, marginTop: isAuthed ? 12 : 0, padding: "15px 34px", borderRadius: 14, background: "#fff", color: "#5b3ef5", border: "none", fontSize: 16.5, fontWeight: 700, boxShadow: "0 14px 30px -12px rgba(0,0,0,.35)" }}>
            {t.cta_create}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "24px 22px" }}>
        <div style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)", fontSize: 14 }}>
            <i className="ti ti-flower" style={{ fontSize: 16, color: "var(--accent)" }} />
            LIFE OS
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            {/* Приватность — выделена кнопкой: это главный вопрос доверия к дневнику. */}
            <a
              href="/privacy"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: 10,
                border: "1px solid var(--accent)", background: "var(--accent-bg)",
                color: "var(--accent-text)", fontSize: 13.5, fontWeight: 600, textDecoration: "none",
              }}
            >
              <i className="ti ti-shield-lock" style={{ fontSize: 16, color: "var(--accent)" }} />
              {t.foot_priv}
            </a>
            <a href={ref ? `/tester.html?ref=${encodeURIComponent(ref)}` : "/tester.html"} style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_tester}</a>
            <a href="/terms" style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_terms}</a>
            <a href={GH} target="_blank" rel="noreferrer" style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_code}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
