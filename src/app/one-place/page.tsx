import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import ChaosToOrder, { type Chip } from "@/components/onePlace/ChaosToOrder";
import PublicHeader from "@/components/PublicHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Все заметки и напоминания — в одном месте · LIFE OS",
  description:
    "Заметки айфона, сохранёнки Инстаграма, файлы, стикеры и будильники — в одной базе. Скажи словами — LIFE OS запишет, разложит и напомнит вовремя.",
};

type Shelf = { icon: string; t: string; items: string[] };
type Step = { n: string; t: string; d: string };
type Feat = { icon: string; t: string; d: string };
type Src = { icon: string; t: string; d: string };

type Dict = {
  badge: string;
  h1: string;
  lead: string;
  cta: string;
  ctaApp: string;
  ctaSecond: string;
  backHome: string;
  login: string;
  app: string;
  chips: Chip[];
  caps: [string, string, string];
  hint: string;
  result: { title: string; sub: string; rows: string[] };
  painKicker: string;
  painTitle: string;
  painLead: string;
  pains: string[];
  shelfKicker: string;
  shelfTitle: string;
  shelfLead: string;
  shelves: Shelf[];
  howKicker: string;
  howTitle: string;
  steps: Step[];
  featKicker: string;
  featTitle: string;
  feats: Feat[];
  moveKicker: string;
  moveTitle: string;
  moveLead: string;
  sources: Src[];
  moveNote: string;
  freeKicker: string;
  freeTitle: string;
  freeText: string;
  finalTitle: string;
  finalText: string;
  sign: string;
  foot: string;
  allFeatures: string;
};

const RU: Dict = {
  badge: "Заметки · Списки · Напоминания",
  h1: "Всё, что нельзя забыть, — в одном месте",
  lead: "Сейчас твоя память разбросана: часть в заметках айфона, часть в сохранёнках Инстаграма, часть в файлах, стикерах и будильниках. LIFE OS собирает это в одну базу — и напоминает вовремя, сам.",
  cta: "Собрать всё в одно место",
  ctaApp: "В приложение",
  ctaSecond: "Посмотреть, как это работает",
  backHome: "На главную",
  login: "Войти",
  app: "В приложение",
  hint: "Прокрути",
  caps: [
    "Так это выглядит сейчас — всё в разных местах",
    "Прокручивай — оно собирается в одну кучу…",
    "…и складывается в LIFE OS",
  ],
  result: {
    title: "Одна база на всю жизнь",
    sub: "Заметки, списки и напоминания живут вместе — в вебе и в Telegram-боте.",
    rows: ["Спросил — нашлось за секунду", "Напомнит само, точно в срок", "Можно выгрузить файлом в любой момент"],
  },
  chips: [
    { icon: "📱", src: "Заметки айфона", text: "код от домофона 4582", sx: -0.34, sy: -0.32, r: -7 },
    { icon: "📷", src: "Сохранёнки Инстаграма", text: "рецепт пасты, который точно приготовлю", sx: 0.3, sy: -0.35, r: 8 },
    { icon: "💬", src: "Себе в Telegram", text: "не забыть справку для бассейна", sx: -0.05, sy: -0.4, r: -3 },
    { icon: "🗒", src: "Google Keep", text: "список покупок (от марта)", sx: 0.4, sy: -0.06, r: -6 },
    { icon: "📄", src: "Файл на компе", text: "мысли_2019_финал_2.txt", sx: -0.42, sy: 0.02, r: 5 },
    { icon: "🧾", src: "Скриншот в галерее", text: "адрес доставки, 4-й этаж", sx: 0.12, sy: 0.3, r: -9 },
    { icon: "🪧", src: "Стикер на мониторе", text: "позвонить маме!!!", sx: -0.28, sy: 0.34, r: 10 },
    { icon: "📝", src: "Obsidian", text: "40 файлов, открывал в апреле", sx: 0.35, sy: 0.36, r: 4 },
    { icon: "⏰", src: "Будильник в телефоне", text: "07:55 «таблетка»", sx: -0.14, sy: 0.12, r: -5 },
    { icon: "📅", src: "Календарь", text: "стоматолог, 15:00", sx: 0.22, sy: 0.06, r: 7 },
    { icon: "🗂", src: "Блокнот в ящике", text: "размер фильтра для воды", sx: -0.38, sy: 0.24, r: -8 },
    { icon: "🎙", src: "Голосовое себе", text: "0:42 — идея, пока не забыл", sx: 0.02, sy: -0.14, r: 6 },
    { icon: "🔖", src: "Закладки браузера", text: "217 вкладок «на потом»", sx: 0.44, sy: 0.18, r: -4 },
    { icon: "✉️", src: "Черновик письма", text: "«не забыть»", sx: -0.2, sy: -0.14, r: 9 },
  ],
  painKicker: "Знакомо?",
  painTitle: "Проблема не в памяти. Проблема в том, что всё лежит в разных шкафах",
  painLead: "Записать — легко. Найти через месяц — вот где всё разваливается.",
  pains: [
    "«Я точно это где-то записывал» — и десять минут поиска по четырём приложениям.",
    "Сохранил рецепт в Инстаграме — и больше никогда его не открыл.",
    "Список покупок в одном месте, напоминание о нём — в другом.",
    "Сменил телефон — половина заметок осталась в прошлой жизни.",
    "Напоминание есть, но оно молчит: стоит в приложении, о котором ты забыл.",
  ],
  shelfKicker: "Как стало",
  shelfTitle: "Один шкаф, и на каждой полке — своё",
  shelfLead: "Ты просто говоришь боту обычными словами. LIFE OS сам понимает, что это: справка, пункт списка или напоминание — и кладёт на нужную полку.",
  shelves: [
    { icon: "📝", t: "Заметки", items: ["код от домофона", "размер фильтра", "адрес доставки", "номер полиса"] },
    { icon: "🛒", t: "Списки", items: ["покупки", "подарки", "в дорогу", "в аптеку"] },
    { icon: "⏰", t: "Напоминания", items: ["таблетка в 9:00", "стоматолог, 15:00", "каждый час с 9 до 21", "оплатить в пятницу"] },
    { icon: "📚", t: "База знаний", items: ["рецепты", "сохранёнки из Инстаграма", "статьи", "инструкции"] },
    { icon: "🖼", t: "Память", items: ["чеки", "документы", "скриншоты", "гарантии"] },
  ],
  howKicker: "Три шага",
  howTitle: "Никаких папок и тегов — просто скажи",
  steps: [
    { n: "1", t: "Скажи или пришли", d: "Голосом или текстом в Telegram: «запиши код от домофона 4582», «добавь молоко в список покупок», «напомни завтра в 9 про справку». Или пришли файл со старыми заметками." },
    { n: "2", t: "LIFE OS разложит", d: "Сам отличит справку от истории дня, пункт списка от напоминания. Ничего не надо выбирать в меню — всё уже на своей полке." },
    { n: "3", t: "Найдёт и напомнит", d: "«Какой код от домофона?» — ответ за секунду. «Что у меня сегодня?» — покажет план. В нужное время бот напишет сам, с кнопками «✅ Готово» и «⏰ Через час»." },
  ],
  featKicker: "Что внутри",
  featTitle: "Мелочи, из которых складывается «наконец-то не забываю»",
  feats: [
    { icon: "ti-microphone", t: "Голосом на ходу", d: "Наговорил боту — расшифрую и запишу. Руки заняты, идея не потеряна." },
    { icon: "ti-search", t: "Спросил — нашлось", d: "«Какой размер фильтра?», «где адрес доставки?» — бот отвечает из твоих заметок, а не пишет вопрос в дневник." },
    { icon: "ti-bell", t: "Напоминания обычными словами", d: "«Напомни в пятницу оплатить», «каждый день в 8», «каждый час с 9 до 21» — понимает как есть." },
    { icon: "ti-checkbox", t: "Списки с кнопками", d: "«Что купить?» — список с «✓ 1», «✓ 2». Тапнул — вычеркнул. Несколько списков: покупки, подарки, в дорогу." },
    { icon: "ti-calendar", t: "Google Календарь", d: "Напоминания уезжают в календарь событием с уведомлением — если тебе так привычнее." },
    { icon: "ti-clock-hour-4", t: "«Что у меня сегодня»", d: "Один вопрос — и весь план дня: напоминания и задачи с датой. Отменить тоже словами." },
    { icon: "ti-pin", t: "Важное — сверху", d: "Закрепляй нужные заметки: паспортные данные, коды, адреса всегда первыми в списке." },
    { icon: "ti-download", t: "Выгрузка одним словом", d: "«Выгрузи заметки» — бот пришлёт файл. Открывается в Заметках айфона, Obsidian, где угодно." },
  ],
  moveKicker: "Переезд",
  moveTitle: "Перенести старое — две минуты",
  moveLead: "Не нужно начинать с чистого листа. Скопируй, вставь или пришли файл — LIFE OS разложит это на заметки.",
  sources: [
    { icon: "📱", t: "Заметки айфона", d: "Выдели всё, скопируй и вставь в блок «Перенос заметок». Каждая строка может стать отдельной заметкой." },
    { icon: "🗒", t: "Google Keep", d: "То же самое — копируй списком. Маркеры и галочки из чужих приложений LIFE OS почистит сам." },
    { icon: "📝", t: "Obsidian и текстовые файлы", d: "Загрузи .txt, .md или .csv — прямо на сайте или просто пришли файл боту в чат." },
    { icon: "📷", t: "Сохранёнки Инстаграма", d: "Пришли ссылку или пост боту — заберу текст и смысл в Базу знаний, чтобы потом нашлось." },
  ],
  moveNote: "И обратно так же просто: «выгрузи заметки» — файл у тебя в руках.",
  freeKicker: "Честно",
  freeTitle: "Это не ловушка — данные твои",
  freeText: "Всё, что ты записал, можно забрать одним словом: заметки — файлом, дневник — архивом в Obsidian, вся база — полным экспортом в профиле. LIFE OS собирает твою жизнь в одном месте, но не держит её в заложниках.",
  finalTitle: "Собери всё в одно место — сегодня",
  finalText: "Начни с одной заметки. Через месяц ты перестанешь искать «где я это записывал».",
  sign: "🪷 LIFE OS — Сохранись.",
  foot: "LIFE OS · заметки, списки и напоминания в вебе и в Telegram",
  allFeatures: "Все возможности",
};

const EN: Dict = {
  badge: "Notes · Lists · Reminders",
  h1: "Everything you must not forget — in one place",
  lead: "Right now your memory is scattered: some in iPhone Notes, some in Instagram saves, some in files, sticky notes and alarms. LIFE OS gathers it into one base — and reminds you on time, on its own.",
  cta: "Gather it all in one place",
  ctaApp: "Open app",
  ctaSecond: "See how it works",
  backHome: "Home",
  login: "Log in",
  app: "Open app",
  hint: "Scroll",
  caps: [
    "This is how it looks now — everything in a different place",
    "Keep scrolling — it gathers into one pile…",
    "…and lands neatly in LIFE OS",
  ],
  result: {
    title: "One base for a lifetime",
    sub: "Notes, lists and reminders live together — on the web and in the Telegram bot.",
    rows: ["Asked — found in a second", "Reminds you itself, right on time", "Export it to a file anytime"],
  },
  chips: [
    { icon: "📱", src: "iPhone Notes", text: "door code 4582", sx: -0.34, sy: -0.32, r: -7 },
    { icon: "📷", src: "Instagram saves", text: "pasta recipe I'll definitely cook", sx: 0.3, sy: -0.35, r: 8 },
    { icon: "💬", src: "Messages to self", text: "don't forget the pool certificate", sx: -0.05, sy: -0.4, r: -3 },
    { icon: "🗒", src: "Google Keep", text: "shopping list (from March)", sx: 0.4, sy: -0.06, r: -6 },
    { icon: "📄", src: "A file on the laptop", text: "thoughts_2019_final_2.txt", sx: -0.42, sy: 0.02, r: 5 },
    { icon: "🧾", src: "Screenshot in the gallery", text: "delivery address, 4th floor", sx: 0.12, sy: 0.3, r: -9 },
    { icon: "🪧", src: "Sticky note on the monitor", text: "call mom!!!", sx: -0.28, sy: 0.34, r: 10 },
    { icon: "📝", src: "Obsidian", text: "40 files, last opened in April", sx: 0.35, sy: 0.36, r: 4 },
    { icon: "⏰", src: "Phone alarm", text: "07:55 “the pill”", sx: -0.14, sy: 0.12, r: -5 },
    { icon: "📅", src: "Calendar", text: "dentist, 3:00 pm", sx: 0.22, sy: 0.06, r: 7 },
    { icon: "🗂", src: "Notepad in the drawer", text: "water filter size", sx: -0.38, sy: 0.24, r: -8 },
    { icon: "🎙", src: "Voice note to self", text: "0:42 — an idea, before I forget", sx: 0.02, sy: -0.14, r: 6 },
    { icon: "🔖", src: "Browser bookmarks", text: "217 tabs “for later”", sx: 0.44, sy: 0.18, r: -4 },
    { icon: "✉️", src: "Draft email", text: "“don't forget”", sx: -0.2, sy: -0.14, r: 9 },
  ],
  painKicker: "Sound familiar?",
  painTitle: "It's not your memory. It's that everything sits in different cupboards",
  painLead: "Writing it down is easy. Finding it a month later is where it all falls apart.",
  pains: [
    "“I definitely wrote this down somewhere” — then ten minutes across four apps.",
    "Saved a recipe on Instagram — and never opened it again.",
    "The shopping list is in one app, the reminder about it in another.",
    "Changed phones — half the notes stayed in a past life.",
    "The reminder exists, but stays silent: it's in an app you forgot about.",
  ],
  shelfKicker: "How it becomes",
  shelfTitle: "One cupboard, and every shelf has its own thing",
  shelfLead: "You just talk to the bot in plain words. LIFE OS works out what it is — a reference fact, a list item or a reminder — and puts it on the right shelf.",
  shelves: [
    { icon: "📝", t: "Notes", items: ["door code", "filter size", "delivery address", "policy number"] },
    { icon: "🛒", t: "Lists", items: ["shopping", "gifts", "for the trip", "pharmacy"] },
    { icon: "⏰", t: "Reminders", items: ["pill at 9:00", "dentist, 3 pm", "every hour from 9 to 21", "pay on Friday"] },
    { icon: "📚", t: "Knowledge base", items: ["recipes", "Instagram saves", "articles", "how-tos"] },
    { icon: "🖼", t: "Memory", items: ["receipts", "documents", "screenshots", "warranties"] },
  ],
  howKicker: "Three steps",
  howTitle: "No folders, no tags — just say it",
  steps: [
    { n: "1", t: "Say it or send it", d: "By voice or text in Telegram: “save the door code 4582”, “add milk to the shopping list”, “remind me tomorrow at 9 about the certificate”. Or send a file with your old notes." },
    { n: "2", t: "LIFE OS sorts it", d: "It tells a reference fact from a day story, a list item from a reminder. Nothing to pick in menus — it's already on the right shelf." },
    { n: "3", t: "It finds and reminds", d: "“What's the door code?” — answered in a second. “What's on today?” — your plan. At the right time the bot messages you, with “✅ Done” and “⏰ In an hour”." },
  ],
  featKicker: "What's inside",
  featTitle: "The small things that add up to “I finally don't forget”",
  feats: [
    { icon: "ti-microphone", t: "By voice, on the go", d: "Speak to the bot — it transcribes and saves. Hands busy, idea not lost." },
    { icon: "ti-search", t: "Asked — found", d: "“What's the filter size?”, “where's the delivery address?” — the bot answers from your notes instead of logging the question." },
    { icon: "ti-bell", t: "Reminders in plain words", d: "“Remind me Friday to pay”, “every day at 8”, “every hour from 9 to 21” — understood as said." },
    { icon: "ti-checkbox", t: "Lists with buttons", d: "“What should I buy?” — the list with “✓ 1”, “✓ 2”. Tap to check off. Several lists: shopping, gifts, for the trip." },
    { icon: "ti-calendar", t: "Google Calendar", d: "Reminders go into your calendar as events with notifications — if that's what you're used to." },
    { icon: "ti-clock-hour-4", t: "“What's on today”", d: "One question — the whole day: reminders and dated tasks. Cancelling works in words too." },
    { icon: "ti-pin", t: "Important on top", d: "Pin what matters: IDs, codes, addresses always first in the list." },
    { icon: "ti-download", t: "Export in one word", d: "“Export my notes” — the bot sends a file. Opens in iPhone Notes, Obsidian, anywhere." },
  ],
  moveKicker: "Moving in",
  moveTitle: "Bringing the old stuff over takes two minutes",
  moveLead: "No need to start from scratch. Copy, paste or send a file — LIFE OS turns it into notes.",
  sources: [
    { icon: "📱", t: "iPhone Notes", d: "Select all, copy and paste into the “Move notes” block. Each line can become its own note." },
    { icon: "🗒", t: "Google Keep", d: "Same thing — copy as a list. Bullets and checkmarks from other apps get cleaned up automatically." },
    { icon: "📝", t: "Obsidian & text files", d: "Upload .txt, .md or .csv — on the site, or just send the file to the bot in chat." },
    { icon: "📷", t: "Instagram saves", d: "Send a link or a post to the bot — the text and meaning go into your Knowledge base, so it's findable later." },
  ],
  moveNote: "And back out just as easily: “export my notes” — the file is in your hands.",
  freeKicker: "Straight up",
  freeTitle: "This isn't a trap — the data is yours",
  freeText: "Everything you saved can be taken back in one word: notes as a file, your diary as an Obsidian archive, the whole base as a full export in your profile. LIFE OS gathers your life in one place — it doesn't hold it hostage.",
  finalTitle: "Gather it all in one place — today",
  finalText: "Start with one note. In a month you'll stop hunting for “where did I write that”.",
  sign: "🪷 LIFE OS — Save yourself.",
  foot: "LIFE OS · notes, lists and reminders on the web and in Telegram",
  allFeatures: "All features",
};

/* Страница всегда светлая (как /features): свои значения темовых переменных,
   иначе у пользователей с тёмной темой текст наследует почти белый var(--text). */
const STYLE = `
.op-shell{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-.011em;min-height:100vh;
  --text:#14161c;--text-2:#4a5261;--text-3:#8b93a3;--border:rgba(20,24,40,0.08);--accent:#5b5bf5;--accent-bg:#edecff;
  color:var(--text);color-scheme:light;background:#f7f8fc;overflow-x:clip}
.op-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.op-top{position:sticky;top:0;z-index:80;background:rgba(247,248,252,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(15,15,40,.06)}
.op-top-in{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 24px}
.op-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:18px;color:var(--text);text-decoration:none}
.op-nav{display:flex;align-items:center;gap:10px}
.op-nav a{font-size:14px;font-weight:500;text-decoration:none;color:var(--text-2);padding:8px 14px;border-radius:11px}
.op-nav a:hover{color:var(--text)}
.op-nav a.pri{color:#fff;font-weight:600;background:linear-gradient(135deg,#6d6bf6,#8b5cf6);box-shadow:0 12px 28px -12px rgba(91,91,245,.55)}

/* Hero */
.op-hero{position:relative;padding:64px 0 34px;background:radial-gradient(820px 460px at 84% -10%, rgba(91,91,245,0.13), transparent 62%)}
.op-kicker{font-size:12.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--accent)}
.op-hero h1{font-weight:800;font-size:clamp(32px,5.6vw,58px);line-height:1.04;letter-spacing:-.033em;margin:14px 0 20px;max-width:17ch;text-wrap:balance}
.op-lead{font-size:clamp(16px,2.1vw,19px);color:var(--text-2);line-height:1.6;max-width:60ch;margin:0 0 28px}
.op-btns{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.op-btn{text-decoration:none;color:#fff;background:linear-gradient(135deg,#6d6bf6,#8b5cf6);box-shadow:0 14px 30px -14px rgba(91,91,245,.6);border-radius:13px;padding:14px 26px;font-size:15px;font-weight:650}
.op-btn2{text-decoration:none;color:var(--text);background:#fff;border:1px solid var(--border);border-radius:13px;padding:14px 22px;font-size:15px;font-weight:600}

/* Сцена: хаос → сборка */
.op-scene{position:relative;height:340vh}
.op-sticky{position:sticky;top:0;height:100vh;height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.op-sticky::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 52%, transparent 46%, #f7f8fc 82%)}
.op-caps{position:absolute;top:clamp(76px,11vh,120px);left:0;right:0;z-index:60;display:grid;padding:0 20px;pointer-events:none}
.op-cap{grid-area:1/1;text-align:center;font-size:clamp(17px,2.7vw,27px);font-weight:750;letter-spacing:-.025em;line-height:1.25;color:var(--text);text-wrap:balance;transition:opacity .18s linear}
.op-stage{position:relative;width:min(980px,100%);height:min(62vh,580px);margin:clamp(30px,7vh,74px) auto 0}
.op-chip{position:absolute;left:50%;top:50%;width:min(230px,42vw);will-change:transform,opacity}
.op-chip-in{background:#fff;border:1px solid rgba(20,24,40,.1);border-radius:14px;padding:11px 13px;box-shadow:0 18px 40px -22px rgba(15,18,50,.4),0 2px 6px -2px rgba(15,18,50,.14);animation:opFloat 8s ease-in-out infinite}
.op-chip-src{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.op-chip-src span{font-size:14px;text-transform:none}
.op-chip-text{font-size:13.5px;color:var(--text);line-height:1.4}
@keyframes opFloat{0%,100%{transform:translate3d(0,-4px,0)}50%{transform:translate3d(0,5px,0)}}
@media(prefers-reduced-motion:reduce){.op-chip-in{animation:none}}
.op-panel{position:absolute;left:50%;top:50%;z-index:70;width:min(430px,86vw);background:#fff;border:1px solid rgba(91,91,245,.28);border-radius:22px;padding:26px 26px 22px;box-shadow:0 40px 80px -40px rgba(60,50,180,.55),0 0 0 8px rgba(91,91,245,.06);will-change:transform,opacity}
.op-panel-head{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:750;letter-spacing:-.01em}
.op-panel-head i{font-size:22px;color:var(--accent)}
.op-panel-title{font-size:clamp(20px,3vw,25px);font-weight:800;letter-spacing:-.025em;margin:14px 0 7px;text-wrap:balance}
.op-panel-sub{font-size:14.5px;color:var(--text-2);line-height:1.55}
.op-panel-rows{margin-top:16px;display:grid;gap:9px}
.op-panel-row{display:flex;align-items:center;gap:9px;font-size:14px;color:var(--text)}
.op-panel-row i{font-size:16px;color:#16a34a}
.op-hint{position:absolute;bottom:22px;left:0;right:0;text-align:center;font-size:13px;font-weight:600;color:var(--text-3);letter-spacing:.02em;z-index:60;transition:opacity .2s linear}
.op-hint i{vertical-align:-2px}

/* Общие секции */
.op-sec{padding:62px 0}
.op-h2{font-weight:800;font-size:clamp(24px,3.7vw,36px);letter-spacing:-.03em;margin:10px 0 12px;max-width:22ch;text-wrap:balance}
.op-sub{font-size:16px;color:var(--text-2);line-height:1.6;max-width:62ch;margin:0 0 26px}
.op-band{background:#fff;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}

/* Боль */
.op-pains{display:grid;gap:10px;max-width:720px}
.op-pain{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid var(--border);border-radius:14px;padding:15px 17px;font-size:15px;line-height:1.5;color:var(--text-2)}
.op-pain i{font-size:18px;color:#e2626b;flex-shrink:0;margin-top:1px}

/* Шкаф с полками */
.op-closet{background:#fff;border:1px solid var(--border);border-radius:22px;padding:8px 20px 20px;box-shadow:0 30px 70px -46px rgba(20,24,60,.4)}
.op-shelf{display:flex;gap:18px;align-items:flex-start;padding:20px 4px 22px;border-bottom:2px solid rgba(20,24,40,.07);box-shadow:0 5px 10px -8px rgba(20,24,40,.35)}
.op-shelf:last-child{border-bottom:0;box-shadow:none;padding-bottom:6px}
.op-shelf-head{display:flex;align-items:center;gap:10px;min-width:200px}
.op-shelf-ico{width:40px;height:40px;border-radius:12px;background:var(--accent-bg);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.op-shelf-t{font-size:16.5px;font-weight:750;letter-spacing:-.015em}
.op-shelf-items{display:flex;flex-wrap:wrap;gap:8px;flex:1;padding-top:5px}
.op-item{font-size:13.5px;color:var(--text-2);background:#f7f8fc;border:1px solid var(--border);border-radius:10px;padding:7px 12px}

/* Шаги */
.op-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:26px}
.op-step-n{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#6d6bf6,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;margin-bottom:14px;box-shadow:0 10px 22px -10px rgba(91,91,245,.6)}
.op-step-t{font-size:18.5px;font-weight:750;letter-spacing:-.015em;margin-bottom:6px}
.op-step-d{font-size:14.5px;color:var(--text-2);line-height:1.55}

/* Карточки */
.op-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:13px}
.op-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:19px}
.op-card i{font-size:22px;color:var(--accent)}
.op-card h3{font-size:15.5px;font-weight:750;letter-spacing:-.012em;margin:12px 0 6px}
.op-card p{font-size:13.6px;color:var(--text-2);line-height:1.5;margin:0}
.op-src{display:flex;gap:14px;align-items:flex-start;background:#f7f8fc;border:1px solid var(--border);border-radius:16px;padding:18px}
.op-src .e{font-size:24px;line-height:1;flex-shrink:0}
.op-src h3{font-size:15.5px;font-weight:750;margin:0 0 5px;letter-spacing:-.012em}
.op-src p{font-size:13.6px;color:var(--text-2);line-height:1.5;margin:0}
.op-note{margin-top:16px;font-size:14.5px;color:var(--text-2)}

/* Финал */
.op-free{margin:0;padding:36px;border:1px solid var(--border);border-radius:22px;background:#fff}
.op-free p{font-size:16px;color:var(--text-2);line-height:1.65;margin:0;max-width:64ch}
.op-final{display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin:48px 0 64px;padding:32px 34px;border:1px solid var(--accent);border-radius:22px;background:var(--accent-bg)}
.op-final-t{flex:1;min-width:250px}
.op-final-t .a{font-size:21px;font-weight:800;letter-spacing:-.02em;margin-bottom:6px}
.op-final-t .b{font-size:14.5px;color:var(--text-2);line-height:1.55}
.op-sign{font-family:var(--font-serif,Georgia,serif);font-style:italic;color:var(--text-2);font-size:16px;margin-top:18px}
.op-foot{border-top:1px solid var(--border);color:var(--text-3);font-size:13px;padding:20px 0 60px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between}
.op-foot a{color:var(--text-2);text-decoration:none}

@media(max-width:720px){
  .op-scene{height:300vh}
  .op-stage{height:min(66vh,560px)}
  .op-chip{width:min(180px,47vw)}
  .op-chip-in{padding:9px 11px;border-radius:12px}
  .op-chip-text{font-size:12px}
  .op-chip-src{font-size:10px;margin-bottom:3px}
  .op-shelf{flex-direction:column;gap:10px}
  .op-shelf-head{min-width:0}
  .op-grid{grid-template-columns:1fr}
  .op-nav a:not(.pri){padding:8px 6px}
  .op-hero{padding:44px 0 26px}
}
`;

export default async function OnePlacePage() {
  const locale = await getLocale();
  const s: Dict = locale === "en" ? EN : RU;
  const isAuthed = !!(await getCurrentUser());
  const href = isAuthed ? "/notes" : "/login";

  return (
    <div className="op-shell">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <PublicHeader
        locale={locale}
        isAuthed={isAuthed}
        links={[
          { href: "/about", label: s.backHome },
          { href: "/features", label: s.allFeatures },
        ]}
      />

      <header className="op-hero">
        <div className="op-wrap">
          <div className="op-kicker">{s.badge}</div>
          <h1>{s.h1}</h1>
          <p className="op-lead">{s.lead}</p>
          <div className="op-btns">
            <Link href={href} className="op-btn">{isAuthed ? s.ctaApp : s.cta}</Link>
            <a href="#how" className="op-btn2">{s.ctaSecond}</a>
          </div>
        </div>
      </header>

      <ChaosToOrder chips={s.chips} caps={s.caps} hint={s.hint} result={s.result} />

      <section className="op-band">
        <div className="op-wrap op-sec">
          <div className="op-kicker">{s.painKicker}</div>
          <h2 className="op-h2">{s.painTitle}</h2>
          <p className="op-sub">{s.painLead}</p>
          <div className="op-pains">
            {s.pains.map((p) => (
              <div className="op-pain" key={p}>
                <i className="ti ti-alert-circle" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="op-wrap op-sec">
        <div className="op-kicker">{s.shelfKicker}</div>
        <h2 className="op-h2">{s.shelfTitle}</h2>
        <p className="op-sub">{s.shelfLead}</p>
        <div className="op-closet">
          {s.shelves.map((sh) => (
            <div className="op-shelf" key={sh.t}>
              <div className="op-shelf-head">
                <span className="op-shelf-ico">{sh.icon}</span>
                <span className="op-shelf-t">{sh.t}</span>
              </div>
              <div className="op-shelf-items">
                {sh.items.map((it) => (
                  <span className="op-item" key={it}>{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="op-band" id="how">
        <div className="op-wrap op-sec">
          <div className="op-kicker">{s.howKicker}</div>
          <h2 className="op-h2">{s.howTitle}</h2>
          <div className="op-steps" style={{ marginTop: 22 }}>
            {s.steps.map((st) => (
              <div key={st.n}>
                <div className="op-step-n">{st.n}</div>
                <div className="op-step-t">{st.t}</div>
                <div className="op-step-d">{st.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="op-wrap op-sec">
        <div className="op-kicker">{s.featKicker}</div>
        <h2 className="op-h2">{s.featTitle}</h2>
        <div className="op-grid" style={{ marginTop: 22 }}>
          {s.feats.map((f) => (
            <div className="op-card" key={f.t}>
              <i className={`ti ${f.icon}`} />
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="op-band">
        <div className="op-wrap op-sec">
          <div className="op-kicker">{s.moveKicker}</div>
          <h2 className="op-h2">{s.moveTitle}</h2>
          <p className="op-sub">{s.moveLead}</p>
          <div className="op-grid">
            {s.sources.map((sr) => (
              <div className="op-src" key={sr.t}>
                <span className="e">{sr.icon}</span>
                <div>
                  <h3>{sr.t}</h3>
                  <p>{sr.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="op-note">{s.moveNote}</div>
        </div>
      </section>

      <div className="op-wrap">
        <section className="op-sec">
          <div className="op-free">
            <div className="op-kicker">{s.freeKicker}</div>
            <h2 className="op-h2" style={{ marginTop: 10 }}>{s.freeTitle}</h2>
            <p>{s.freeText}</p>
            <div className="op-sign">{s.sign}</div>
          </div>
        </section>

        <div className="op-final">
          <div className="op-final-t">
            <div className="a">{s.finalTitle}</div>
            <div className="b">{s.finalText}</div>
          </div>
          <Link href={href} className="op-btn">{isAuthed ? s.ctaApp : s.cta}</Link>
        </div>

        <footer className="op-foot">
          <span>{s.foot}</span>
          <span>
            <Link href="/features">{s.allFeatures}</Link> · <Link href="/about">{s.backHome}</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
