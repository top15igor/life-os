"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import LangMenu from "@/components/LangMenu";

/* ============== палитра/анимации (scoped под .life-modern) ============== */
const CSS = `
.life-modern{
  --ink:#26241f; --ink2:#56524b; --muted:#8b857c; --faint:#a8a299;
  --line:rgba(44,42,38,.07); --line2:rgba(44,42,38,.04);
  --paper:#f7f5f1; --card:#ffffff;
  --accent:#6f8f72; --accent-d:#5b7a60; --accent-bg:#e7efe7;
  --night:#26302a;
  background:var(--paper); color:var(--ink);
  font-family:'Onest',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
}
.life-modern *{box-sizing:border-box;}
.life-modern a{color:inherit;text-decoration:none;}
.life-modern .lm-balance{text-wrap:balance;}
.life-modern .lm-pretty{text-wrap:pretty;}
.life-modern .lm-nav:hover{color:var(--ink);}
.life-modern .lm-dark{transition:transform .2s,background .2s;}
.life-modern .lm-dark:hover{transform:translateY(-2px);background:#000;}
.life-modern .lm-soft{transition:transform .2s,box-shadow .2s;}
.life-modern .lm-soft:hover{transform:translateY(-2px);box-shadow:0 12px 26px -16px rgba(44,42,38,.4);}
.life-modern .lm-card{transition:transform .22s,box-shadow .22s;}
.life-modern .lm-card:hover{transform:translateY(-4px);box-shadow:0 22px 44px -26px rgba(44,42,38,.4);}
.life-modern .lm-light:hover{transform:translateY(-2px);}
@keyframes lmPulseRing{0%{transform:scale(.72);opacity:.5;}100%{transform:scale(2);opacity:0;}}
@keyframes lmBreathe{0%,100%{transform:scale(1);opacity:.5;}50%{transform:scale(1.16);opacity:.85;}}
@keyframes lmWave{0%,100%{transform:scaleY(.32);}50%{transform:scaleY(1);}}
@keyframes lmFloatUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes lmSpin{to{transform:rotate(360deg);}}
@keyframes lmDriftA{0%,100%{transform:translate(0,0);}50%{transform:translate(24px,-18px);}}
@keyframes lmDriftB{0%,100%{transform:translate(0,0);}50%{transform:translate(-20px,16px);}}
@media (max-width:880px){
  .life-modern .lm-navlinks{display:none!important;}
  .life-modern .lm-hero{grid-template-columns:1fr!important;gap:36px!important;}
  .life-modern .lm-how{grid-template-columns:repeat(2,1fr)!important;}
  .life-modern .lm-how-line{display:none!important;}
  .life-modern .lm-feats{grid-template-columns:1fr!important;}
  .life-modern .lm-book{grid-template-columns:1fr!important;gap:36px!important;}
  .life-modern .lm-stories{grid-template-columns:1fr!important;}
  .life-modern .lm-h1{font-size:40px!important;}
}
`;

/* ============== цвета категорий (общие для всех языков) ============== */
type CatKey = "food" | "sport" | "health" | "emotions" | "events" | "thoughts";
const CAT: Record<CatKey, { c: string; bg: string }> = {
  food: { c: "#b9824f", bg: "#f4ebe0" },
  sport: { c: "#6f8f72", bg: "#e7efe7" },
  health: { c: "#5f9a98", bg: "#e3eeed" },
  emotions: { c: "#bd7d93", bg: "#f3e7ec" },
  events: { c: "#7a8cc2", bg: "#e9ecf6" },
  thoughts: { c: "#9683c1", bg: "#ece8f4" },
};
const STEP_STYLE = [
  { color: "#5b7a60", bg: "#e7efe7", shadow: "rgba(91,122,96,.5)" },
  { color: "#b9824f", bg: "#f4ebe0", shadow: "rgba(185,130,79,.4)" },
  { color: "#5f9a98", bg: "#e3eeed", shadow: "rgba(95,154,152,.4)" },
  { color: "#9683c1", bg: "#ece8f4", shadow: "rgba(150,131,193,.4)" },
];
const AVATARS = [
  "linear-gradient(135deg,#d8c7b8,#b89c82)",
  "linear-gradient(135deg,#cdb8c7,#a98fa0)",
  "linear-gradient(135deg,#b8c7d8,#8298b8)",
  "linear-gradient(135deg,#bdd0bb,#8fa98c)",
];
const TESTI_BG = [
  "linear-gradient(135deg,#d8c7b8,#b89c82)",
  "linear-gradient(135deg,#cdb8c7,#a98fa0)",
  "linear-gradient(135deg,#b8c7d8,#8298b8)",
];

/* ============== тексты (4 языка) ============== */
type Cat = { key: CatKey; name: string; desc: string; phrases: string[] };
type Step = { title: string; desc: string };
type Testi = { name: string; role: string; quote: string };
type Entry = { text: string; cat: CatKey; time: string };
type Mic = { idle: [string, string]; recording: [string, string]; recognizing: [string, string]; sorted: string; savedTo: (c: string) => string };
type Dict = {
  nav: { how: string; features: string; book: string; stories: string; login: string; start: string };
  heroBadge: string; heroPre: string; heroItalic: string; heroPost: string; heroP: string;
  watch: string; statsCount: string; statsSub: string;
  today: string; micPrompt: string; mic: Mic;
  catName: Record<CatKey, string>;
  initial: Entry[]; queue: { text: string; cat: CatKey }[];
  howKicker: string; howTitle: string; howSub: string; steps: Step[];
  featKicker: string; featTitle: string; featSub: string; categories: Cat[];
  bookBadge: string; bookPre: string; bookItalic: string; bookPost: string; bookP: string; bookPoints: string[];
  chapterLabel: string; chapterTitle: string; aiLines: string[]; bookStats: { value: string; label: string }[];
  storiesKicker: string; storiesTitle: string; testimonials: Testi[];
  ctaTitle: string; ctaP: string; ctaPoints: string[];
  footerLinks: string[]; copyright: string;
  inApp: string; designA: string; designB: string;
};

function catList(names: Record<CatKey, string>, descs: Record<CatKey, string>, phrases: Record<CatKey, string[]>): Cat[] {
  return (Object.keys(CAT) as CatKey[]).map((k) => ({ key: k, name: names[k], desc: descs[k], phrases: phrases[k] }));
}

const D: Record<Locale, Dict> = {
  ru: {
    nav: { how: "Как это работает", features: "Возможности", book: "Книга жизни", stories: "Истории", login: "Войти", start: "Начать бесплатно" },
    heroBadge: "AI-дневник твоей жизни · второй мозг",
    heroPre: "Расскажи о своём дне — ", heroItalic: "а LIFE OS соберёт", heroPost: " его в книгу жизни.",
    heroP: "Еда, спорт, самочувствие, эмоции, события и мысли — просто проговори их. AI сам разложит всё по разделам и превратит в понятную историю твоей жизни.",
    watch: "Посмотреть, как это работает", statsCount: "Более 10 000 человек", statsSub: "уже сохраняют свою жизнь в LIFE OS",
    today: "Сегодня", micPrompt: "нажми на микрофон — попробуй сам",
    mic: { idle: ["Нажми и говори", "Я сам пойму, куда это сохранить"], recording: ["Слушаю…", "Говори спокойно, я записываю"], recognizing: ["Распознаю…", "Раскладываю по разделам"], sorted: "Готово", savedTo: (c) => `Сохранено в «${c}»` },
    catName: { food: "Питание", sport: "Спорт", health: "Самочувствие", emotions: "Эмоции", events: "События", thoughts: "Мысли" },
    initial: [{ text: "Пробежал 5,2 км вдоль реки", cat: "sport", time: "08:15" }, { text: "Съел омлет и салат", cat: "food", time: "11:30" }, { text: "Спокоен и сосредоточен", cat: "emotions", time: "14:20" }],
    queue: [{ text: "Выпил большой стакан воды", cat: "food" }, { text: "Сделал 20 минут растяжки", cat: "sport" }, { text: "Чувствую прилив сил после прогулки", cat: "health" }, { text: "Встретился с Андреем, обсудили проект", cat: "events" }, { text: "Появилась идея для нового продукта", cat: "thoughts" }],
    howKicker: "Как это работает", howTitle: "Просто говори о жизни — остальное сделает AI", howSub: "Никаких форм, тегов и таблиц. Ты рассказываешь — LIFE OS понимает, раскладывает и сохраняет.",
    steps: [{ title: "Расскажи", desc: "Голосом, текстом или фото — как удобно прямо сейчас." }, { title: "AI поймёт", desc: "Определит, о чём речь: еда, спорт, эмоции, событие или мысль." }, { title: "Разложит", desc: "Сохранит запись в нужный раздел и свяжет с прошлым." }, { title: "Создаст книгу", desc: "Соберёт всё в спокойную хронику и историю твоей жизни." }],
    featKicker: "Что внутри", featTitle: "Вся жизнь — в одном месте", featSub: "Скажи фразу — и она сама окажется в нужном разделе. Вот что LIFE OS понимает с ходу.",
    categories: catList(
      { food: "Питание", sport: "Спорт", health: "Самочувствие", emotions: "Эмоции", events: "События", thoughts: "Мысли" },
      { food: "Еда, вода, витамины", sport: "Тренировки, бег, шаги", health: "Энергия, сон, здоровье", emotions: "Настроение, чувства, стресс", events: "Встречи, поездки, моменты", thoughts: "Идеи, решения, инсайты" },
      { food: ["Съел омлет", "Выпил воды", "Принял витамины"], sport: ["Пробежал 5 км", "Сделал зарядку", "10 000 шагов"], health: ["Плохо спал", "Болит голова", "Много энергии"], emotions: ["Спокоен", "Раздражён", "Радостно"], events: ["Встреча с Андреем", "Поездка в горы"], thoughts: ["Идея для проекта", "Понял, что…"] }
    ),
    bookBadge: "AI создаёт автоматически", bookPre: "Из твоих слов рождается ", bookItalic: "книга жизни", bookPost: "",
    bookP: "Каждую неделю AI собирает записи в спокойную хронику: что менялось, что повторялось, что было важным. Через годы это станет бесценной историей — для тебя и будущих поколений.",
    bookPoints: ["AI пишет хронику за тебя — без усилий", "Видно, что менялось и что повторялось", "Полностью приватно — данные только твои"],
    chapterLabel: "ГЛАВА · ИЮНЬ 2026", chapterTitle: "«Месяц, когда ты снова начал бегать»",
    aiLines: ["Ты тренировался 11 раз — в 2 раза чаще, чем в мае.", "Сон стал ровнее в дни без позднего ужина.", "Больше всего энергии было в дни долгих прогулок."],
    bookStats: [{ value: "84 км", label: "пробежал за месяц" }, { value: "286", label: "записей о жизни" }, { value: "42", label: "важных инсайта" }],
    storiesKicker: "Истории", storiesTitle: "Что говорят те, кто уже ведёт LIFE OS",
    testimonials: [{ name: "Алексей", role: "Предприниматель", quote: "LIFE OS — как второй мозг. Я больше ничего не забываю и чувствую, что двигаюсь в правильном направлении." }, { name: "Мария", role: "Мама двоих детей", quote: "Теперь все важные моменты сохранены. Через годы это будет бесценная история нашей семьи." }, { name: "Игорь", role: "Путешественник", quote: "AI сам создаёт хронику моих поездок. Места, эмоции, события — всё в одном месте и красиво оформлено." }],
    ctaTitle: "Твоя жизнь заслуживает быть сохранённой", ctaP: "Начни сегодня — скажи первую фразу, и LIFE OS начнёт собирать твою историю.",
    ctaPoints: ["Бесплатно навсегда", "AI включён", "Данные под защитой"],
    footerLinks: ["О проекте", "Приватность", "Безопасность", "Контакты"], copyright: "© 2026 LIFE OS · Твой личный дневник жизни — второй мозг",
    inApp: "В приложение", designA: "Классика", designB: "Новый",
  },
  en: {
    nav: { how: "How it works", features: "Features", book: "Book of life", stories: "Stories", login: "Sign in", start: "Start free" },
    heroBadge: "An AI diary of your life · a second brain",
    heroPre: "Tell it about your day — ", heroItalic: "and LIFE OS turns it", heroPost: " into a book of life.",
    heroP: "Food, sport, wellbeing, emotions, events and thoughts — just say them out loud. AI sorts everything into sections and turns it into a clear story of your life.",
    watch: "See how it works", statsCount: "10,000+ people", statsSub: "are already saving their life in LIFE OS",
    today: "Today", micPrompt: "tap the mic — try it yourself",
    mic: { idle: ["Tap and speak", "I'll figure out where to save it"], recording: ["Listening…", "Speak calmly, I'm recording"], recognizing: ["Recognizing…", "Sorting into sections"], sorted: "Done", savedTo: (c) => `Saved to “${c}”` },
    catName: { food: "Food", sport: "Sport", health: "Wellbeing", emotions: "Emotions", events: "Events", thoughts: "Thoughts" },
    initial: [{ text: "Ran 5.2 km along the river", cat: "sport", time: "08:15" }, { text: "Had an omelet and salad", cat: "food", time: "11:30" }, { text: "Calm and focused", cat: "emotions", time: "14:20" }],
    queue: [{ text: "Drank a big glass of water", cat: "food" }, { text: "Did 20 minutes of stretching", cat: "sport" }, { text: "Feeling energized after a walk", cat: "health" }, { text: "Met with Andrew, discussed the project", cat: "events" }, { text: "Got an idea for a new product", cat: "thoughts" }],
    howKicker: "How it works", howTitle: "Just talk about your life — AI does the rest", howSub: "No forms, tags or tables. You talk — LIFE OS understands, sorts and saves.",
    steps: [{ title: "Tell it", desc: "By voice, text or photo — however suits you right now." }, { title: "AI understands", desc: "It detects the topic: food, sport, emotions, an event or a thought." }, { title: "It sorts", desc: "Saves the entry to the right section and links it to the past." }, { title: "Builds your book", desc: "Gathers it all into a calm chronicle and the story of your life." }],
    featKicker: "What's inside", featTitle: "Your whole life in one place", featSub: "Say a phrase — and it lands in the right section by itself. Here's what LIFE OS gets right away.",
    categories: catList(
      { food: "Food", sport: "Sport", health: "Wellbeing", emotions: "Emotions", events: "Events", thoughts: "Thoughts" },
      { food: "Meals, water, vitamins", sport: "Workouts, running, steps", health: "Energy, sleep, health", emotions: "Mood, feelings, stress", events: "Meetings, trips, moments", thoughts: "Ideas, decisions, insights" },
      { food: ["Had an omelet", "Drank water", "Took vitamins"], sport: ["Ran 5 km", "Did a workout", "10,000 steps"], health: ["Slept badly", "Headache", "Lots of energy"], emotions: ["Calm", "Irritated", "Joyful"], events: ["Met with Andrew", "Trip to the mountains"], thoughts: ["An idea for a project", "I realized that…"] }
    ),
    bookBadge: "AI builds it automatically", bookPre: "From your words, a ", bookItalic: "book of life", bookPost: " is born.",
    bookP: "Every week AI gathers your entries into a calm chronicle: what changed, what repeated, what mattered. Over the years it becomes a priceless story — for you and the generations to come.",
    bookPoints: ["AI writes the chronicle for you — effortlessly", "You see what changed and what repeated", "Fully private — your data is yours alone"],
    chapterLabel: "CHAPTER · JUNE 2026", chapterTitle: "“The month you started running again”",
    aiLines: ["You trained 11 times — twice as often as in May.", "Your sleep was steadier on days without a late dinner.", "You had the most energy on days with long walks."],
    bookStats: [{ value: "84 km", label: "run this month" }, { value: "286", label: "life entries" }, { value: "42", label: "key insights" }],
    storiesKicker: "Stories", storiesTitle: "What people already keeping LIFE OS say",
    testimonials: [{ name: "Alex", role: "Entrepreneur", quote: "LIFE OS is like a second brain. I don't forget anything anymore and feel I'm moving in the right direction." }, { name: "Maria", role: "Mom of two", quote: "Now all the important moments are saved. In years it'll be a priceless story of our family." }, { name: "Igor", role: "Traveler", quote: "AI creates the chronicle of my trips by itself. Places, emotions, events — all in one place, beautifully laid out." }],
    ctaTitle: "Your life deserves to be saved", ctaP: "Start today — say your first sentence, and LIFE OS begins gathering your story.",
    ctaPoints: ["Free forever", "AI included", "Data protected"],
    footerLinks: ["About", "Privacy", "Security", "Contact"], copyright: "© 2026 LIFE OS · Your personal life diary — a second brain",
    inApp: "Back to app", designA: "Classic", designB: "New",
  },
  uk: {
    nav: { how: "Як це працює", features: "Можливості", book: "Книга життя", stories: "Історії", login: "Увійти", start: "Почати безкоштовно" },
    heroBadge: "AI-щоденник твого життя · другий мозок",
    heroPre: "Розкажи про свій день — ", heroItalic: "а LIFE OS збере", heroPost: " його в книгу життя.",
    heroP: "Їжа, спорт, самопочуття, емоції, події та думки — просто проговори їх. AI сам розкладе все по розділах і перетворить на зрозумілу історію твого життя.",
    watch: "Подивитися, як це працює", statsCount: "Понад 10 000 людей", statsSub: "уже зберігають своє життя в LIFE OS",
    today: "Сьогодні", micPrompt: "натисни на мікрофон — спробуй сам",
    mic: { idle: ["Натисни і говори", "Я сам зрозумію, куди це зберегти"], recording: ["Слухаю…", "Говори спокійно, я записую"], recognizing: ["Розпізнаю…", "Розкладаю по розділах"], sorted: "Готово", savedTo: (c) => `Збережено в «${c}»` },
    catName: { food: "Харчування", sport: "Спорт", health: "Самопочуття", emotions: "Емоції", events: "Події", thoughts: "Думки" },
    initial: [{ text: "Пробіг 5,2 км уздовж річки", cat: "sport", time: "08:15" }, { text: "З'їв омлет і салат", cat: "food", time: "11:30" }, { text: "Спокійний і зосереджений", cat: "emotions", time: "14:20" }],
    queue: [{ text: "Випив велику склянку води", cat: "food" }, { text: "Зробив 20 хвилин розтяжки", cat: "sport" }, { text: "Відчуваю приплив сил після прогулянки", cat: "health" }, { text: "Зустрівся з Андрієм, обговорили проєкт", cat: "events" }, { text: "З'явилася ідея для нового продукту", cat: "thoughts" }],
    howKicker: "Як це працює", howTitle: "Просто говори про життя — решту зробить AI", howSub: "Жодних форм, тегів і таблиць. Ти розповідаєш — LIFE OS розуміє, розкладає і зберігає.",
    steps: [{ title: "Розкажи", desc: "Голосом, текстом або фото — як зручно зараз." }, { title: "AI зрозуміє", desc: "Визначить, про що мова: їжа, спорт, емоції, подія чи думка." }, { title: "Розкладе", desc: "Збереже запис у потрібний розділ і зв'яже з минулим." }, { title: "Створить книгу", desc: "Збере все у спокійну хроніку та історію твого життя." }],
    featKicker: "Що всередині", featTitle: "Усе життя — в одному місці", featSub: "Скажи фразу — і вона сама опиниться в потрібному розділі. Ось що LIFE OS розуміє одразу.",
    categories: catList(
      { food: "Харчування", sport: "Спорт", health: "Самопочуття", emotions: "Емоції", events: "Події", thoughts: "Думки" },
      { food: "Їжа, вода, вітаміни", sport: "Тренування, біг, кроки", health: "Енергія, сон, здоров'я", emotions: "Настрій, почуття, стрес", events: "Зустрічі, поїздки, моменти", thoughts: "Ідеї, рішення, інсайти" },
      { food: ["З'їв омлет", "Випив води", "Прийняв вітаміни"], sport: ["Пробіг 5 км", "Зробив зарядку", "10 000 кроків"], health: ["Погано спав", "Болить голова", "Багато енергії"], emotions: ["Спокійний", "Роздратований", "Радісно"], events: ["Зустріч з Андрієм", "Поїздка в гори"], thoughts: ["Ідея для проєкту", "Зрозумів, що…"] }
    ),
    bookBadge: "AI створює автоматично", bookPre: "З твоїх слів народжується ", bookItalic: "книга життя", bookPost: "",
    bookP: "Щотижня AI збирає записи у спокійну хроніку: що змінювалося, що повторювалося, що було важливим. За роки це стане безцінною історією — для тебе й майбутніх поколінь.",
    bookPoints: ["AI пише хроніку за тебе — без зусиль", "Видно, що змінювалося і що повторювалося", "Повністю приватно — дані лише твої"],
    chapterLabel: "РОЗДІЛ · ЧЕРВЕНЬ 2026", chapterTitle: "«Місяць, коли ти знову почав бігати»",
    aiLines: ["Ти тренувався 11 разів — удвічі частіше, ніж у травні.", "Сон був рівнішим у дні без пізньої вечері.", "Найбільше енергії було в дні довгих прогулянок."],
    bookStats: [{ value: "84 км", label: "пробіг за місяць" }, { value: "286", label: "записів про життя" }, { value: "42", label: "важливих інсайти" }],
    storiesKicker: "Історії", storiesTitle: "Що кажуть ті, хто вже веде LIFE OS",
    testimonials: [{ name: "Олексій", role: "Підприємець", quote: "LIFE OS — як другий мозок. Я більше нічого не забуваю і відчуваю, що рухаюся в правильному напрямку." }, { name: "Марія", role: "Мама двох дітей", quote: "Тепер усі важливі моменти збережені. За роки це буде безцінна історія нашої родини." }, { name: "Ігор", role: "Мандрівник", quote: "AI сам створює хроніку моїх подорожей. Місця, емоції, події — усе в одному місці й гарно оформлено." }],
    ctaTitle: "Твоє життя заслуговує бути збереженим", ctaP: "Почни сьогодні — скажи першу фразу, і LIFE OS почне збирати твою історію.",
    ctaPoints: ["Безкоштовно назавжди", "AI увімкнено", "Дані під захистом"],
    footerLinks: ["Про проєкт", "Приватність", "Безпека", "Контакти"], copyright: "© 2026 LIFE OS · Твій особистий щоденник життя — другий мозок",
    inApp: "До застосунку", designA: "Класика", designB: "Новий",
  },
  fr: {
    nav: { how: "Comment ça marche", features: "Fonctions", book: "Livre de vie", stories: "Témoignages", login: "Se connecter", start: "Commencer gratuitement" },
    heroBadge: "Le journal IA de ta vie · un second cerveau",
    heroPre: "Raconte ta journée — ", heroItalic: "et LIFE OS la réunit", heroPost: " en un livre de vie.",
    heroP: "Repas, sport, bien-être, émotions, événements et pensées — dis-les simplement. L'IA range tout par sections et en fait une histoire claire de ta vie.",
    watch: "Voir comment ça marche", statsCount: "Plus de 10 000 personnes", statsSub: "sauvegardent déjà leur vie dans LIFE OS",
    today: "Aujourd'hui", micPrompt: "appuie sur le micro — essaie toi-même",
    mic: { idle: ["Appuie et parle", "Je trouve où l'enregistrer"], recording: ["J'écoute…", "Parle tranquillement, j'enregistre"], recognizing: ["Je reconnais…", "Je trie par sections"], sorted: "Terminé", savedTo: (c) => `Enregistré dans « ${c} »` },
    catName: { food: "Alimentation", sport: "Sport", health: "Bien-être", emotions: "Émotions", events: "Événements", thoughts: "Pensées" },
    initial: [{ text: "Couru 5,2 km le long de la rivière", cat: "sport", time: "08:15" }, { text: "Mangé une omelette et une salade", cat: "food", time: "11:30" }, { text: "Calme et concentré", cat: "emotions", time: "14:20" }],
    queue: [{ text: "Bu un grand verre d'eau", cat: "food" }, { text: "Fait 20 minutes d'étirements", cat: "sport" }, { text: "Je me sens plein d'énergie après une promenade", cat: "health" }, { text: "Rencontré André, parlé du projet", cat: "events" }, { text: "Eu une idée de nouveau produit", cat: "thoughts" }],
    howKicker: "Comment ça marche", howTitle: "Raconte ta vie — l'IA fait le reste", howSub: "Ni formulaires, ni tags, ni tableaux. Tu parles — LIFE OS comprend, trie et enregistre.",
    steps: [{ title: "Raconte", desc: "À la voix, au texte ou en photo — comme tu veux." }, { title: "L'IA comprend", desc: "Elle détecte le sujet : repas, sport, émotions, événement ou pensée." }, { title: "Elle trie", desc: "Range l'entrée dans la bonne section et la relie au passé." }, { title: "Crée ton livre", desc: "Rassemble tout en une chronique paisible, l'histoire de ta vie." }],
    featKicker: "Ce qu'il y a dedans", featTitle: "Toute ta vie au même endroit", featSub: "Dis une phrase — elle se range toute seule au bon endroit. Voici ce que LIFE OS comprend d'emblée.",
    categories: catList(
      { food: "Alimentation", sport: "Sport", health: "Bien-être", emotions: "Émotions", events: "Événements", thoughts: "Pensées" },
      { food: "Repas, eau, vitamines", sport: "Entraînements, course, pas", health: "Énergie, sommeil, santé", emotions: "Humeur, ressentis, stress", events: "Rencontres, voyages, moments", thoughts: "Idées, décisions, insights" },
      { food: ["Mangé une omelette", "Bu de l'eau", "Pris des vitamines"], sport: ["Couru 5 km", "Fait du sport", "10 000 pas"], health: ["Mal dormi", "Mal de tête", "Plein d'énergie"], emotions: ["Calme", "Irrité", "Joyeux"], events: ["Rencontre avec André", "Voyage en montagne"], thoughts: ["Une idée de projet", "J'ai compris que…"] }
    ),
    bookBadge: "L'IA le crée automatiquement", bookPre: "De tes mots naît ", bookItalic: "un livre de vie", bookPost: ".",
    bookP: "Chaque semaine, l'IA rassemble tes entrées en une chronique paisible : ce qui a changé, ce qui s'est répété, ce qui comptait. Au fil des ans, cela devient une histoire précieuse — pour toi et les générations à venir.",
    bookPoints: ["L'IA écrit la chronique pour toi — sans effort", "Tu vois ce qui a changé et ce qui s'est répété", "Totalement privé — tes données n'appartiennent qu'à toi"],
    chapterLabel: "CHAPITRE · JUIN 2026", chapterTitle: "« Le mois où tu t'es remis à courir »",
    aiLines: ["Tu t'es entraîné 11 fois — deux fois plus qu'en mai.", "Ton sommeil était plus stable les jours sans dîner tardif.", "Tu avais le plus d'énergie les jours de longues promenades."],
    bookStats: [{ value: "84 km", label: "courus ce mois" }, { value: "286", label: "entrées de vie" }, { value: "42", label: "insights clés" }],
    storiesKicker: "Témoignages", storiesTitle: "Ce que disent ceux qui tiennent déjà LIFE OS",
    testimonials: [{ name: "Alexis", role: "Entrepreneur", quote: "LIFE OS, c'est comme un second cerveau. Je n'oublie plus rien et je sens que je vais dans la bonne direction." }, { name: "Marie", role: "Maman de deux enfants", quote: "Tous les moments importants sont sauvegardés. Dans quelques années, ce sera une histoire précieuse de notre famille." }, { name: "Igor", role: "Voyageur", quote: "L'IA crée toute seule la chronique de mes voyages. Lieux, émotions, événements — tout au même endroit, joliment présenté." }],
    ctaTitle: "Ta vie mérite d'être sauvegardée", ctaP: "Commence aujourd'hui — dis ta première phrase, et LIFE OS commence à rassembler ton histoire.",
    ctaPoints: ["Gratuit pour toujours", "IA incluse", "Données protégées"],
    footerLinks: ["À propos", "Confidentialité", "Sécurité", "Contact"], copyright: "© 2026 LIFE OS · Ton journal de vie personnel — un second cerveau",
    inApp: "Vers l'app", designA: "Classique", designB: "Nouveau",
  },
};

type MicState = "idle" | "recording" | "recognizing" | "sorted";

export default function AboutModern({ locale, intl, isAuthed, loginHref }: { locale: Locale; intl: string; isAuthed: boolean; loginHref: string }) {
  const t = D[locale] || D.ru;
  const homeHref = isAuthed ? "/" : loginHref;
  const startHref = isAuthed ? "/" : loginHref;

  const [mic, setMic] = useState<MicState>("idle");
  const [lastCat, setLastCat] = useState<CatKey>("sport");
  const [entries, setEntries] = useState<(Entry & { fresh?: boolean })[]>(t.initial);
  const [today, setToday] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoIdx = useRef(0);

  useEffect(() => {
    try {
      setToday(new Intl.DateTimeFormat(intl, { weekday: "long", day: "numeric", month: "long" }).format(new Date()));
    } catch {
      setToday("");
    }
  }, [intl]);

  // язык переключили — обновим стартовые записи
  useEffect(() => { setEntries(t.initial); setMic("idle"); }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearTimers = () => { timers.current.forEach((x) => clearTimeout(x)); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

  const startMic = () => {
    if (mic === "recording" || mic === "recognizing") { clearTimers(); setMic("idle"); return; }
    clearTimers();
    setMic("recording");
    timers.current.push(setTimeout(() => setMic("recognizing"), 1600));
    timers.current.push(setTimeout(() => {
      const item = t.queue[demoIdx.current % t.queue.length];
      demoIdx.current++;
      const entry = { text: item.text, cat: item.cat, time: nowTime(), fresh: true };
      setLastCat(item.cat);
      setEntries((s) => [entry, ...s].slice(0, 5));
      setMic("sorted");
    }, 3000));
    timers.current.push(setTimeout(() => setMic("idle"), 5400));
  };

  const micText = mic === "idle" ? t.mic.idle[0] : mic === "recording" ? t.mic.recording[0] : mic === "recognizing" ? t.mic.recognizing[0] : t.mic.sorted;
  const micSub = mic === "idle" ? t.mic.idle[1] : mic === "recording" ? t.mic.recording[1] : mic === "recognizing" ? t.mic.recognizing[1] : t.mic.savedTo(t.catName[lastCat]);
  const micBg = mic === "recording" ? "linear-gradient(140deg,#6f8f72,#52704f)" : "linear-gradient(140deg,var(--accent),var(--accent-d))";

  const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

  return (
    <div className="life-modern" style={{ overflowX: "hidden" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(14px)", background: "rgba(247,245,241,.82)", borderBottom: "1px solid var(--line)" }}>
        <nav style={{ ...wrap, padding: "16px 32px", display: "flex", alignItems: "center", gap: 36 }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 11, marginRight: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(140deg,var(--accent),var(--accent-d))", boxShadow: "0 5px 14px -5px rgba(91,122,96,.7)" }} />
            <span style={{ font: "700 18px 'Onest'", letterSpacing: "-.01em", color: "var(--ink)", whiteSpace: "nowrap" }}>LIFE OS</span>
          </a>
          <a href="#how" className="lm-nav lm-navlinks" style={{ font: "500 14.5px 'Onest'", color: "var(--ink2)" }}>{t.nav.how}</a>
          <a href="#features" className="lm-nav lm-navlinks" style={{ font: "500 14.5px 'Onest'", color: "var(--ink2)" }}>{t.nav.features}</a>
          <a href="#book" className="lm-nav lm-navlinks" style={{ font: "500 14.5px 'Onest'", color: "var(--ink2)" }}>{t.nav.book}</a>
          <a href="#stories" className="lm-nav lm-navlinks" style={{ font: "500 14.5px 'Onest'", color: "var(--ink2)" }}>{t.nav.stories}</a>
          {!isAuthed && <a href={loginHref} className="lm-nav lm-navlinks" style={{ font: "500 14.5px 'Onest'", color: "var(--ink2)", marginLeft: 8 }}>{t.nav.login}</a>}
          <LangMenu current={locale} align="right" />
          <a href={startHref} className="lm-dark" style={{ padding: "11px 20px", borderRadius: 12, background: "var(--ink)", color: "#fff", font: "600 14px 'Onest'" }}>{isAuthed ? t.inApp : t.nav.start}</a>
        </nav>
      </header>

      <a id="top" />

      {/* HERO */}
      <section style={{ ...wrap, position: "relative", padding: "78px 32px 60px" }}>
        <div style={{ position: "absolute", top: -40, right: -60, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(111,143,114,.14),transparent 66%)", pointerEvents: "none", animation: "lmDriftA 16s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(184,156,130,.14),transparent 68%)", pointerEvents: "none", animation: "lmDriftB 19s ease-in-out infinite" }} />
        <div className="lm-hero" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center" }}>
          {/* left */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "var(--card)", border: "1px solid var(--line)", font: "500 13px 'Onest'", color: "var(--accent-d)", marginBottom: 26, boxShadow: "0 2px 8px -4px rgba(44,42,38,.12)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />{t.heroBadge}
            </div>
            <h1 className="lm-h1 lm-balance" style={{ margin: "0 0 20px", font: "700 56px/1.08 'Onest'", letterSpacing: "-.03em", color: "var(--ink)" }}>
              {t.heroPre}<span style={{ fontFamily: "'Newsreader'", fontWeight: 500, fontStyle: "italic", color: "var(--accent-d)" }}>{t.heroItalic}</span>{t.heroPost}
            </h1>
            <p className="lm-pretty" style={{ margin: "0 0 32px", font: "400 19px/1.6 'Onest'", color: "var(--ink2)", maxWidth: 520 }}>{t.heroP}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <a href={startHref} className="lm-dark" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 26px", borderRadius: 14, background: "var(--ink)", color: "#fff", font: "600 16px 'Onest'", boxShadow: "0 14px 30px -14px rgba(44,42,38,.5)" }}>
                {isAuthed ? t.inApp : t.nav.start}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </a>
              <a href="#how" className="lm-soft" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 24px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink)", font: "600 16px 'Onest'" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-d)"><path d="M8 5v14l11-7z" /></svg>{t.watch}
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 34 }}>
              <div style={{ display: "flex" }}>
                {AVATARS.map((bg, i) => (<div key={i} style={{ width: 38, height: 38, borderRadius: "50%", background: bg, border: "2.5px solid var(--paper)", marginLeft: -10, flex: "none" }} />))}
              </div>
              <div style={{ lineHeight: 1.35 }}>
                <div style={{ font: "600 14.5px 'Onest'", color: "var(--ink)" }}>{t.statsCount}</div>
                <div style={{ font: "400 13.5px 'Onest'", color: "var(--muted)" }}>{t.statsSub}</div>
              </div>
            </div>
          </div>

          {/* right: voice demo */}
          <div style={{ position: "relative" }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 28, padding: "30px 28px 26px", boxShadow: "0 40px 90px -40px rgba(44,42,38,.45),0 0 0 1px rgba(44,42,38,.02)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, font: "600 14px 'Onest'", color: "var(--ink)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-bg)" }} />{t.today}</div>
                <span style={{ font: "400 13px 'Onest'", color: "var(--faint)" }}>{today}</span>
              </div>
              {/* mic */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "6px 0 18px" }}>
                <div style={{ position: "relative", width: 148, height: 148, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {mic === "recording" && (<>
                    <div style={{ position: "absolute", inset: 26, borderRadius: "50%", background: "rgba(111,143,114,.3)", animation: "lmPulseRing 2s ease-out infinite" }} />
                    <div style={{ position: "absolute", inset: 26, borderRadius: "50%", background: "rgba(111,143,114,.3)", animation: "lmPulseRing 2s ease-out infinite 1s" }} />
                  </>)}
                  {mic === "idle" && (<div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: "radial-gradient(circle,rgba(111,143,114,.32),transparent 70%)", animation: "lmBreathe 4.5s ease-in-out infinite" }} />)}
                  <button onClick={startMic} style={{ position: "relative", width: 106, height: 106, borderRadius: "50%", border: "none", cursor: "pointer", background: micBg, boxShadow: "0 18px 38px -14px rgba(91,122,96,.7),0 0 0 1px rgba(255,255,255,.25) inset", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .25s,background .3s" }}>
                    {mic === "recording" && (<div style={{ display: "flex", alignItems: "center", gap: 4, height: 36 }}>{[0, 1, 2, 3, 4, 5, 6].map((i) => (<span key={i} style={{ width: 4, height: 36, borderRadius: 3, background: "rgba(255,255,255,.92)", transformOrigin: "center", animation: "lmWave .9s ease-in-out infinite", animationDelay: (i * 0.09).toFixed(2) + "s" }} />))}</div>)}
                    {mic === "recognizing" && (<div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "lmSpin .9s linear infinite" }} />)}
                    {mic === "sorted" && (<span style={{ font: "300 48px/1 'Onest'", color: "#fff", marginTop: -5 }}>✓</span>)}
                    {mic === "idle" && (<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3.5" /></svg>)}
                  </button>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ font: "600 16px 'Onest'", color: "var(--ink)" }}>{micText}</div>
                  <div style={{ font: "400 13.5px 'Onest'", color: "var(--muted)", marginTop: 3 }}>{micSub}</div>
                </div>
              </div>
              {/* live entries */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                {entries.map((en, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderTop: "1px solid var(--line2)", animation: en.fresh ? "lmFloatUp .5s ease both" : "none" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: CAT[en.cat].c, flex: "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "500 14.5px 'Onest'", color: "#33302a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{en.text}</div></div>
                    <span style={{ padding: "3px 10px", borderRadius: 100, background: CAT[en.cat].bg, font: "500 11.5px 'Onest'", color: CAT[en.cat].c, flex: "none" }}>{t.catName[en.cat]}</span>
                    <span style={{ font: "400 12.5px 'Onest'", color: "var(--faint)", flex: "none" }}>{en.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -13, font: "400 12.5px 'Onest'", color: "var(--faint)", background: "var(--paper)", padding: "0 10px" }}>{t.micPrompt}</div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{ ...wrap, padding: "56px 32px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ font: "500 13px 'Onest'", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent-d)", marginBottom: 12 }}>{t.howKicker}</div>
          <h2 className="lm-balance" style={{ margin: "0 0 12px", font: "700 38px 'Onest'", letterSpacing: "-.025em", color: "var(--ink)" }}>{t.howTitle}</h2>
          <p style={{ margin: "0 auto", maxWidth: 560, font: "400 17px/1.55 'Onest'", color: "var(--ink2)" }}>{t.howSub}</p>
        </div>
        <div className="lm-how" style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          <div className="lm-how-line" style={{ position: "absolute", top: 38, left: "12%", right: "12%", height: 2, background: "repeating-linear-gradient(90deg,var(--line) 0 8px,transparent 8px 16px)", zIndex: 0 }} />
          {t.steps.map((s, i) => (
            <div key={i} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 74, height: 74, borderRadius: 22, background: STEP_STYLE[i].bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: `0 14px 30px -16px ${STEP_STYLE[i].shadow}`, border: "4px solid var(--paper)" }}>
                <span style={{ font: "600 22px 'Onest'", color: STEP_STYLE[i].color }}>{i + 1}</span>
              </div>
              <h3 style={{ margin: "0 0 8px", font: "600 18px 'Onest'", color: "var(--ink)" }}>{s.title}</h3>
              <p style={{ margin: 0, font: "400 14.5px/1.5 'Onest'", color: "var(--muted)", maxWidth: 220 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ ...wrap, padding: "72px 32px 80px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
            <div>
              <div style={{ font: "500 13px 'Onest'", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent-d)", marginBottom: 12 }}>{t.featKicker}</div>
              <h2 className="lm-balance" style={{ margin: 0, font: "700 38px 'Onest'", letterSpacing: "-.025em", color: "var(--ink)" }}>{t.featTitle}</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 380, font: "400 16px/1.55 'Onest'", color: "var(--ink2)" }}>{t.featSub}</p>
          </div>
          <div className="lm-feats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {t.categories.map((c) => (
              <div key={c.key} className="lm-card" style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 22, padding: 26 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: CAT[c.key].bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><span style={{ width: 14, height: 14, borderRadius: 5, background: CAT[c.key].c }} /></div>
                  <div>
                    <div style={{ font: "600 17px 'Onest'", color: "var(--ink)" }}>{c.name}</div>
                    <div style={{ font: "400 13px 'Onest'", color: "var(--muted)" }}>{c.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {c.phrases.map((ph, j) => (<span key={j} style={{ padding: "6px 12px", borderRadius: 100, background: CAT[c.key].bg, font: "400 12.5px 'Newsreader'", fontStyle: "italic", color: CAT[c.key].c }}>«{ph}»</span>))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK (dark) */}
      <section id="book" style={{ background: "linear-gradient(165deg,#2f3a31,var(--night) 60%)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -60, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(143,175,143,.25),transparent 70%)", animation: "lmDriftA 18s ease-in-out infinite" }} />
        <div className="lm-book" style={{ ...wrap, padding: "84px 32px", position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 13px", borderRadius: 100, background: "rgba(255,255,255,.1)", font: "500 12.5px 'Onest'", color: "#cfe0cd", marginBottom: 22 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9fc09c" }} />{t.bookBadge}</div>
            <h2 className="lm-balance" style={{ margin: "0 0 18px", font: "700 42px/1.1 'Onest'", letterSpacing: "-.025em" }}>{t.bookPre}<span style={{ fontFamily: "'Newsreader'", fontWeight: 400, fontStyle: "italic", color: "#aecdab" }}>{t.bookItalic}</span>{t.bookPost}</h2>
            <p style={{ margin: "0 0 28px", font: "400 18px/1.6 'Onest'", color: "rgba(255,255,255,.78)", maxWidth: 480 }}>{t.bookP}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {t.bookPoints.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(159,192,156,.2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aecdab" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                  <span style={{ font: "400 16px 'Onest'", color: "rgba(255,255,255,.9)" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          {/* book spread */}
          <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: "30px 28px", backdropFilter: "blur(6px)" }}>
            <div style={{ font: "400 13px 'Onest'", color: "#9fb09b", letterSpacing: ".04em", marginBottom: 6 }}>{t.chapterLabel}</div>
            <div style={{ font: "500 26px/1.3 'Newsreader'", fontStyle: "italic", color: "#f3f1ea", marginBottom: 20 }}>{t.chapterTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {t.aiLines.map((l, i) => (<p key={i} style={{ margin: 0, font: "400 16px/1.55 'Onest'", color: "rgba(255,255,255,.84)", paddingLeft: 16, borderLeft: "2px solid rgba(159,192,156,.4)" }}>{l}</p>))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              {t.bookStats.map((st, i) => (
                <div key={i} style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,.06)", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ font: "700 24px 'Onest'", color: "#fff" }}>{st.value}</div>
                  <div style={{ font: "400 12.5px 'Onest'", color: "#9fb09b", marginTop: 2 }}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORIES */}
      <section id="stories" style={{ ...wrap, padding: "80px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ font: "500 13px 'Onest'", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent-d)", marginBottom: 12 }}>{t.storiesKicker}</div>
          <h2 style={{ margin: 0, font: "700 38px 'Onest'", letterSpacing: "-.025em", color: "var(--ink)" }}>{t.storiesTitle}</h2>
        </div>
        <div className="lm-stories" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {t.testimonials.map((tm, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
              <p className="lm-pretty" style={{ margin: 0, font: "400 18px/1.55 'Newsreader'", fontStyle: "italic", color: "#3a372f" }}>«{tm.quote}»</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: TESTI_BG[i % TESTI_BG.length], flex: "none" }} />
                <div><div style={{ font: "600 14.5px 'Onest'", color: "var(--ink)" }}>{tm.name}</div><div style={{ font: "400 13px 'Onest'", color: "var(--muted)" }}>{tm.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...wrap, padding: "24px 32px 80px" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 30, background: "linear-gradient(135deg,var(--accent-d),#3c5740)", padding: "64px 56px", color: "#fff" }}>
          <div style={{ position: "absolute", top: -90, right: -50, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.16),transparent 70%)", animation: "lmDriftB 17s ease-in-out infinite" }} />
          <div style={{ position: "relative", maxWidth: 680 }}>
            <h2 className="lm-balance" style={{ margin: "0 0 14px", font: "700 42px/1.12 'Onest'", letterSpacing: "-.025em" }}>{t.ctaTitle}</h2>
            <p style={{ margin: "0 0 30px", font: "400 18px/1.6 'Onest'", color: "rgba(255,255,255,.85)" }}>{t.ctaP}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <a href={startHref} className="lm-light" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "16px 28px", borderRadius: 14, background: "#fff", color: "var(--accent-d)", font: "600 16px 'Onest'", transition: "transform .2s" }}>
                {isAuthed ? t.inApp : t.nav.start}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: 6, flexWrap: "wrap" }}>
                {t.ctaPoints.map((p, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 14.5px 'Onest'", color: "rgba(255,255,255,.92)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{p}</div>))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--card)" }}>
        <div style={{ ...wrap, padding: "36px 32px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 11, marginRight: "auto" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(140deg,var(--accent),var(--accent-d))" }} />
            <span style={{ font: "700 17px 'Onest'", color: "var(--ink)" }}>LIFE OS</span>
          </a>
          <a href="/about" className="lm-nav" style={{ font: "500 14px 'Onest'", color: "var(--ink2)" }}>{t.footerLinks[0]}</a>
          <a href="/privacy" className="lm-nav" style={{ font: "500 14px 'Onest'", color: "var(--ink2)" }}>{t.footerLinks[1]}</a>
          <a href="/privacy" className="lm-nav" style={{ font: "500 14px 'Onest'", color: "var(--ink2)" }}>{t.footerLinks[2]}</a>
          <a href={startHref} className="lm-nav" style={{ font: "500 14px 'Onest'", color: "var(--ink2)" }}>{t.footerLinks[3]}</a>
          <span style={{ font: "400 13px 'Onest'", color: "var(--faint)", width: "100%", marginTop: 8 }}>{t.copyright}</span>
        </div>
      </footer>
    </div>
  );
}
