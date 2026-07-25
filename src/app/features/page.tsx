import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Item = { t: string; d: string; soon?: boolean };
type Cat = { kicker: string; title: string; lead: string; edge?: string; items: Item[] };
type Dict = { badge: string; title: string; lead: string; metaCount: string; metaA: string; metaB: string; login: string; app: string; backHome: string; cats: Cat[]; closeKicker: string; closeTitle: string; closeText: string; sign: string; foot: string; final: string; finalCta: string };

const RU: Dict = {
  badge: "Каталог возможностей",
  title: "Твоя жизнь, собранная в одном месте — и сохранённая навсегда",
  lead: "Сохранись. Ты просто живёшь и рассказываешь о днях — а LIFE OS запоминает, понимает и пишет твою Книгу жизни. По одной записи в день — чтобы было куда вернуться.",
  metaCount: "50+ возможностей", metaA: "Telegram-бот + веб", metaB: "5 языков",
  login: "Войти", app: "В приложение", backHome: "На главную",
  closeKicker: "Одна идея", closeTitle: "Ты просто живёшь. Остальное — на мне.",
  closeText: "Каждый день — ещё одна страница, которая не исчезнет. Через год это уже история, которую приятно перечитывать. Через жизнь — то, что останется.",
  sign: "💾 LIFE OS — Сохранись.",
  final: "Начни первую страницу своей Книги жизни", finalCta: "Создать аккаунт",
  foot: "Каталог возможностей LIFE OS · обновляется по мере роста продукта",
  cats: [
    { kicker: "Запись жизни", title: "Дневник, который ведёт себя сам", lead: "Расскажи про день — остальное LIFE OS сделает за тебя: разберёт, разложит по полочкам и ответит по-человечески.", edge: "var(--accent)", items: [
      { t: "Голосом и текстом", d: "Наговори или напиши боту в Telegram. Голос расшифрую сам, длинные — сохраню целиком." },
      { t: "AI-разбор записи", d: "Настроение, энергия, люди, места, категории и теги — размечаются автоматически." },
      { t: "Само раскладывается", d: "Задачи, идеи, благодарности, обещания, добрые дела и мечты попадают в свои разделы." },
      { t: "Тёплое резюме", d: "Ответ от первого лица и серия дней подряд 🔥 — приятно возвращаться каждый день." },
      { t: "«Исправь…»", d: "Не так расслышал? Поправлю последнюю запись без дублей — просто скажи об этом." },
      { t: "Фото и документы", d: "Пришли чек, договор или вещь — пойму смысл, извлеку данные и сохраню в Память." },
    ] },
    { kicker: "Живой AI", title: "Друг, который тебя знает", lead: "Не абстрактный чат-бот, а собеседник, который помнит всю твою жизнь и умеет действовать.", edge: "#3b82f6", items: [
      { t: "Режим беседы", d: "Друг помнит весь дневник, финансы и заметки, ищет свежее в сети и держит нить разговора." },
      { t: "Действия голосом", d: "«Поставь напоминание», «добавь задачу», «запиши вес», «отметь сделанным» — выполнит и подтвердит." },
      { t: "Память по смыслу", d: "«Что я говорил про маму», «когда болел» — найдёт нужное даже в старых записях." },
      { t: "Спроси свою жизнь", d: "Вопрос по своему дневнику — «когда я был счастлив?», «сколько потратил на кафе?»." },
      { t: "Отвечает голосом", d: "Напишешь голосовым — ответит голосовым. Как живой разговор." },
      { t: "9 тонов общения", d: "От тёплого друга до делового — под твой стиль, меняется в один тап." },
      { t: "«Дай рецепт…»", d: "Спроси о сохранённом — бот ответит из твоей Базы знаний, а не запишет вопрос в дневник." },
      { t: "🌍 Добрая новость дня", d: "Каждый день — одна тёплая новость из мира. Маленькая привычка видеть хорошее." },
    ] },
    { kicker: "Главное", title: "Книга жизни", lead: "Каждая запись — страница. LIFE OS превращает твой дневник в настоящую книгу — оформить, распечатать, подарить.", edge: "var(--accent)", items: [
      { t: "Авто-сборка по главам", d: "Люди, события, год за годом — книга собирается сама из твоих записей." },
      { t: "Авторский голос", d: "Ракурс, тон, посыл и кому книга: себе, родителям, детям, партнёру, семье." },
      { t: "Автобиография для публики", d: "AI пишет так, будто книгу прочтут незнакомцы: с контекстом, без личных недомолвок." },
      { t: "Премиум-оформление", d: "Обложки, шрифты, буквица, эпиграф, готовые темы — «дорого-богато» без перебора." },
      { t: "Редактор прямо в книге", d: "Правь главы, объединяй людей и проекты в одну сущность — не выходя из книги." },
      { t: "Скачать и напечатать", d: "PDF в один клик или заказать физическую книгу — идеальный подарок близким." },
    ] },
    { kicker: "CRM наоборот", title: "Всё о тебе — под рукой", lead: "Задачи, цели, деньги, люди, здоровье, места. LIFE OS держит твою жизнь в порядке, как CRM держит бизнес — только помнит не клиентов, а тебя.", items: [
      { t: "🎯 Цели и задачи", d: "С горизонтами Сегодня / Неделя / Месяц — AI сам раскладывает, ты корректируешь." },
      { t: "⏰ Напоминания", d: "Обычными словами, с повторами, синхронизация с Google Календарём." },
      { t: "💰 Деньги", d: "Расходы и доходы, отчёты и советы; авто-подтягивание из банка (Monobank)." },
      { t: "🤝 Мой след", d: "Добрые дела, выполненные обещания и благодарности — то, чем стоит гордиться." },
      { t: "👥 Люди", d: "Карточка каждого человека: последний контакт, настроение рядом, обещания и добрые дела." },
      { t: "💛 Давно не общались", d: "LIFE OS замечает, кто из близких пропал из записей, а бот раз в неделю присылает «повод написать»." },
      { t: "✈️ Места и путешествия", d: "Хроника поездок и мест, куда хочется вернуться." },
      { t: "❤️ Здоровье", d: "Вес, спорт, самочувствие; синхрон с Apple Health и Google Fit." },
      { t: "📚 Знания и медиатека", d: "База заметок и читательский дневник — книги по фото обложки." },
      { t: "🖼 Память", d: "Визуальный архив документов, чеков и моментов с извлечёнными данными." },
    ] },
    { kicker: "Интеллект", title: "AI видит то, чего не замечаешь ты", lead: "LIFE OS не просто хранит — он понимает и подсказывает, как внимательный близкий человек.", edge: "#3b82f6", items: [
      { t: "Что заметил AI", d: "Закономерности и связи в твоей жизни, которые сам ты пропускаешь." },
      { t: "Джарвис замечает", d: "Иногда сам мягко подскажет: «давно не был в зале — сходим сегодня?»." },
      { t: "Биограф", d: "Помощник, который расспрашивает и превращает ответы в главы твоей истории." },
      { t: "Портрет", d: "«Что ты обо мне знаешь» — AI собирает тебя из всего, что ты рассказал." },
      { t: "Лаборатория", d: "Экспериментальные AI-инструменты — то, что появляется первым." },
    ] },
    { kicker: "Наследие", title: "То, что останется", lead: "То, ради чего всё это. Память стирается — записи нет. Твоя история останется тем, кто будет после.", edge: "var(--lotus, #cf5f92)", items: [
      { t: "Давай познакомимся", d: "Бот бережно расспрашивает и наполняет книгу; отношения растут по «лестнице близости»." },
      { t: "📸 В этот день", d: "Что у тебя было в этот самый день год, два, три назад — тёплое «а помнишь…»." },
      { t: "⏳ Капсула времени", d: "Письмо в будущее — доставлю точно в назначенный день. Себе, детям, любимому." },
      { t: "👨‍👩‍👧 Наследники", d: "Назначаешь, кому однажды откроется твоя Книга жизни.", soon: true },
      { t: "🎙 Голос навсегда", d: "Твои голосовые сохранятся как твой голос для потомков — можно переслушать.", soon: true },
    ] },
    { kicker: "Близкие и рост", title: "Не только про тебя", lead: "LIFE OS соединяет с теми, кто дорог — и растёт вместе с ними.", items: [
      { t: "Сообщения близким", d: "«Передай Ане, что опоздаю» — доставлю прямо ей, прозвища поддерживаются." },
      { t: "Приглашай близких", d: "Реферальные ссылки и награды — зови тех, кому это тоже нужно." },
      { t: "Книга в подарок", d: "Подари Книгу жизни родителям или партнёру — самый личный подарок." },
      { t: "Вишлист", d: "Список желаний по ссылкам — чтобы близкие знали, чем тебя порадовать." },
    ] },
    { kicker: "Доверие и удобство", title: "Твои данные — твои", lead: "Честно про приватность, удобно каждый день, без спама.", items: [
      { t: "5 языков", d: "Русский, English, Українська, Français, Español — интерфейс, бот и книга." },
      { t: "Данные всегда с тобой", d: "Экспорт в Obsidian (.zip) и ежемесячный авто-бэкап дневника." },
      { t: "Приватность и PIN", d: "Записи видишь только ты; вход можно закрыть PIN-кодом. Код проекта открыт." },
      { t: "Мягкие напоминания", d: "Тёплое утро и вечер — но если уже писал сегодня, лишний раз не потревожу." },
      { t: "Итоги", d: "Недельный AI-обзор и месячный финансовый отчёт приходят сами." },
    ] },
  ],
};

const EN: Dict = {
  badge: "Feature catalog",
  title: "Your life, gathered in one place — and kept forever",
  lead: "Save yourself. You just live and tell it about your days — and LIFE OS remembers, understands and writes your Book of Life. One entry a day — so you have somewhere to return.",
  metaCount: "50+ features", metaA: "Telegram bot + web", metaB: "5 languages",
  login: "Log in", app: "Open app", backHome: "Home",
  closeKicker: "One idea", closeTitle: "You just live. I'll handle the rest.",
  closeText: "Every day is one more page that won't disappear. In a year it's a story worth rereading. In a lifetime — what remains.",
  sign: "💾 LIFE OS — Save yourself.",
  final: "Start the first page of your Book of Life", finalCta: "Create account",
  foot: "LIFE OS feature catalog · updated as the product grows",
  cats: [
    { kicker: "Capturing life", title: "A diary that keeps itself", lead: "Just tell it about your day — LIFE OS does the rest: parses it, sorts it and replies like a human.", edge: "var(--accent)", items: [
      { t: "Voice & text", d: "Speak or type to the Telegram bot. Voice is transcribed; long notes saved in full." },
      { t: "AI parsing", d: "Mood, energy, people, places, categories and tags — tagged automatically." },
      { t: "Self-sorting", d: "Tasks, ideas, gratitude, promises, good deeds and dreams land in their sections." },
      { t: "Warm recap", d: "A first-person reply and a daily streak 🔥 — nice to come back to every day." },
      { t: "“Correct…”", d: "Misheard? I'll fix the last entry, no duplicates — just say so." },
      { t: "Photos & documents", d: "Send a receipt, contract or item — I'll grasp it, extract data and save it to Memory." },
    ] },
    { kicker: "Living AI", title: "A friend who knows you", lead: "Not an abstract chatbot, but a companion who remembers your whole life and can act.", edge: "#3b82f6", items: [
      { t: "Chat mode", d: "Remembers your diary, finances and notes, checks the web and holds the conversation." },
      { t: "Acts by voice", d: "“Set a reminder”, “add a task”, “log my weight”, “mark it done” — done and confirmed." },
      { t: "Memory by meaning", d: "“What did I say about mom”, “when was I sick” — finds it, even in old entries." },
      { t: "Ask your life", d: "A question about your own diary — “when was I happy?”, “how much on cafes?”." },
      { t: "Replies by voice", d: "Send a voice note — it replies with a voice message. Like a real conversation." },
      { t: "9 tones", d: "From a warm friend to businesslike — your style, changed in one tap." },
      { t: "“Give me that recipe…”", d: "Ask about something you saved — the bot answers from your Knowledge base instead of logging the question." },
      { t: "🌍 Good news of the day", d: "One warm story from the world every day. A small habit of noticing the good." },
    ] },
    { kicker: "The heart", title: "Book of Life", lead: "Every entry is a page. LIFE OS turns your diary into a real book — design it, print it, gift it.", edge: "var(--accent)", items: [
      { t: "Auto-assembled chapters", d: "People, events, year by year — the book builds itself from your entries." },
      { t: "Author's voice", d: "Perspective, tone, message and recipient: yourself, parents, kids, partner, family." },
      { t: "Autobiography for the public", d: "AI writes as if strangers will read it: with context, no private in-jokes." },
      { t: "Premium design", d: "Covers, fonts, drop cap, epigraph, ready themes — elegant, never overdone." },
      { t: "Edit inside the book", d: "Edit chapters, merge people and projects into one entity — without leaving the book." },
      { t: "Download & print", d: "One-click PDF or order a physical book — the most personal gift." },
    ] },
    { kicker: "CRM in reverse", title: "Everything about you — at hand", lead: "Tasks, goals, money, people, health, places. LIFE OS keeps your life in order like a CRM keeps a business — only it remembers you, not your clients.", items: [
      { t: "🎯 Goals & tasks", d: "With Today / Week / Month horizons — AI sorts, you adjust." },
      { t: "⏰ Reminders", d: "In plain words, with repeats, synced to Google Calendar." },
      { t: "💰 Money", d: "Expenses and income, reports and tips; auto-import from your bank (Monobank)." },
      { t: "🤝 My trace", d: "Good deeds, kept promises and gratitude — things worth being proud of." },
      { t: "👥 People", d: "A card for every person: last contact, mood around them, promises and good deeds." },
      { t: "💛 It's been a while", d: "LIFE OS notices which close ones faded from your entries, and once a week the bot sends “a reason to reach out”." },
      { t: "✈️ Places & travel", d: "A chronicle of trips and places worth returning to." },
      { t: "❤️ Health", d: "Weight, sport, wellbeing; synced with Apple Health and Google Fit." },
      { t: "📚 Knowledge & media", d: "A notes base and a reading log — books by a cover photo." },
      { t: "🖼 Memory", d: "A visual archive of documents, receipts and moments with extracted data." },
    ] },
    { kicker: "Intelligence", title: "AI sees what you miss", lead: "LIFE OS doesn't just store — it understands and nudges, like an attentive close friend.", edge: "#3b82f6", items: [
      { t: "What AI noticed", d: "Patterns and links in your life you tend to overlook." },
      { t: "Jarvis notices", d: "Sometimes nudges you: “haven't hit the gym in a while — go today?”." },
      { t: "Biographer", d: "A helper that asks questions and turns answers into chapters of your story." },
      { t: "Portrait", d: "“What do you know about me” — AI assembles you from everything you shared." },
      { t: "Lab", d: "Experimental AI tools — where new things show up first." },
    ] },
    { kicker: "Legacy", title: "What remains", lead: "What it's all for. Memory fades — your entries don't. Your story stays for those who come after.", edge: "var(--lotus, #cf5f92)", items: [
      { t: "Let's get acquainted", d: "The bot gently asks and fills your book; the bond grows along a “closeness ladder”." },
      { t: "📸 On this day", d: "What you lived on this very day a year, two, three ago — a warm “remember…”." },
      { t: "⏳ Time capsule", d: "A letter to the future — delivered right on the chosen day. To yourself, kids, a loved one." },
      { t: "👨‍👩‍👧 Heirs", d: "You choose who will one day get access to your Book of Life.", soon: true },
      { t: "🎙 Voice forever", d: "Your voice notes kept as your voice for descendants — to be heard again.", soon: true },
    ] },
    { kicker: "Loved ones & growth", title: "Not only about you", lead: "LIFE OS connects you with those who matter — and grows together with them.", items: [
      { t: "Messages to close ones", d: "“Tell Anna I'll be late” — delivered right to her, nicknames supported." },
      { t: "Invite loved ones", d: "Referral links and rewards — bring in those who need this too." },
      { t: "A book as a gift", d: "Gift a Book of Life to parents or a partner — the most personal present." },
      { t: "Wishlist", d: "A list of wishes by links — so loved ones know how to delight you." },
    ] },
    { kicker: "Trust & convenience", title: "Your data is yours", lead: "Honest about privacy, convenient every day, no spam.", items: [
      { t: "5 languages", d: "Russian, English, Ukrainian, French, Spanish — interface, bot and book." },
      { t: "Data always with you", d: "Export to Obsidian (.zip) and a monthly auto-backup of your diary." },
      { t: "Privacy & PIN", d: "Only you see your entries; login can be locked with a PIN. The code is open." },
      { t: "Gentle reminders", d: "A warm morning and evening — but if you already wrote today, no extra pings." },
      { t: "Summaries", d: "A weekly AI overview and a monthly finance report arrive on their own." },
    ] },
  ],
};

/* Единый стиль с лендингом («Классика»): системный санс, жирные плотные
   заголовки, шапка-стекло, градиентные кнопки. Serif остался только как
   курсивный акцент в подписи — так же, как на лендинге. */
const STYLE = `
.fx-shell{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-.011em;min-height:100vh;background:radial-gradient(820px 460px at 86% -4%, rgba(91,91,245,0.10), transparent 60%),#f7f8fc}
.fx-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.fx-top{position:sticky;top:0;z-index:50;background:rgba(247,248,252,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(15,15,40,.06)}
.fx-top-in{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 24px}
.fx-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:18px;color:var(--text);text-decoration:none}
.fx-nav{display:flex;align-items:center;gap:10px}
.fx-nav a{font-size:14px;font-weight:500;text-decoration:none;color:var(--text-2);padding:8px 14px;border-radius:11px}
.fx-nav a:hover{color:var(--text)}
.fx-nav a.pri{color:#fff;font-weight:600;background:linear-gradient(135deg,#6d6bf6,#8b5cf6);box-shadow:0 12px 28px -12px rgba(91,91,245,.55)}
.fx-hero{padding:56px 0 40px;border-bottom:1px solid var(--border)}
.fx-badge{font-size:12.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--accent)}
.fx-hero h1{font-weight:800;font-size:clamp(30px,5vw,52px);line-height:1.06;letter-spacing:-.03em;margin:14px 0 20px;max-width:19ch;text-wrap:balance}
.fx-lead{font-size:clamp(16px,2.1vw,19px);color:var(--text-2);line-height:1.6;max-width:62ch;margin:0 0 26px}
.fx-meta{display:flex;flex-wrap:wrap;gap:8px}
.fx-tag{font-size:13px;color:var(--text-2);background:#fff;border:1px solid var(--border);border-radius:999px;padding:6px 14px}
.fx-cat{padding:48px 0 4px}
.fx-cat .k{font-size:12.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--accent)}
.fx-cat h2{font-weight:800;font-size:clamp(22px,3.2vw,30px);letter-spacing:-.025em;margin:8px 0 6px;text-wrap:balance}
.fx-cat .cl{color:var(--text-2);font-size:15px;line-height:1.6;max-width:64ch;margin:0 0 22px}
.fx-rule{height:1px;background:linear-gradient(90deg,var(--border),transparent);margin:0 0 22px}
.fx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:13px}
.fx-card{position:relative;background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px 18px 17px;overflow:hidden}
.fx-card::before{content:"";position:absolute;left:0;top:15px;bottom:15px;width:3px;border-radius:0 3px 3px 0;background:var(--edge,var(--accent));opacity:0;transition:opacity .18s}
.fx-card:hover::before{opacity:.9}
.fx-card h3{font-size:15.5px;font-weight:700;letter-spacing:-.01em;margin:0 0 6px}
.fx-card p{font-size:13.6px;color:var(--text-2);margin:0;line-height:1.5}
.fx-soon{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#a9812a;border:1px solid rgba(169,129,42,.5);border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:middle}
.fx-close{margin:56px 0 40px;padding:38px;border:1px solid var(--border);border-radius:20px;background:#fff}
.fx-close h2{font-weight:800;font-size:clamp(22px,3.4vw,30px);margin:8px 0 12px;letter-spacing:-.025em;text-wrap:balance}
.fx-close p{color:var(--text-2);font-size:16px;line-height:1.6;margin:0;max-width:58ch}
.fx-sign{margin-top:18px;font-family:var(--font-serif,Georgia,serif);font-style:italic;color:var(--text-2);font-size:16px}
.fx-final{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin:0 0 70px;padding:28px 32px;border:1px solid var(--accent);border-radius:20px;background:var(--accent-bg,#eeeafd)}
.fx-final .ft{font-size:19px;font-weight:700;letter-spacing:-.015em;flex:1;min-width:220px}
.fx-final a{text-decoration:none;color:#fff;background:linear-gradient(135deg,#6d6bf6,#8b5cf6);box-shadow:0 12px 28px -12px rgba(91,91,245,.55);border-radius:12px;padding:12px 24px;font-size:14.5px;font-weight:600;white-space:nowrap}
.fx-foot{border-top:1px solid var(--border);color:var(--text-3);font-size:13px;padding:20px 0 60px}
@media(max-width:640px){.fx-grid{grid-template-columns:1fr}.fx-hero{padding:40px 0 28px}.fx-nav a:not(.pri){padding:8px 8px}}
`;

export default async function FeaturesPage() {
  const locale = await getLocale();
  const s: Dict = locale === "en" ? EN : RU;
  // Как на лендинге: гостю — «Войти», вошедшему — «В приложение» (не обе сразу).
  const isAuthed = !!(await getCurrentUser());
  return (
    <div className="fx-shell">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="fx-top">
        <div className="fx-wrap fx-top-in">
          <Link href="/about" className="fx-brand" title={s.backHome}>
            <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} /> LIFE OS
          </Link>
          <nav className="fx-nav">
            <Link href="/about">← {s.backHome}</Link>
            <Link href={isAuthed ? "/" : "/login"} className="pri">{isAuthed ? s.app : s.login}</Link>
          </nav>
        </div>
      </div>
      <div className="fx-wrap">

        <header className="fx-hero">
          <div className="fx-badge">{s.badge}</div>
          <h1>{s.title}</h1>
          <p className="fx-lead">{s.lead}</p>
          <div className="fx-meta">
            <span className="fx-tag">{s.metaCount}</span>
            <span className="fx-tag">{s.metaA}</span>
            <span className="fx-tag">{s.metaB}</span>
          </div>
        </header>

        <main>
          {s.cats.map((c, i) => (
            <section className="fx-cat" key={i}>
              <div className="k">{c.kicker}</div>
              <h2>{c.title}</h2>
              <p className="cl">{c.lead}</p>
              <div className="fx-rule" />
              <div className="fx-grid">
                {c.items.map((it, j) => (
                  <div className="fx-card" key={j} style={c.edge ? ({ "--edge": c.edge } as any) : undefined}>
                    <h3>{it.t}{it.soon && <span className="fx-soon">{locale === "en" ? "Soon" : "Скоро"}</span>}</h3>
                    <p>{it.d}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="fx-close">
            <div className="fx-badge">{s.closeKicker}</div>
            <h2>{s.closeTitle}</h2>
            <p>{s.closeText}</p>
            <div className="fx-sign">{s.sign}</div>
          </section>

          <div className="fx-final">
            <div className="ft">{s.final}</div>
            <Link href={isAuthed ? "/" : "/login"}>{isAuthed ? s.app : s.finalCta}</Link>
          </div>
        </main>

        <footer className="fx-foot">{s.foot}</footer>
      </div>
    </div>
  );
}
