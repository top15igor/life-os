export type Locale = "ru" | "en" | "uk" | "fr";

export const LOCALES: { code: Locale; label: string; short: string; intl: string }[] = [
  { code: "ru", label: "Русский", short: "RU", intl: "ru-RU" },
  { code: "en", label: "English", short: "EN", intl: "en-GB" },
  { code: "uk", label: "Українська", short: "UK", intl: "uk-UA" },
  { code: "fr", label: "Français", short: "FR", intl: "fr-FR" },
];

export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(x: any): x is Locale {
  return x === "ru" || x === "en" || x === "uk" || x === "fr";
}
export function intlOf(l: Locale): string {
  return LOCALES.find((x) => x.code === l)?.intl || "ru-RU";
}

type Dict = {
  brand: string;
  nav: Record<string, string>;
  greetings: { night: string; morning: string; day: string; evening: string };
  entriesWord: string;
  quickCapture: string;
  quickHint: string;
  entriesOfDay: string;
  noEntriesToday: string;
  mood: string;
  energy: string;
  health: string;
  focus: string;
  diaryTitle: string;
  filters: { date: string; category: string; tags: string; mood: string; people: string };
  diaryEmpty: string;
  voice: string;
  text: string;
  entry: {
    back: string;
    title: string;
    voiceFull: string;
    textFull: string;
    original: string;
    aiSummary: string;
    extracted: string;
    tags: string;
    categories: string;
    people: string;
    projects: string;
    places: string;
    insights: string;
    tasks: string;
    gratitude: string;
    notFound: string;
  };
  cats: Record<string, string>;
};

const CAT_KEYS = [
  "health", "sport", "food", "family", "relationship", "business", "finance",
  "ideas", "insight", "task", "gratitude", "travel", "emotions", "problem", "decision", "event",
];

function cats(...names: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  CAT_KEYS.forEach((k, i) => (o[k] = names[i]));
  return o;
}

const dicts: Record<Locale, Dict> = {
  ru: {
    brand: "LIFE OS",
    nav: { today: "Сегодня", diary: "Дневник", health: "Здоровье", energy: "Энергия", sport: "Спорт", food: "Питание", family: "Семья", projects: "Проекты", insights: "Инсайты", goals: "Цели", lifebook: "Книга жизни", people: "Люди", places: "Места", analytics: "Аналитика", biographer: "Биограф" },
    greetings: { night: "Доброй ночи", morning: "Доброе утро", day: "Добрый день", evening: "Добрый вечер" },
    entriesWord: "записей",
    quickCapture: "Быстрая запись",
    quickHint: "Наговори голосовое или напиши боту в Telegram — запись появится здесь",
    entriesOfDay: "Записи дня",
    noEntriesToday: "Записей ещё нет. Напиши или наговори боту в Telegram — и они появятся здесь.",
    mood: "Настроение", energy: "Энергия", health: "Здоровье", focus: "Фокус",
    diaryTitle: "Дневник",
    filters: { date: "Дата", category: "Категория", tags: "Теги", mood: "Настроение", people: "Люди" },
    diaryEmpty: "Записей пока нет. Напиши боту в Telegram — здесь появится твоя лента.",
    voice: "Голос", text: "Текст",
    entry: { back: "к дневнику", title: "Запись", voiceFull: "голосовая", textFull: "текст", original: "Оригинал", aiSummary: "AI-резюме", extracted: "Извлечённые данные", tags: "Теги", categories: "Категории", people: "Люди", projects: "Проекты", places: "Места", insights: "Инсайты", tasks: "Задачи", gratitude: "Благодарность", notFound: "Запись не найдена." },
    cats: cats("Здоровье", "Спорт", "Питание", "Семья", "Отношения", "Бизнес", "Финансы", "Идеи", "Инсайты", "Задачи", "Благодарность", "Путешествия", "Эмоции", "Проблемы", "Решения", "События"),
  },
  en: {
    brand: "LIFE OS",
    nav: { today: "Today", diary: "Diary", health: "Health", energy: "Energy", sport: "Sport", food: "Food", family: "Family", projects: "Projects", insights: "Insights", goals: "Goals", lifebook: "Life Book", people: "People", places: "Places", analytics: "Analytics", biographer: "Biographer" },
    greetings: { night: "Good night", morning: "Good morning", day: "Good afternoon", evening: "Good evening" },
    entriesWord: "entries",
    quickCapture: "Quick capture",
    quickHint: "Send a voice note or text to the Telegram bot — it will appear here",
    entriesOfDay: "Entries of the day",
    noEntriesToday: "No entries yet. Write or speak to the Telegram bot — they will appear here.",
    mood: "Mood", energy: "Energy", health: "Health", focus: "Focus",
    diaryTitle: "Diary",
    filters: { date: "Date", category: "Category", tags: "Tags", mood: "Mood", people: "People" },
    diaryEmpty: "No entries yet. Write to the Telegram bot — your feed will appear here.",
    voice: "Voice", text: "Text",
    entry: { back: "back to diary", title: "Entry", voiceFull: "voice", textFull: "text", original: "Original", aiSummary: "AI summary", extracted: "Extracted data", tags: "Tags", categories: "Categories", people: "People", projects: "Projects", places: "Places", insights: "Insights", tasks: "Tasks", gratitude: "Gratitude", notFound: "Entry not found." },
    cats: cats("Health", "Sport", "Food", "Family", "Relationships", "Business", "Finance", "Ideas", "Insights", "Tasks", "Gratitude", "Travel", "Emotions", "Problems", "Decisions", "Events"),
  },
  uk: {
    brand: "LIFE OS",
    nav: { today: "Сьогодні", diary: "Щоденник", health: "Здоров'я", energy: "Енергія", sport: "Спорт", food: "Харчування", family: "Сім'я", projects: "Проєкти", insights: "Інсайти", goals: "Цілі", lifebook: "Книга життя", people: "Люди", places: "Місця", analytics: "Аналітика", biographer: "Біограф" },
    greetings: { night: "Доброї ночі", morning: "Доброго ранку", day: "Доброго дня", evening: "Доброго вечора" },
    entriesWord: "записів",
    quickCapture: "Швидкий запис",
    quickHint: "Надиктуй голосове або напиши боту в Telegram — запис з'явиться тут",
    entriesOfDay: "Записи дня",
    noEntriesToday: "Записів ще немає. Напиши або надиктуй боту в Telegram — і вони з'являться тут.",
    mood: "Настрій", energy: "Енергія", health: "Здоров'я", focus: "Фокус",
    diaryTitle: "Щоденник",
    filters: { date: "Дата", category: "Категорія", tags: "Теги", mood: "Настрій", people: "Люди" },
    diaryEmpty: "Записів поки немає. Напиши боту в Telegram — тут з'явиться твоя стрічка.",
    voice: "Голос", text: "Текст",
    entry: { back: "до щоденника", title: "Запис", voiceFull: "голосове", textFull: "текст", original: "Оригінал", aiSummary: "AI-резюме", extracted: "Витягнуті дані", tags: "Теги", categories: "Категорії", people: "Люди", projects: "Проєкти", places: "Місця", insights: "Інсайти", tasks: "Завдання", gratitude: "Вдячність", notFound: "Запис не знайдено." },
    cats: cats("Здоров'я", "Спорт", "Харчування", "Сім'я", "Стосунки", "Бізнес", "Фінанси", "Ідеї", "Інсайти", "Завдання", "Вдячність", "Подорожі", "Емоції", "Проблеми", "Рішення", "Події"),
  },
  fr: {
    brand: "LIFE OS",
    nav: { today: "Aujourd'hui", diary: "Journal", health: "Santé", energy: "Énergie", sport: "Sport", food: "Alimentation", family: "Famille", projects: "Projets", insights: "Insights", goals: "Objectifs", lifebook: "Livre de vie", people: "Personnes", places: "Lieux", analytics: "Analytique", biographer: "Biographe" },
    greetings: { night: "Bonne nuit", morning: "Bonjour", day: "Bon après-midi", evening: "Bonsoir" },
    entriesWord: "entrées",
    quickCapture: "Capture rapide",
    quickHint: "Envoie une note vocale ou un texte au bot Telegram — elle apparaîtra ici",
    entriesOfDay: "Entrées du jour",
    noEntriesToday: "Aucune entrée pour l'instant. Écris ou parle au bot Telegram — elles apparaîtront ici.",
    mood: "Humeur", energy: "Énergie", health: "Santé", focus: "Focus",
    diaryTitle: "Journal",
    filters: { date: "Date", category: "Catégorie", tags: "Tags", mood: "Humeur", people: "Personnes" },
    diaryEmpty: "Aucune entrée pour l'instant. Écris au bot Telegram — ton fil apparaîtra ici.",
    voice: "Voix", text: "Texte",
    entry: { back: "retour au journal", title: "Entrée", voiceFull: "vocale", textFull: "texte", original: "Original", aiSummary: "Résumé IA", extracted: "Données extraites", tags: "Tags", categories: "Catégories", people: "Personnes", projects: "Projets", places: "Lieux", insights: "Insights", tasks: "Tâches", gratitude: "Gratitude", notFound: "Entrée introuvable." },
    cats: cats("Santé", "Sport", "Alimentation", "Famille", "Relations", "Affaires", "Finances", "Idées", "Insights", "Tâches", "Gratitude", "Voyages", "Émotions", "Problèmes", "Décisions", "Événements"),
  },
};

export function getDict(l: Locale): Dict {
  return dicts[l] || dicts.ru;
}

export function greeting(l: Locale): string {
  const g = getDict(l).greetings;
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", hour12: false }).format(new Date()));
  if (h < 6) return g.night;
  if (h < 12) return g.morning;
  if (h < 18) return g.day;
  return g.evening;
}

export function dateLabel(l: Locale, d?: string): string {
  const date = d ? new Date(d + "T12:00:00") : new Date();
  return new Intl.DateTimeFormat(intlOf(l), { timeZone: "Europe/Kyiv", weekday: "long", day: "numeric", month: "long" }).format(date);
}
