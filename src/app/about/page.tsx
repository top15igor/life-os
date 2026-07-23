import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { intlOf } from "@/lib/i18n";
import AboutModern from "@/components/about/AboutModern";
import LangMenu from "@/components/LangMenu";
import { capabilities } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

const C = {
  ru: {
    nav_login: "Войти",
    back_to_app: "В приложение",
    hero_badge: "Фотографии хранят, как ты выглядел. LIFE OS — каким ты был.",
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
    design_a: "Классика",
    design_b: "Новый",
  },
  en: {
    nav_login: "Sign in",
    back_to_app: "Back to app",
    hero_badge: "Photos keep how you looked. LIFE OS keeps who you were.",
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
    design_a: "Classic",
    design_b: "New",
  },
  uk: {
    nav_login: "Увійти",
    back_to_app: "До застосунку",
    hero_badge: "Фото зберігають, який ти був на вигляд. LIFE OS — яким ти був.",
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
    design_a: "Класика",
    design_b: "Новий",
  },
  fr: {
    nav_login: "Se connecter",
    back_to_app: "Vers l'app",
    hero_badge: "Les photos gardent ton apparence. LIFE OS garde qui tu étais.",
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
    design_a: "Classique",
    design_b: "Nouveau",
  },
  es: {
    nav_login: "Iniciar sesión",
    back_to_app: "Volver a la app",
    hero_badge: "Las fotos guardan cómo te veías. LIFE OS guarda quién eras.",
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
    design_a: "Clásico",
    design_b: "Nuevo",
  },
};

// Премиальный светлый лендинг: ховеры, градиенты, мягкие тени, типографика.
const LP_CSS = `
.lp{ font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif; -webkit-font-smoothing:antialiased; letter-spacing:-.011em; }
.lp *{ box-sizing:border-box; }
.lp a{ text-decoration:none; color:inherit; }
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

  // Новый дизайн (Дизайн B) — доступен по ?d=b (переключатель убран, основной — A).
  if (design === "b") {
    return <AboutModern locale={locale} intl={intlOf(locale)} isAuthed={isAuthed} loginHref={loginHref} />;
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
    <div style={shell} className="lp">
      <style dangerouslySetInnerHTML={{ __html: LP_CSS }} />
      {/* Top bar */}
      <div style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>LIFE OS</span>
        </div>
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
            {isAuthed ? t.back_to_app : t.cta_create}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>
        {(t as any).hero_note && <div style={{ fontSize: 14, color: "var(--text-2)", fontStyle: "italic", marginTop: 13, fontFamily: "var(--font-serif, Georgia, serif)" }}>— {(t as any).hero_note}</div>}
        {!isAuthed && <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 10 }}>{t.cta_hint}</div>}
      </div>

      {/* Idea */}
      <div style={{ ...section, padding: "56px 22px" }}>
        <div className="lp-kicker">{t.idea_kicker}</div>
        <h2 className="lp-h2" style={{ margin: "10px 0 18px" }}>{t.idea_title}</h2>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 14px", maxWidth: 700 }}>{t.idea_p1}</p>
        <p style={{ fontSize: 17, color: "var(--text-2)", lineHeight: 1.6, margin: 0, maxWidth: 700 }}>{t.idea_p2}</p>
      </div>

      {/* How */}
      <div className="lp-band" style={{ padding: "60px 0" }}>
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
      <div style={{ ...section, padding: "60px 22px" }}>
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
      <div className="lp-band" style={{ padding: "60px 0" }}>
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

      {/* Final CTA */}
      <div style={{ ...section, padding: "10px 22px 72px" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: "56px 40px", textAlign: "center", color: "#fff", background: "linear-gradient(135deg,#5b5bf5,#8b5cf6 55%,#a855f7)", boxShadow: "0 30px 70px -30px rgba(91,91,245,.7)" }}>
          <div style={{ position: "absolute", top: -80, right: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.22),transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 12px", textWrap: "balance" }}>{t.final_title}</h2>
          {!isAuthed && <p style={{ position: "relative", fontSize: 16.5, color: "rgba(255,255,255,.9)", margin: "0 0 26px" }}>{t.final_sub}</p>}
          <a href={isAuthed ? "/" : loginHref} className="lp-ghost" style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 9, marginTop: isAuthed ? 12 : 0, padding: "15px 34px", borderRadius: 14, background: "#fff", color: "#5b3ef5", border: "none", fontSize: 16.5, fontWeight: 700, boxShadow: "0 14px 30px -12px rgba(0,0,0,.35)" }}>
            {isAuthed ? t.back_to_app : t.cta_create}
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
            <a href={GH} target="_blank" rel="noreferrer" style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "none" }}>{t.foot_code}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
