"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { intlOf } from "@/lib/i18n";

// ===== «Моя жизнь, [год]» — книга-летопись из записей =====

const STR: Record<string, any> = {
  ru: {
    almost: "Твоя книга за", growing: "растёт", pastReady: "готова к сборке", filledLabel: "наполнено",
    yearProgressLine: (p: number) => `Год прожит на ${p}% — книга наполняется вместе с тобой и будет дополняться до конца года.`,
    lifeCaption: "пишется всю жизнь",
    lifeProgressLine: (n: string) => `Автобиография пишется всю жизнь — у неё нет «готово». Пока записано: ${n}. Чем больше записей, тем живее и полнее книга.`,
    statHas: "есть материал", statSome: "немного материала", statEmpty: "пока пусто",
    lifeBook: "История моей жизни", allLife: "Вся жизнь",
    lifeSubtitle: "Автобиография всей моей жизни — написанная мной самим, при жизни, и оставленная следующим поколениям. Не просто факты обо мне, а моя жизнь, прожитая рядом со мной: мои решения, мой голос, мои уроки.",
    found: "LIFE OS собрал из твоих записей",
    entries: "записей", days: "дней", peopleW: "людей", places: "мест", voice: "голосовых",
    ready: "готовность", openBook: "Открыть книгу", build: "Собрать мою книгу",
    giftLine: "Подари близким не очередную вещь, а целый год, прожитый вместе с тобой. Книга, которую твоя семья будет перечитывать через поколения.",
    type: "Тип книги", recipient: "Кому книга",
    types: { year: "Мой год", gift: "Для близких", family: "Семейная", lifestory: "История жизни" },
    recipients: { self: "Себе", parents: "Родителям", children: "Детям", partner: "Партнёру", family: "Семье" },
    typeDesc: { year: "Итоги одного года: твои события, люди, инсайты и фото за выбранный год. Личная летопись.", gift: "Тёплая, подарочная версия — главные моменты года и твоё письмо тем, кто дорог.", family: "Общая история семьи: события, люди, традиции — книга для всех вас.", lifestory: "Большая автобиография за все годы — вся твоя жизнь в одной книге." },
    recipientDesc: { self: "Для себя — перечитывать, помнить и видеть свой путь со стороны.", parents: "В подарок родителям — показать, как ты живёшь, растёшь и что для тебя важно.", children: "Для детей — чтобы однажды они узнали тебя настоящим, твоим голосом.", partner: "Любимому человеку — ваши общие моменты, чувства и благодарность.", family: "Для всей семьи — общая память и истории, которые будут перечитывать." },
    contents: "Оглавление", dedication: "Посвящение",
    dedicationPh: "Кому ты посвящаешь эту книгу? Например: «Моим детям — чтобы вы знали меня настоящим».",
    letterSelf: "Письмо себе в следующий год", letterSelfPh: "Что бы ты хотел сказать себе через год?",
    letterClose: "Письмо близким", letterClosePh: "Слова тем, кто дорог. Их прочитают однажды.",
    save: "Сохранить", saved: "Сохранено ✓", saving: "Сохраняю…",
    open: "Открыть", close: "Свернуть", building: "AI пишет главу…", rebuild: "Пересобрать",
    editChapter: "Редактировать", addMyText: "Добавить свой текст", editMyText: "Изменить свой текст", resetAi: "Вернуть текст AI", saveEdit: "Сохранить", cancelEdit: "Отмена", myVersion: "твоя правка", myStory: "Моя история", editPh: "Пиши свою версию этой главы…", storyPh: "Допиши свою историю к этой главе…",
    configBook: "Настроить состав", doneConfig: "Готово", configHint: "Спрячь ненужные главы (глазок) или поменяй порядок (стрелки) — это твоя книга.",
    addPhoto: "Фото из памяти", pickerTitle: "Выбери фото для главы", pickerSub: "Из «Визуальной памяти»", noPhotos: "В «Визуальной памяти» пока нет фото — пришли фото боту или загрузи в разделе «Память».", toMemory: "Открыть «Память»", pickerDone: "Готово",
    howTitle: "Как создать свою книгу", guideOutro: "Книга растёт вместе с тобой — вернись и доработай в любой момент. Ничего не «портится»: AI-главы всегда можно пересобрать, правки и фото остаются твоими.",
    guide: [
      ["ti-microphone", "Наполняй дневник", "Чем больше записей боту (голос или текст) — тем богаче книга. Полоски у глав показывают, сколько материала уже собрано."],
      ["ti-sparkles", "Собери главы", "Раскрой главу и нажми «Собрать» — AI напишет её из твоих записей. Не нравится — «Пересобрать»."],
      ["ti-pencil", "Сделай текст своим", "«Редактировать» — поправь слова AI или допиши свою историю. Правка не теряется при пересборке (бейдж «твоя правка»)."],
      ["ti-users", "Почисти людей и места", "На страницах «Люди» и «Места»: переименуй («соседка» → имя), объедини дубли, скрой лишних — книга обновится сама."],
      ["ti-adjustments-horizontal", "Настрой состав", "Кнопка «Настроить состав» у Оглавления: спрячь ненужные главы (глазок) и поменяй порядок (стрелки)."],
      ["ti-photo", "Добавь фото", "В главе — «Фото из памяти»: выбери снимки из «Визуальной памяти», они встанут в книгу."],
      ["ti-mail-heart", "Напиши личное", "Посвящение, Письмо себе и Письмо близким — внизу страницы. Это сердце книги."],
      ["ti-book-2", "Читай и печатай", "«Читать книгу» → пролистай целиком → «Скачать / Печать (PDF)». Выбери тип книги и кому она."],
    ],
    addMore: "Добавь записей, чтобы наполнить главу", empty: "Книга начнётся, когда появятся записи за этот период.",
    monthsOpen: "Открыть месяц",
    full: "Заказать настоящую книгу", fullSub: "PDF — это файл в телефоне. Настоящая книга — это вещь: её ставят на полку, перечитывают и дарят. Реликвия, которая переживёт телефоны и аккаунты.",
    whyTitle: "Зачем книга, если PDF бесплатный?", whyReasons: ["PDF не подаришь — а книгу в коробке дарят на день рождения, юбилей, рождение ребёнка.", "Настоящая книга стоит на полке, её берут в руки и перечитывают всей семьёй.", "Бумага — это наследие: не зависит от телефона, аккаунта и того, что сервис когда-нибудь закроется.", "Печатать сотню страниц дома — морока. Мы сделаем красиво и качественно за тебя."],
    order: "Оставить заявку", ordered: "Заявка отправлена ✓ — мы свяжемся с тобой.", ordering: "Отправляю…",
    includes: "Что входит", orderNote: "Деньги сейчас НЕ списываются. Это предварительная заявка — она придёт команде LIFE OS, мы свяжемся с тобой, уточним детали (адрес, оформление) и поможем оплатить и напечатать.",
    soon: "печать скоро", tiersNote: "Цены — предварительные, на этапе тестирования.",
    reward: {
      haveTitle: "У тебя есть бесплатная печатная книга 🎁",
      haveSub: "Награда за приглашённых друзей. Оформи бесплатно тариф «Classic» — мягкая обложка, доставка почтой. Деньги не списываются.",
      claim: "Получить бесплатно", claiming: "Отправляю…",
      claimed: "Готово! Заявка на бесплатную книгу отправлена ✓ — мы свяжемся с тобой.",
      progressTitle: "Пригласи друзей — получи книгу бесплатно",
      progressSub: (n: number) => `Ещё ${n} ${plRu(n, ["друг", "друга", "друзей"])} с дневником — и печатная книга «Classic» будет бесплатной.`,
      activeOf: (a: number, p: number) => `Активных друзей: ${a} из ${p}`,
    },
    readTitle: "Моя жизнь", by: "Автор", print: "Скачать / Печать (PDF)", closeReader: "Закрыть",
    buildAll: "Собрать все главы", reading: "Читать книгу",
    overviewStrip: { entries: "записей", days: "дней с записями", people: "людей рядом", places: "мест" },
    chapTitles: { overview: "Год в одном взгляде", months: "Двенадцать глав года", family: "Семья и близкие", health: "Здоровье и спорт", work: "Работа и проекты", travel: "Путешествия и места", trace: "Мой след", self: "Что я понял о себе", people: "Люди, которым я благодарен", lessons: "Главные уроки года" },
    chapTitlesLife: { overview: "Жизнь в одном взгляде", months: "Главы по месяцам", lessons: "Главные уроки жизни" },
    dataLabels: { peopleYear: "Люди этого периода", placesYear: "Места", projects: "Проекты и дела", deeds: "Добрых дел", promises: "Обещаний выполнено", gratitude: "Благодарностей", mood: "Настроение", energy: "Энергия", health: "Здоровье", avg: "в среднем", highlights: "Яркие моменты" },
  },
  en: {
    almost: "Your book of", growing: "is growing", pastReady: "is ready to assemble", filledLabel: "filled",
    yearProgressLine: (p: number) => `The year is ${p}% lived — the book grows with you and keeps filling until December.`,
    lifeCaption: "written for a lifetime",
    lifeProgressLine: (n: string) => `An autobiography is written across a whole life — it has no “done”. So far recorded: ${n}. The more you write, the richer and fuller the book.`,
    statHas: "has material", statSome: "some material", statEmpty: "empty so far",
    lifeBook: "The Story of My Life", allLife: "Whole life",
    lifeSubtitle: "The autobiography of my whole life — written by me, in my own words, while I lived it, and left for the generations to come. Not just facts about me, but my life lived alongside me: my decisions, my voice, my lessons.",
    found: "LIFE OS gathered from your entries",
    entries: "entries", days: "days", peopleW: "people", places: "places", voice: "voice notes",
    ready: "ready", openBook: "Open the book", build: "Build my book",
    giftLine: "Give your loved ones not another thing, but a whole year lived alongside you. A book your family will reread for generations.",
    type: "Book type", recipient: "Recipient",
    types: { year: "My year", gift: "For loved ones", family: "Family", lifestory: "Life story" },
    recipients: { self: "Myself", parents: "Parents", children: "Children", partner: "Partner", family: "Family" },
    typeDesc: { year: "One year's story: your events, people, insights and photos for the chosen year. A personal chronicle.", gift: "A warm, gift version — the year's highlights and your letter to those you love.", family: "Your shared family story: events, people, traditions — a book for all of you.", lifestory: "A full autobiography across all years — your whole life in one book." },
    recipientDesc: { self: "For yourself — to reread, remember and see your path from aside.", parents: "A gift for parents — to show how you live, grow and what matters to you.", children: "For your children — so one day they know the real you, in your own voice.", partner: "For your loved one — your shared moments, feelings and gratitude.", family: "For the whole family — shared memory and stories to reread for years." },
    contents: "Contents", dedication: "Dedication",
    dedicationPh: "Who do you dedicate this book to?",
    letterSelf: "Letter to next year's self", letterSelfPh: "What would you tell yourself a year from now?",
    letterClose: "Letter to loved ones", letterClosePh: "Words for those you love. They'll read them one day.",
    save: "Save", saved: "Saved ✓", saving: "Saving…",
    open: "Open", close: "Collapse", building: "AI is writing the chapter…", rebuild: "Rebuild",
    editChapter: "Edit", addMyText: "Add your text", editMyText: "Edit your text", resetAi: "Restore AI text", saveEdit: "Save", cancelEdit: "Cancel", myVersion: "your edit", myStory: "My story", editPh: "Write your version of this chapter…", storyPh: "Add your own story to this chapter…",
    configBook: "Customize", doneConfig: "Done", configHint: "Hide chapters you don't need (eye) or reorder them (arrows) — it's your book.",
    addPhoto: "Photo from memory", pickerTitle: "Pick a photo for this chapter", pickerSub: "From Visual Memory", noPhotos: "No photos in Visual Memory yet — send a photo to the bot or upload in the «Memory» section.", toMemory: "Open Memory", pickerDone: "Done",
    howTitle: "How to create your book", guideOutro: "Your book grows with you — come back and refine it anytime. Nothing «breaks»: AI chapters can always be rebuilt, your edits and photos stay yours.",
    guide: [
      ["ti-microphone", "Fill your diary", "The more entries you send the bot (voice or text), the richer the book. The bars show how much material each chapter has."],
      ["ti-sparkles", "Build the chapters", "Open a chapter and tap «Build» — AI writes it from your entries. Don't like it? «Rebuild»."],
      ["ti-pencil", "Make the text yours", "«Edit» — fix the AI's words or add your own story. Your edit survives rebuilds («your edit» badge)."],
      ["ti-users", "Clean up people & places", "On the «People» and «Places» pages: rename, merge duplicates, hide extras — the book updates itself."],
      ["ti-adjustments-horizontal", "Customize contents", "The «Customize» button by the Contents: hide chapters (eye) and reorder them (arrows)."],
      ["ti-photo", "Add photos", "In a chapter — «Photo from memory»: pick shots from Visual Memory and they join the book."],
      ["ti-mail-heart", "Write something personal", "Dedication, Letter to yourself, Letter to loved ones — at the bottom. The heart of the book."],
      ["ti-book-2", "Read & print", "«Read the book» → flip through it → «Download / Print (PDF)». Choose the book type and recipient."],
    ],
    addMore: "Add entries to fill this chapter", empty: "The book begins once you have entries for this period.",
    monthsOpen: "Open month",
    full: "Order a real book", fullSub: "A PDF is a file on your phone. A real book is an object: it sits on a shelf, gets reread and given as a gift. An heirloom that outlives phones and accounts.",
    whyTitle: "Why a book if the PDF is free?", whyReasons: ["You can't gift a PDF — but a book in a box is given for birthdays, anniversaries, a new baby.", "A real book sits on the shelf, held in hands and reread by the whole family.", "Paper is a legacy: it doesn't depend on a phone, an account, or whether a service shuts down one day.", "Printing a hundred pages at home is a hassle. We make it beautifully and properly for you."],
    order: "Request it", ordered: "Request sent ✓ — we'll reach out to you.", ordering: "Sending…",
    includes: "What's included", orderNote: "You are NOT charged now. This is a preliminary request — it reaches the LIFE OS team, we'll contact you, confirm the details (address, finishing) and help you pay and print.",
    soon: "print coming soon", tiersNote: "Prices are preliminary, in testing.",
    reward: {
      haveTitle: "You have a free printed book 🎁",
      haveSub: "A reward for the friends you invited. Order the «Classic» softcover for free — delivered by mail. You are not charged.",
      claim: "Get it free", claiming: "Sending…",
      claimed: "Done! Your free book request is sent ✓ — we'll reach out to you.",
      progressTitle: "Invite friends — get a book for free",
      progressSub: (n: number) => `${n} more ${n === 1 ? "active friend" : "active friends"} with a diary and the «Classic» printed book is free.`,
      activeOf: (a: number, p: number) => `Active friends: ${a} of ${p}`,
    },
    readTitle: "My life", by: "By", print: "Download / Print (PDF)", closeReader: "Close",
    buildAll: "Build all chapters", reading: "Read the book",
    overviewStrip: { entries: "entries", days: "days journaled", people: "people close by", places: "places" },
    chapTitles: { overview: "The year at a glance", months: "Twelve chapters of the year", family: "Family & loved ones", health: "Health & sport", work: "Work & projects", travel: "Travels & places", trace: "My trace", self: "What I learned about myself", people: "People I'm grateful to", lessons: "Key lessons of the year" },
    chapTitlesLife: { overview: "Life at a glance", months: "Chapters by month", lessons: "Key lessons of my life" },
    dataLabels: { peopleYear: "People of this period", placesYear: "Places", projects: "Projects & work", deeds: "Good deeds", promises: "Promises kept", gratitude: "Gratitudes", mood: "Mood", energy: "Energy", health: "Health", avg: "on average", highlights: "Bright moments" },
  },
};
STR.uk = STR.ru;
STR.fr = STR.en;

const TIERS = [
  {
    id: "digital", name: "Digital", price: "19–29 €", icon: "ti-device-tablet",
    desc: { ru: "Цифровая книга + PDF", en: "Digital book + PDF" },
    tagline: { ru: "Сразу у тебя — на телефоне и в PDF", en: "Instantly yours — on your phone and as PDF" },
    features: {
      ru: ["Вся книга в красивом PDF", "Можно распечатать где угодно", "Все главы, фото и письма", "Обновляется, пока ты пишешь", "Готова за пару минут"],
      en: ["The whole book as a polished PDF", "Print it anywhere you like", "All chapters, photos and letters", "Updates as you keep writing", "Ready in a couple of minutes"],
    },
  },
  {
    id: "classic", name: "Classic", price: "69–99 €", icon: "ti-book",
    desc: { ru: "Печать, мягкая обложка", en: "Softcover print" },
    tagline: { ru: "Настоящая книга в руках", en: "A real book in your hands" },
    features: {
      ru: ["Печатная книга, мягкая обложка", "Качественная бумага и вёрстка", "Цветные фото", "Доставка почтой", "Цифровая версия в подарок"],
      en: ["Printed softcover book", "Quality paper and layout", "Color photos", "Delivered by mail", "Digital version included"],
    },
  },
  {
    id: "gift", name: "Gift", price: "119–159 €", icon: "ti-gift",
    desc: { ru: "Твёрдая обложка, подарочная", en: "Hardcover gift edition" },
    tagline: { ru: "Чтобы подарить близкому человеку", en: "To give to someone you love" },
    features: {
      ru: ["Премиум твёрдая обложка", "Подарочное оформление и коробка", "Персональное посвящение на обложке", "Плотная бумага, тиснение", "Цифровая версия в подарок"],
      en: ["Premium hardcover", "Gift wrapping and box", "Personal dedication on the cover", "Thick paper, embossing", "Digital version included"],
    },
  },
  {
    id: "family", name: "Family", price: "179–299 €", icon: "ti-users",
    desc: { ru: "Семейный комплект", en: "Family set" },
    tagline: { ru: "Несколько книг для всей семьи", en: "Several books for the whole family" },
    features: {
      ru: ["Несколько экземпляров", "Для родителей, детей, партнёра", "Общая семейная летопись", "Лучшая цена за экземпляр", "Все — в твёрдой обложке"],
      en: ["Several copies", "For parents, children, partner", "A shared family chronicle", "Best price per copy", "All in hardcover"],
    },
  },
];

// Склонение чисел для RU/UK: forms = [1, 2-4, 5+]
const RUFORMS: Record<string, [string, string, string]> = {
  entries: ["запись", "записи", "записей"],
  days: ["день", "дня", "дней"],
  people: ["человек", "человека", "человек"],
  places: ["место", "места", "мест"],
  voice: ["голосовое", "голосовых", "голосовых"],
};
function plRu(n: number, f: [string, string, string]): string {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return f[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
  return f[2];
}

function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size / 4} fontWeight={600} fill="var(--text)">{pct}%</text>
    </svg>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct >= 60 ? "var(--positive)" : pct >= 25 ? "var(--accent)" : "var(--text-3)" }} />
    </div>
  );
}

export default function BookOfLife({ book, meta, years, year, locale, userName, memories = [], referral = null }: any) {
  const s = STR[locale] || STR.ru;
  const router = useRouter();
  const isLife = year === 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // мета (посвящение/письма/тип/получатель)
  const [m, setM] = useState({ dedication: meta.dedication, letter_self: meta.letter_self, letter_close: meta.letter_close, recipient: meta.recipient || "self", book_type: meta.book_type || "year" });
  const [savedFlag, setSavedFlag] = useState<string | null>(null);
  const [savingFlag, setSavingFlag] = useState(false);

  async function saveMeta(patch: any, flag?: string) {
    setSavingFlag(true);
    setM((x) => ({ ...x, ...patch }));
    await fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, ...patch }) }).catch(() => {});
    setSavingFlag(false);
    if (flag) { setSavedFlag(flag); setTimeout(() => setSavedFlag((f) => (f === flag ? null : f)), 1800); }
  }

  // главы: AI-разделы и месяцы (общий кэш для оглавления и ридера)
  const [ai, setAi] = useState<Record<string, any>>(meta.sections || {});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [months, setMonths] = useState<Record<string, any>>({});
  const [monthLoading, setMonthLoading] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reader, setReader] = useState(false);

  // правки глав пользователем (его текст вместо/в дополнение к AI)
  const [edits, setEdits] = useState<Record<string, string>>(meta.edits || {});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  // состав книги: скрытые главы + порядок
  const allKeys: string[] = book.chapters.map((c: any) => c.key);
  const [hiddenCh, setHiddenCh] = useState<string[]>(() => (meta.layout?.hidden || []).filter((k: string) => allKeys.includes(k)));
  const [chOrder, setChOrder] = useState<string[]>(() => {
    const saved = (meta.layout?.order || []).filter((k: string) => allKeys.includes(k));
    return [...saved, ...allKeys.filter((k) => !saved.includes(k))];
  });
  const [configMode, setConfigMode] = useState(false);
  const orderedChapters = chOrder.map((k) => book.chapters.find((c: any) => c.key === k)).filter(Boolean);

  function saveLayout(hidden: string[], order: string[]) {
    fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, layout: { hidden, order } }) }).catch(() => {});
  }
  function toggleHide(key: string) {
    setHiddenCh((h) => { const n = h.includes(key) ? h.filter((x) => x !== key) : [...h, key]; saveLayout(n, chOrder); return n; });
  }
  function moveChapter(key: string, dir: -1 | 1) {
    setChOrder((o) => {
      const i = o.indexOf(key), j = i + dir;
      if (i < 0 || j < 0 || j >= o.length) return o;
      const n = [...o]; [n[i], n[j]] = [n[j], n[i]]; saveLayout(hiddenCh, n); return n;
    });
  }

  // фото в главах (urls из «Визуальной памяти»)
  const [photos, setPhotos] = useState<Record<string, string[]>>(meta.photos || {});
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  function savePhotos(key: string, urls: string[]) {
    fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, photoKey: key, photos: urls }) }).catch(() => {});
  }
  function togglePhoto(key: string, url: string) {
    setPhotos((p) => { const cur = p[key] || []; const next = cur.includes(url) ? cur.filter((u) => u !== url) : [...cur, url]; const n = { ...p, [key]: next }; if (!next.length) delete n[key]; savePhotos(key, next); return n; });
  }

  function startEdit(key: string, initial: string) { setEditKey(key); setEditDraft(initial || ""); }
  async function saveEdit(key: string) {
    const body = editDraft;
    setEditBusy(true);
    setEdits((c) => { const n = { ...c }; if (body.trim()) n[key] = body; else delete n[key]; return n; });
    setEditKey(null);
    await fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, editKey: key, editBody: body }) }).catch(() => {});
    setEditBusy(false);
  }
  async function clearEdit(key: string) {
    setEdits((c) => { const n = { ...c }; delete n[key]; return n; });
    await fetch("/api/book/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ year, editKey: key, editBody: "" }) }).catch(() => {});
  }

  // редактор главы: кнопки + textarea (для AI-глав правит текст, для глав-данных добавляет «Мою историю»)
  function chapterEditor(key: string, kind: "ai" | "data", extra?: any) {
    if (editKey === key) {
      return (
        <div style={{ marginTop: 12 }}>
          <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} placeholder={kind === "ai" ? s.editPh : s.storyPh} rows={kind === "ai" ? 9 : 4} autoFocus disabled={editBusy}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14.5, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setEditKey(null)} style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer", padding: "8px 12px" }}>{s.cancelEdit}</button>
            <button onClick={() => saveEdit(key)} disabled={editBusy} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer", opacity: editBusy ? 0.6 : 1 }}>{s.saveEdit}</button>
          </div>
        </div>
      );
    }
    const has = edits[key] != null;
    return (
      <>
        {kind === "data" && has && (
          <div style={{ marginTop: 12, background: "var(--accent-bg)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: "var(--accent-text)", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-pencil" style={{ fontSize: 12 }} />{s.myStory}</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{edits[key]}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button onClick={() => startEdit(key, kind === "ai" ? (has ? edits[key] : ai[key]?.body || "") : (edits[key] || ""))} style={ghostBtn}>
            <i className="ti ti-pencil" style={{ fontSize: 13 }} />{kind === "ai" ? s.editChapter : has ? s.editMyText : s.addMyText}
          </button>
          {kind === "ai" && has && <button onClick={() => clearEdit(key)} style={ghostBtn}><i className="ti ti-arrow-back-up" style={{ fontSize: 13 }} />{s.resetAi}</button>}
          {extra}
        </div>
      </>
    );
  }

  async function loadAi(type: string, fresh = false) {
    setAiLoading(type);
    const r = await fetch("/api/book/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, year, fresh }) }).then((x) => x.json()).catch(() => null);
    setAi((c) => ({ ...c, [type]: r?.ok ? r.section : null }));
    setAiLoading(null);
    return r?.section || null;
  }
  async function loadMonth(month: string) {
    if (months[month] !== undefined) return;
    setMonthLoading(month);
    const r = await fetch(`/api/lifebook?month=${month}`).then((x) => x.json()).catch(() => null);
    setMonths((c) => ({ ...c, [month]: r?.ok ? r.chapter : null }));
    setMonthLoading(null);
  }

  function monthLabel(month: string) {
    return new Intl.DateTimeFormat(intlOf(locale as any), { month: "long", year: "numeric" }).format(new Date(month + "-01T12:00:00"));
  }

  const st = book.stats;
  const titleOf = (k: string) => (isLife && s.chapTitlesLife?.[k]) || s.chapTitles[k] || k;

  // Слово с правильным склонением (RU/UK) или статичное (EN/FR).
  const ru = locale === "ru" || locale === "uk";
  const word = (n: number, key: string, fallback: string) => (ru && RUFORMS[key] ? plRu(n, RUFORMS[key]) : fallback);

  // ===== деривативный (детерминированный) контент для data-глав =====
  function dataChapter(key: string) {
    const L = s.dataLabels;
    if (key === "family") return <NameList items={book.people} label={L.peopleYear} icon="ti-user-heart" color="#ec4899" />;
    if (key === "travel") return <NameList items={book.places} label={L.placesYear} icon="ti-map-pin" color="#06b6d4" />;
    if (key === "work") return <NameList items={book.projects} label={L.projects} icon="ti-briefcase" color="#3b82f6" />;
    if (key === "health") return (
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {[["mood", st.mood], ["energy", st.energy], ["health", st.health]].filter(([, v]) => v != null).map(([k, v]: any) => (
          <div key={k}><div style={{ fontSize: 22, fontWeight: 700 }}>{v}<span style={{ fontSize: 12, color: "var(--text-3)" }}>/10</span></div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{L[k]} {L.avg}</div></div>
        ))}
      </div>
    );
    if (key === "trace") return (
      <div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: book.highlights.length ? 12 : 0 }}>
          <Num n={st.deeds} label={L.deeds} /><Num n={st.promisesDone} label={L.promises} /><Num n={st.gratitude} label={L.gratitude} />
        </div>
        {book.highlights.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>{L.highlights}</div>
            {book.highlights.map((h: any, i: number) => <div key={i} style={{ fontSize: 13.5, lineHeight: 1.5, padding: "3px 0", color: "var(--text)" }}>· {h.text}</div>)}
          </div>
        )}
      </div>
    );
    return null;
  }

  function aiBody(type: string) {
    const sec = ai[type];
    const edited = edits[type];
    if (!sec && edited == null) return null;
    const bodyText = edited != null ? edited : (sec?.body || "");
    const lines = String(bodyText).split("\n").filter((l: string) => l.trim());
    const isList = lines.length > 1 && lines.filter((l) => /^[—\-•]/.test(l.trim())).length >= lines.length - 1;
    return (
      <div className="fade-up">
        {(sec?.title || edited != null) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {sec?.title && <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-serif, Georgia, serif)" }}>{sec.title}</div>}
            {edited != null && <span style={{ fontSize: 11, color: "var(--accent-text)", background: "var(--accent-bg)", padding: "2px 8px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4 }}><i className="ti ti-pencil" style={{ fontSize: 11 }} />{s.myVersion}</span>}
          </div>
        )}
        {isList ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {lines.map((l, i) => <div key={i} style={{ fontSize: 14.5, lineHeight: 1.6, display: "flex", gap: 8 }}><span style={{ color: "var(--accent)" }}>—</span>{l.replace(/^[—\-•]\s*/, "")}</div>)}
          </div>
        ) : (
          <div style={{ fontSize: 14.5, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{bodyText}</div>
        )}
      </div>
    );
  }

  if (st.entries === 0 && years.every((y: any) => y.count === 0)) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  return (
    <div>
      {/* выбор года / «вся жизнь» */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        {years.map((y: any) => (
          <button key={y.year} onClick={() => router.push(`/lifebook?year=${y.year}`)} style={chip(year === y.year)}>{y.year}<span style={{ opacity: 0.6, fontSize: 11, marginLeft: 5 }}>{y.count}</span></button>
        ))}
        <button onClick={() => router.push(`/lifebook?year=0`)} style={chip(isLife)}>{s.allLife}</button>
      </div>

      {/* ГЕРОЙ */}
      <div style={{ borderRadius: 20, padding: "24px 22px", marginBottom: 18, background: "linear-gradient(135deg, var(--accent-bg), #fdf2f8 55%, #fff7ed)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              {isLife ? s.lifeBook : `${s.almost} ${year} ${book.stage === "past" ? s.pastReady : s.growing}`}
            </div>
            <div style={{ fontSize: 13, color: "var(--accent-text)", marginTop: 6 }}>
              {s.found}: <b>{st.entries}</b> {word(st.entries, "entries", s.entries)} · <b>{st.days}</b> {word(st.days, "days", s.days)} · <b>{st.people}</b> {word(st.people, "people", s.peopleW)} · <b>{st.places}</b> {word(st.places, "places", s.places)}{st.voice ? <> · <b>{st.voice}</b> {word(st.voice, "voice", s.voice)}</> : null}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {isLife ? (
              <i className="ti ti-infinity" style={{ fontSize: 44, color: "var(--accent)" }} />
            ) : (
              <Ring pct={book.readiness} size={68} />
            )}
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{isLife ? s.lifeCaption : s.filledLabel}</span>
          </div>
        </div>
        {book.stage === "current" && !isLife && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--accent-text)", lineHeight: 1.5, marginTop: 14, maxWidth: 560, background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "9px 12px" }}>
            <i className="ti ti-calendar-stats" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />{s.yearProgressLine(book.yearProgress)}
          </div>
        )}
        {isLife && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--accent-text)", lineHeight: 1.5, marginTop: 14, maxWidth: 560, background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "9px 12px" }}>
            <i className="ti ti-infinity" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />{s.lifeProgressLine(`${st.entries} ${word(st.entries, "entries", s.entries)}`)}
          </div>
        )}
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginTop: 14, maxWidth: 560 }}>{isLife ? s.lifeSubtitle : s.giftLine}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={() => setReader(true)} style={btnPrimary}>
            <i className="ti ti-book-2" style={{ fontSize: 17 }} />{book.readiness > 0 ? s.openBook : s.build}
          </button>
        </div>
      </div>

      {/* тип книги + получатель */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 18 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 9 }}>{s.type}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(s.types).map((k) => <button key={k} onClick={() => saveMeta({ book_type: k })} style={chip(m.book_type === k)}>{s.types[k]}</button>)}
          </div>
          {s.typeDesc?.[m.book_type] && <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 10 }}>{s.typeDesc[m.book_type]}</div>}
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 9 }}>{s.recipient}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(s.recipients).map((k) => <button key={k} onClick={() => saveMeta({ recipient: k })} style={chip(m.recipient === k)}>{s.recipients[k]}</button>)}
          </div>
          {s.recipientDesc?.[m.recipient] && <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 10 }}>{s.recipientDesc[m.recipient]}</div>}
        </div>
      </div>

      {/* КАК СОЗДАТЬ КНИГУ */}
      <div className="card" style={{ marginBottom: 18, padding: 0, overflow: "hidden" }}>
        <button onClick={() => setHelpOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <i className="ti ti-help-circle" style={{ fontSize: 19, color: "var(--accent)" }} />
          <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{s.howTitle}</span>
          <i className={`ti ti-chevron-${helpOpen ? "up" : "down"}`} style={{ fontSize: 17, color: "var(--text-3)" }} />
        </button>
        {helpOpen && (
          <div style={{ padding: "2px 15px 16px" }}>
            {s.guide.map(([icon, t2, d]: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--accent)" }} /></span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{i + 1}. {t2}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic", marginTop: 10, lineHeight: 1.5 }}>{s.guideOutro}</div>
          </div>
        )}
      </div>

      {/* ПОСВЯЩЕНИЕ */}
      <Field label={s.dedication} value={m.dedication} ph={s.dedicationPh} onSave={(v) => saveMeta({ dedication: v }, "ded")} saved={savedFlag === "ded"} saving={savingFlag} s={s} icon="ti-quote" />

      {/* ОГЛАВЛЕНИЕ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 10px" }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{s.contents}</div>
        <button onClick={() => { setConfigMode((v) => !v); setOpenKey(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", padding: 4 }}>
          <i className={`ti ${configMode ? "ti-check" : "ti-adjustments-horizontal"}`} style={{ fontSize: 15 }} />{configMode ? s.doneConfig : s.configBook}
        </button>
      </div>
      {configMode && <div style={{ fontSize: 12.5, color: "var(--text-3)", margin: "0 2px 10px", lineHeight: 1.5 }}>{s.configHint}</div>}
      {(configMode ? orderedChapters : orderedChapters.filter((c: any) => !hiddenCh.includes(c.key))).map((ch: any, chIdx: number) => {
        const open = openKey === ch.key && !configMode;
        const isHidden = hiddenCh.includes(ch.key);
        return (
          <div key={ch.key} className="card" style={{ marginBottom: 10, opacity: configMode && isHidden ? 0.5 : 1 }}>
            <div onClick={() => {
              if (configMode) return;
              const willOpen = !open; setOpenKey(willOpen ? ch.key : null);
              if (willOpen && ch.kind === "ai" && ai[ch.key] === undefined) loadAi(ch.key);
            }} style={{ display: "flex", alignItems: "center", gap: 12, cursor: configMode ? "default" : "pointer" }}>
              <i className={`ti ${ch.icon}`} style={{ fontSize: 19, color: "var(--accent)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{titleOf(ch.key)}</div>
                {isLife ? (
                  (() => {
                    const stt = ch.readiness >= 25 ? { t: s.statHas, c: "var(--positive)", bg: "#dcfce7" } : ch.readiness > 0 ? { t: s.statSome, c: "var(--accent-text)", bg: "var(--accent-bg)" } : { t: s.statEmpty, c: "var(--text-3)", bg: "var(--surface-2)" };
                    return <div style={{ marginTop: 6 }}><span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 10px", borderRadius: 99, background: stt.bg, color: stt.c }}>{stt.t}</span></div>;
                  })()
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                    <Bar pct={ch.readiness} />
                    <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, width: 32, textAlign: "right" }}>{ch.readiness}%</span>
                  </div>
                )}
              </div>
              {configMode ? (
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); moveChapter(ch.key, -1); }} disabled={chIdx === 0} style={cfgBtn(chIdx === 0)}><i className="ti ti-chevron-up" style={{ fontSize: 16 }} /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveChapter(ch.key, 1); }} disabled={chIdx === orderedChapters.length - 1} style={cfgBtn(chIdx === orderedChapters.length - 1)}><i className="ti ti-chevron-down" style={{ fontSize: 16 }} /></button>
                  <button onClick={(e) => { e.stopPropagation(); toggleHide(ch.key); }} style={cfgBtn(false)}><i className={`ti ${isHidden ? "ti-eye" : "ti-eye-off"}`} style={{ fontSize: 16, color: isHidden ? "var(--accent)" : "var(--text-3)" }} /></button>
                </div>
              ) : (
                <span style={{ fontSize: 12.5, color: "var(--accent)", flexShrink: 0 }}>{open ? s.close : s.open}</span>
              )}
            </div>

            {open && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                {ch.kind === "ai" ? (
                  aiLoading === ch.key ? <Loading text={s.building} /> :
                  (ai[ch.key] || edits[ch.key] != null) ? (
                    <>
                      {editKey !== ch.key && aiBody(ch.key)}
                      {chapterEditor(ch.key, "ai", editKey !== ch.key && edits[ch.key] == null && ai[ch.key] ? <button onClick={() => loadAi(ch.key, true)} style={ghostBtn}><i className="ti ti-refresh" style={{ fontSize: 13 }} />{s.rebuild}</button> : null)}
                    </>
                  ) : ch.readiness < 10 ? <Muted text={s.addMore} /> : <button onClick={() => loadAi(ch.key)} style={ghostBtn}><i className="ti ti-sparkles" style={{ fontSize: 13 }} />{s.build}</button>
                ) : ch.kind === "months" ? (
                  book.months.length === 0 ? <Muted text={s.addMore} /> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {book.months.map((mm: any) => {
                        const mc = months[mm.month];
                        return (
                          <div key={mm.month} style={{ borderRadius: 10, background: "var(--surface-2)", padding: "10px 12px" }}>
                            <div onClick={() => loadMonth(mm.month)} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", alignItems: "center" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 500, textTransform: "capitalize" }}>{monthLabel(mm.month)}</span>
                              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{mm.count} {s.entries}{mc === undefined ? ` · ${s.monthsOpen}` : ""}</span>
                            </div>
                            {monthLoading === mm.month ? <div style={{ marginTop: 8 }}><Loading text={s.building} /></div> :
                             mc ? (
                              <div className="fade-up" style={{ marginTop: 9 }}>
                                <div style={{ fontSize: 14.5, fontWeight: 500, fontFamily: "var(--font-serif, Georgia, serif)", marginBottom: 6 }}>{mc.title}</div>
                                <div style={{ fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{mc.narrative}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  ch.readiness < 8 && edits[ch.key] == null && editKey !== ch.key ? <Muted text={s.addMore} /> : <>{ch.readiness >= 8 && dataChapter(ch.key)}{chapterEditor(ch.key, "data")}</>
                )}
                {/* фото главы */}
                {editKey !== ch.key && (
                  <>
                    <PhotoStrip urls={photos[ch.key] || []} onRemove={(u) => togglePhoto(ch.key, u)} />
                    <button onClick={() => setPickerKey(ch.key)} style={{ ...ghostBtn, marginTop: 12 }}><i className="ti ti-photo-plus" style={{ fontSize: 14 }} />{s.addPhoto}</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ПИСЬМА */}
      <div style={{ marginTop: 18 }}>
        <Field label={s.letterSelf} value={m.letter_self} ph={s.letterSelfPh} onSave={(v) => saveMeta({ letter_self: v }, "ls")} saved={savedFlag === "ls"} saving={savingFlag} s={s} icon="ti-mail-forward" big />
        <Field label={s.letterClose} value={m.letter_close} ph={s.letterClosePh} onSave={(v) => saveMeta({ letter_close: v }, "lc")} saved={savedFlag === "lc"} saving={savingFlag} s={s} icon="ti-mail-heart" big />
      </div>

      {/* ПОЛНАЯ КНИГА */}
      <FullBook s={s} locale={locale} year={year} bookType={m.book_type} recipient={m.recipient} referral={referral} />

      {/* РИДЕР */}
      {reader && mounted && createPortal(
        <Reader
          book={book} meta={m} year={year} locale={locale} userName={userName} s={s} isLife={isLife}
          ai={ai} months={months} monthLabel={monthLabel} aiBody={aiBody} dataChapter={dataChapter} titleOf={titleOf}
          loadAi={loadAi} loadMonth={loadMonth} aiLoading={aiLoading} monthLoading={monthLoading} hidden={hiddenCh} photos={photos}
          onClose={() => setReader(false)}
        />, document.body)}

      {pickerKey && mounted && createPortal(
        <PhotoPicker memories={memories} selected={photos[pickerKey] || []} onToggle={(u: string) => togglePhoto(pickerKey, u)} onClose={() => setPickerKey(null)} s={s} />,
        document.body)}
    </div>
  );
}

// ===== РИДЕР (полноэкранный, печать) =====
function Reader({ book, meta, year, locale, userName, s, isLife, ai, months, monthLabel, aiBody, dataChapter, titleOf, loadAi, loadMonth, aiLoading, monthLoading, hidden = [], photos = {}, onClose }: any) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = prev; };
  }, [onClose]);

  async function buildAll() {
    setBusy(true);
    await Promise.all([
      ai.overview === undefined ? loadAi("overview") : null,
      ai.self === undefined ? loadAi("self") : null,
      ai.lessons === undefined ? loadAi("lessons") : null,
      ai.people === undefined ? loadAi("people") : null,
      ...book.months.map((mm: any) => loadMonth(mm.month)),
    ].filter(Boolean));
    setBusy(false);
  }

  function doPrint() {
    document.body.classList.add("printing");
    const after = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", after); };
    window.addEventListener("afterprint", after);
    window.print();
  }

  const L = s.dataLabels;
  const cover = (
    <div className="book-page book-cover">
      <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>LIFE OS</div>
      {isLife ? (
        <div className="serif" style={{ fontSize: 38, fontWeight: 600, lineHeight: 1.15, maxWidth: 460 }}>{s.lifeBook}</div>
      ) : (
        <div className="serif" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.15 }}>{s.readTitle},<br />{year}</div>
      )}
      {isLife && <div className="serif" style={{ fontSize: 15, fontStyle: "italic", color: "var(--text-2)", marginTop: 16, lineHeight: 1.6, maxWidth: 420 }}>{s.lifeSubtitle}</div>}
      {meta.dedication && <div className="serif" style={{ fontSize: 16, fontStyle: "italic", color: "var(--text-2)", marginTop: 28, lineHeight: 1.6, maxWidth: 420 }}>«{meta.dedication}»</div>}
      <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 40 }}>{s.by}: {userName || "—"}</div>
    </div>
  );

  return (
    <div className="print-root" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#efece4", overflowY: "auto" }}>
      {/* панель управления (не печатается) */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onClose} style={ghostBtn}><i className="ti ti-arrow-left" style={{ fontSize: 15 }} />{s.closeReader}</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={buildAll} disabled={busy} style={ghostBtn}><i className={`ti ${busy ? "ti-loader-2" : "ti-sparkles"}`} style={{ fontSize: 15 }} />{s.buildAll}</button>
          <button onClick={doPrint} style={btnPrimary}><i className="ti ti-download" style={{ fontSize: 16 }} />{s.print}</button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
        {cover}

        {/* Год в одном взгляде */}
        {!hidden.includes("overview") && <Page title={titleOf("overview")}>
          <div className="book-strip">
            <span><b>{book.stats.entries}</b> {s.overviewStrip.entries}</span>
            <span><b>{book.stats.days}</b> {s.overviewStrip.days}</span>
            <span><b>{book.stats.people}</b> {s.overviewStrip.people}</span>
            <span><b>{book.stats.places}</b> {s.overviewStrip.places}</span>
          </div>
          {ai.overview ? aiBody("overview") : aiLoading === "overview" ? <Loading text={s.building} /> : <BuildBtn onClick={() => loadAi("overview")} s={s} />}
          <PhotoStrip urls={photos.overview || []} />
        </Page>}

        {/* 12 месяцев */}
        {!hidden.includes("months") && book.months.length > 0 && (
          <Page title={titleOf("months")}>
            {book.months.map((mm: any) => {
              const mc = months[mm.month];
              return (
                <div key={mm.month} style={{ marginBottom: 22 }}>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 600, textTransform: "capitalize", marginBottom: 8 }}>{monthLabel(mm.month)}</div>
                  {mc ? <div className="book-text">{mc.title ? <b>{mc.title}. </b> : null}{mc.narrative}</div>
                    : monthLoading === mm.month ? <Loading text={s.building} />
                    : <BuildBtn onClick={() => loadMonth(mm.month)} s={s} />}
                </div>
              );
            })}
          </Page>
        )}

        {/* data-главы */}
        {[["family", "ti-users"], ["health", "ti-heartbeat"], ["work", "ti-briefcase"], ["travel", "ti-plane"], ["trace", "ti-heart-handshake"]].filter(([k]) => !hidden.includes(k)).map(([k]) => {
          const node = dataChapter(k);
          const ph = photos[k] || [];
          if (!node && !ph.length) return null;
          return <Page key={k} title={titleOf(k)}>{node}<PhotoStrip urls={ph} /></Page>;
        })}

        {/* AI-разделы */}
        {["self", "people", "lessons"].filter((k) => !hidden.includes(k)).map((k) => (
          <Page key={k} title={titleOf(k)}>
            {ai[k] ? aiBody(k) : aiLoading === k ? <Loading text={s.building} /> : <BuildBtn onClick={() => loadAi(k)} s={s} />}
            <PhotoStrip urls={photos[k] || []} />
          </Page>
        ))}

        {/* письма */}
        {meta.letter_self && <Page title={s.letterSelf}><div className="book-text serif" style={{ fontStyle: "italic" }}>{meta.letter_self}</div></Page>}
        {meta.letter_close && <Page title={s.letterClose}><div className="book-text serif" style={{ fontStyle: "italic" }}>{meta.letter_close}</div></Page>}
      </div>
    </div>
  );
}

// ===== «Получить полную книгу» =====
function FullBook({ s, locale, year, bookType, recipient, referral = null }: any) {
  const [sel, setSel] = useState("gift");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [claimState, setClaimState] = useState<"idle" | "sending" | "done">("idle");
  const ru = locale === "ru" || locale === "uk";
  const pick = (o: any) => (ru ? o.ru : o.en) || o.en || o.ru;
  const cur = TIERS.find((t) => t.id === sel);
  const available = referral?.available || 0;
  const rw = s.reward;

  async function order() {
    setState("sending");
    const text = `Хочу книгу LIFE OS.\nТариф: ${cur?.name} (${cur?.price})\nТип: ${bookType}\nКому: ${recipient}\nПериод: ${year || "вся жизнь"}`;
    await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "book_order", text }) }).catch(() => {});
    setState("done");
  }

  async function claim() {
    setClaimState("sending");
    const text = `БЕСПЛАТНАЯ книга-награда (Classic, мягкая обложка).\nТип: ${bookType}\nКому: ${recipient}\nПериод: ${year || "вся жизнь"}`;
    const r = await fetch("/api/referral", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }).then((x) => x.json()).catch(() => null);
    setClaimState(r?.ok ? "done" : "idle");
  }

  return (
    <div style={{ marginTop: 26, borderRadius: 18, padding: "22px", background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{s.full}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5, marginBottom: 14, lineHeight: 1.55 }}>{s.fullSub}</div>

      {/* Награда за приглашения: доступная бесплатная книга */}
      {rw && available >= 1 && (
        <div style={{ borderRadius: 14, padding: "16px 18px", marginBottom: 16, background: "var(--accent-bg)", border: "1.5px solid var(--accent)" }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6 }}>{rw.haveTitle}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>{rw.haveSub}</div>
          {claimState === "done" ? (
            <div style={{ fontSize: 13.5, color: "var(--positive)", fontWeight: 500 }}>{rw.claimed}</div>
          ) : (
            <button onClick={claim} disabled={claimState === "sending"} style={{ ...btnPrimary, background: "var(--positive)" }}>
              <i className="ti ti-gift" style={{ fontSize: 16 }} />{claimState === "sending" ? rw.claiming : rw.claim}
            </button>
          )}
        </div>
      )}

      {/* Прогресс приглашений: сколько друзей осталось до бесплатной книги */}
      {rw && referral && available < 1 && (
        <div style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 16, background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🎁 {rw.progressTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>{rw.progressSub(referral.toNext)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ height: 6, borderRadius: 99, background: "var(--surface)", overflow: "hidden", flex: 1 }}>
              <div style={{ height: "100%", width: `${Math.round(((referral.active % referral.perBook) / referral.perBook) * 100)}%`, background: "var(--accent)" }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>{rw.activeOf(referral.active % referral.perBook, referral.perBook)}</span>
          </div>
        </div>
      )}

      {/* Зачем книга, если PDF бесплатный */}
      {s.whyReasons && (
        <div style={{ background: "var(--surface-2)", borderRadius: 13, padding: "13px 15px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 9, display: "flex", gap: 7, alignItems: "center" }}><i className="ti ti-help-circle" style={{ fontSize: 16, color: "var(--accent)" }} />{s.whyTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {s.whyReasons.map((r: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, color: "var(--text-2)" }}><i className="ti ti-point-filled" style={{ fontSize: 13, color: "var(--accent)", flexShrink: 0, marginTop: 3 }} />{r}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        {TIERS.map((t) => (
          <button key={t.id} onClick={() => setSel(t.id)} style={{ textAlign: "left", border: sel === t.id ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 13, padding: "13px 14px", background: sel === t.id ? "var(--accent-bg)" : "var(--surface)", cursor: "pointer" }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 20, color: "var(--accent)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "var(--accent-text)", fontWeight: 600, marginTop: 2 }}>{t.price}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>{pick(t.desc)}</div>
          </button>
        ))}
      </div>

      {/* Состав выбранного тарифа */}
      {cur && (
        <div style={{ background: "var(--surface-2)", borderRadius: 13, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{cur.name}</span>
            <span style={{ fontSize: 13, color: "var(--accent-text)", fontWeight: 600 }}>{cur.price}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>· {pick(cur.tagline)}</span>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>{s.includes}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {pick(cur.features).map((f: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.5 }}>
                <i className="ti ti-check" style={{ fontSize: 16, color: "var(--positive)", flexShrink: 0, marginTop: 1 }} />{f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Пояснение: куда идёт заявка и что оплаты сейчас нет */}
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 14, background: "var(--accent-bg)", borderRadius: 11, padding: "11px 13px" }}>
        <i className="ti ti-info-circle" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />{s.orderNote}
      </div>

      {state === "done" ? (
        <div style={{ fontSize: 14, color: "var(--positive)", fontWeight: 500 }}>{s.ordered}</div>
      ) : (
        <button onClick={order} disabled={state === "sending"} style={btnPrimary}>
          <i className="ti ti-send" style={{ fontSize: 16 }} />{state === "sending" ? s.ordering : s.order}
        </button>
      )}
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>{s.tiersNote}</div>
    </div>
  );
}

// ===== мелкие части =====
function Field({ label, value, ph, onSave, saved, saving, s, icon, big }: any) {
  const [v, setV] = useState(value || "");
  const [dirty, setDirty] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: "var(--accent)" }} />{label}
      </div>
      <textarea value={v} onChange={(e) => { setV(e.target.value); setDirty(true); }} placeholder={ph} rows={big ? 4 : 2}
        style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, lineHeight: 1.5, resize: "vertical", fontFamily: "inherit", background: "var(--surface-2)", color: "var(--text)" }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        {saved ? <span style={{ fontSize: 12.5, color: "var(--positive)" }}>{s.saved}</span> :
          <button onClick={() => { onSave(v); setDirty(false); }} disabled={!dirty || saving} style={{ ...ghostBtn, opacity: dirty ? 1 : 0.5 }}>{saving ? s.saving : s.save}</button>}
      </div>
    </div>
  );
}

function NameList({ items, label, icon, color }: any) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it: any) => (
          <span key={it.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "5px 11px", borderRadius: 99, background: "var(--surface-2)" }}>
            <i className={`ti ${icon}`} style={{ fontSize: 14, color }} />{it.name}{it.count > 1 ? <span style={{ color: "var(--text-3)", fontSize: 11 }}>×{it.count}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

const Num = ({ n, label }: any) => <div><div style={{ fontSize: 22, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div></div>;
const Loading = ({ text }: any) => <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-loader-2" style={{ fontSize: 15 }} />{text}</div>;
const Muted = ({ text }: any) => <div style={{ fontSize: 13, color: "var(--text-3)" }}>{text}</div>;
const BuildBtn = ({ onClick, s }: any) => <button onClick={onClick} style={ghostBtn}><i className="ti ti-sparkles" style={{ fontSize: 14 }} />{s.build}</button>;
function Page({ title, children }: any) {
  return (
    <div className="book-page">
      <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>{title}</div>
      {children}
    </div>
  );
}

// ===== стили-объекты =====
function chip(active: boolean): any {
  return { fontSize: 13, fontWeight: 500, padding: "6px 13px", borderRadius: 99, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-bg)" : "var(--surface)", color: active ? "var(--accent-text)" : "var(--text-2)", cursor: "pointer" };
}
const btnPrimary: any = { display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14.5, fontWeight: 600, cursor: "pointer" };
function PhotoStrip({ urls, onRemove }: { urls: string[]; onRemove?: (u: string) => void }) {
  if (!urls?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      {urls.map((u) => (
        <div key={u} style={{ position: "relative" }}>
          <a href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 10, display: "block" }} /></a>
          {onRemove && <button onClick={(e) => { e.preventDefault(); onRemove(u); }} aria-label="remove" style={{ position: "absolute", top: -7, right: -7, width: 21, height: 21, borderRadius: "50%", border: "2px solid var(--surface)", background: "rgba(0,0,0,0.7)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
        </div>
      ))}
    </div>
  );
}

function PhotoPicker({ memories, selected, onToggle, onClose, s }: any) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 620, maxHeight: "82vh", overflowY: "auto", padding: "18px 16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{s.pickerTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{s.pickerSub}</div>
          </div>
          <button onClick={onClose} style={ghostBtn}>{s.pickerDone}</button>
        </div>
        {memories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "26px 14px", color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6 }}>
            <i className="ti ti-photo-off" style={{ fontSize: 30, color: "var(--text-3)", display: "block", marginBottom: 8 }} />
            {s.noPhotos}
            <div style={{ marginTop: 10 }}><a href="/memory" style={{ color: "var(--accent)", fontSize: 13 }}>{s.toMemory} →</a></div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, marginTop: 12 }}>
            {memories.map((m: any) => {
              const on = selected.includes(m.url);
              return (
                <button key={m.id} onClick={() => onToggle(m.url)} title={m.title} style={{ position: "relative", padding: 0, border: on ? "3px solid var(--accent)" : "3px solid transparent", borderRadius: 12, cursor: "pointer", background: "none", aspectRatio: "1", overflow: "hidden" }}>
                  <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  {on && <span style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-check" style={{ fontSize: 13 }} /></span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const ghostBtn: any = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 13, cursor: "pointer" };
const cfgBtn = (dis: boolean): any => ({ background: "none", border: "none", cursor: dis ? "default" : "pointer", color: "var(--text-3)", padding: 4, opacity: dis ? 0.35 : 1, display: "inline-flex" });
