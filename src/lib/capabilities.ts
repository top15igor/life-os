import type { Locale } from "./i18n";
import { getDict } from "./i18n";
import { hints } from "./hints";

// Полный перечень возможностей для публичного лендинга (/about).
// Группируем по темам и раскрываем в аккордеоне, чтобы человек сразу увидел,
// чем сервис ему полезен. Названия разделов берём из словаря навигации,
// описания — из hints (единый источник правды), плюс несколько «кастомных»
// пунктов (способы ввода, экспорт), которых нет среди разделов приложения.

export type Cap = { icon: string; name: string; desc: string };
export type CapGroup = { icon: string; color: string; title: string; items: Cap[] };
export type Capabilities = { kicker: string; title: string; sub: string; groups: CapGroup[] };

// Иконки для разделов приложения (совпадают со стилистикой Sidebar/Guide).
const ICON: Record<string, string> = {
  today: "ti-home",
  diary: "ti-book",
  tasks: "ti-checklist",
  health: "ti-heartbeat",
  energy: "ti-bolt",
  sport: "ti-run",
  food: "ti-salad",
  goals: "ti-target",
  projects: "ti-briefcase",
  finance: "ti-wallet",
  knowledge: "ti-bookmarks",
  memory: "ti-camera",
  books: "ti-books",
  wishlist: "ti-gift",
  analytics: "ti-sparkles",
  biographer: "ti-messages",
  lab: "ti-flask-2",
  lifebook: "ti-book-2",
  insights: "ti-bulb",
  intelligence: "ti-brain",
  people: "ti-user-heart",
  places: "ti-map-pin",
  family: "ti-users",
  profile: "ti-user",
};

// Кастомные пункты и заголовки групп — то, чего нет в hints/nav.
type T = {
  kicker: string;
  title: string;
  sub: string;
  g: { input: string; day: string; body: string; plans: string; know: string; ai: string; people: string; data: string };
  // способы ввода
  in_voice: Cap; in_text: Cap; in_photo: Cap; in_link: Cap;
  reminders: Cap;
  // данные
  export: Cap; privacy: Cap; opensource: Cap;
};

const TR: Record<Locale, T> = {
  ru: {
    kicker: "Как использовать",
    title: "Всё, что умеет LIFE OS",
    sub: "Нажми на раздел — раскроется список возможностей. Вести вручную ничего не нужно: ты просто рассказываешь, а LIFE OS сам раскладывает всё по этим полкам.",
    g: {
      input: "Как добавлять — без усилий",
      day: "Твой день и дневник",
      body: "Тело и здоровье",
      plans: "Планы, цели и дела",
      know: "Знания и память",
      ai: "AI осмысляет твою жизнь",
      people: "Люди, места, семья",
      data: "Данные под твоим контролем",
    },
    in_voice: { icon: "ti-brand-telegram", name: "Голос в Telegram", desc: "Наговори боту как другу — по дороге, между делами. AI расшифрует речь и сам всё разложит." },
    in_text: { icon: "ti-edit", name: "Текст и записи на сайте", desc: "Не любишь голос? Пиши свободным текстом — прямо в приложении или боту." },
    in_photo: { icon: "ti-camera", name: "Фото и документы", desc: "Пришли фото или скан — чек, гарантию, момент. AI поймёт смысл, вытащит данные и разложит по категориям." },
    in_link: { icon: "ti-link", name: "Ссылки Instagram и YouTube", desc: "Кинь боту ссылку на пост, reel или видео — AI вытащит суть и сохранит в базу знаний." },
    reminders: { icon: "ti-bell", name: "Напоминания и утро", desc: "Персональное утреннее сообщение и напоминания приходят в Telegram в удобное тебе время." },
    export: { icon: "ti-download", name: "Экспорт в Markdown и Obsidian", desc: "Скачай всё в один клик. Твоя книга жизни останется с тобой — даже без интернета и без нашего сервиса." },
    privacy: { icon: "ti-shield-lock", name: "Честная приватность", desc: "Дневник видишь только ты. Скачать или удалить всё — в один клик." },
    opensource: { icon: "ti-brand-github", name: "Открытый код", desc: "Проект публичный — можно проверить, как всё устроено внутри." },
  },
  en: {
    kicker: "How to use it",
    title: "Everything LIFE OS can do",
    sub: "Tap a section — it opens a list of features. Nothing to log by hand: you just talk, and LIFE OS sorts it all onto these shelves.",
    g: {
      input: "How you add things — effortlessly",
      day: "Your day and diary",
      body: "Body and health",
      plans: "Plans, goals and to-dos",
      know: "Knowledge and memory",
      ai: "AI makes sense of your life",
      people: "People, places, family",
      data: "Your data, your control",
    },
    in_voice: { icon: "ti-brand-telegram", name: "Voice in Telegram", desc: "Talk to the bot like to a friend — on the go, between things. AI transcribes and sorts it all." },
    in_text: { icon: "ti-edit", name: "Text and entries on the site", desc: "Not a fan of voice? Write in free text — right in the app or to the bot." },
    in_photo: { icon: "ti-camera", name: "Photos and documents", desc: "Send a photo or scan — a receipt, a warranty, a moment. AI grasps it, extracts the details and files it by category." },
    in_link: { icon: "ti-link", name: "Instagram and YouTube links", desc: "Send the bot a post, reel or video link — AI pulls out the gist and saves it to your knowledge base." },
    reminders: { icon: "ti-bell", name: "Reminders and mornings", desc: "A personal morning message and reminders arrive in Telegram at the time that suits you." },
    export: { icon: "ti-download", name: "Export to Markdown and Obsidian", desc: "Download everything in one click. Your book of life stays with you — even offline and without our service." },
    privacy: { icon: "ti-shield-lock", name: "Honest privacy", desc: "Only you see your diary. Export or delete everything in one click." },
    opensource: { icon: "ti-brand-github", name: "Open source", desc: "The project is public — you can check how everything works inside." },
  },
  uk: {
    kicker: "Як користуватися",
    title: "Усе, що вміє LIFE OS",
    sub: "Натисни на розділ — розкриється список можливостей. Вести вручну нічого не треба: ти просто розповідаєш, а LIFE OS сам розкладає все по цих поличках.",
    g: {
      input: "Як додавати — без зусиль",
      day: "Твій день і щоденник",
      body: "Тіло і здоров'я",
      plans: "Плани, цілі та справи",
      know: "Знання і пам'ять",
      ai: "AI осмислює твоє життя",
      people: "Люди, місця, сім'я",
      data: "Дані під твоїм контролем",
    },
    in_voice: { icon: "ti-brand-telegram", name: "Голос у Telegram", desc: "Наговори боту як другу — дорогою, між справами. AI розшифрує мову й сам усе розкладе." },
    in_text: { icon: "ti-edit", name: "Текст і записи на сайті", desc: "Не любиш голос? Пиши вільним текстом — прямо в застосунку або боту." },
    in_photo: { icon: "ti-camera", name: "Фото і документи", desc: "Надішли фото або скан — чек, гарантію, момент. AI зрозуміє суть, витягне дані й розкладе за категоріями." },
    in_link: { icon: "ti-link", name: "Посилання Instagram і YouTube", desc: "Кинь боту посилання на допис, reel чи відео — AI витягне суть і збереже в базу знань." },
    reminders: { icon: "ti-bell", name: "Нагадування і ранок", desc: "Персональне ранкове повідомлення й нагадування приходять у Telegram у зручний тобі час." },
    export: { icon: "ti-download", name: "Експорт у Markdown і Obsidian", desc: "Завантаж усе в один клік. Твоя книга життя залишиться з тобою — навіть без інтернету і без нашого сервісу." },
    privacy: { icon: "ti-shield-lock", name: "Чесна приватність", desc: "Щоденник бачиш лише ти. Завантажити або видалити все — в один клік." },
    opensource: { icon: "ti-brand-github", name: "Відкритий код", desc: "Проєкт публічний — можна перевірити, як усе влаштовано всередині." },
  },
  fr: {
    kicker: "Comment l'utiliser",
    title: "Tout ce que LIFE OS sait faire",
    sub: "Touche une section — la liste des possibilités s'ouvre. Rien à saisir à la main : tu parles, et LIFE OS range tout sur ces étagères.",
    g: {
      input: "Comment ajouter — sans effort",
      day: "Ta journée et ton journal",
      body: "Corps et santé",
      plans: "Plans, objectifs et tâches",
      know: "Savoir et mémoire",
      ai: "L'IA donne du sens à ta vie",
      people: "Gens, lieux, famille",
      data: "Tes données, ton contrôle",
    },
    in_voice: { icon: "ti-brand-telegram", name: "La voix dans Telegram", desc: "Parle au bot comme à un ami — en chemin, entre deux choses. L'IA transcrit et range tout." },
    in_text: { icon: "ti-edit", name: "Texte et entrées sur le site", desc: "Pas fan de la voix ? Écris en texte libre — dans l'app ou au bot." },
    in_photo: { icon: "ti-camera", name: "Photos et documents", desc: "Envoie une photo ou un scan — reçu, garantie, un moment. L'IA le comprend, en extrait les détails et le classe." },
    in_link: { icon: "ti-link", name: "Liens Instagram et YouTube", desc: "Envoie au bot un lien de post, reel ou vidéo — l'IA en tire l'essentiel et l'enregistre dans ta base de connaissances." },
    reminders: { icon: "ti-bell", name: "Rappels et matins", desc: "Un message du matin personnalisé et des rappels arrivent dans Telegram à l'heure qui te convient." },
    export: { icon: "ti-download", name: "Export vers Markdown et Obsidian", desc: "Télécharge tout en un clic. Ton livre de vie reste avec toi — même hors ligne et sans notre service." },
    privacy: { icon: "ti-shield-lock", name: "Une vraie confidentialité", desc: "Toi seul vois ton journal. Exporte ou supprime tout en un clic." },
    opensource: { icon: "ti-brand-github", name: "Code ouvert", desc: "Le projet est public — tu peux vérifier comment tout fonctionne à l'intérieur." },
  },
  es: {
    kicker: "Cómo usarlo",
    title: "Todo lo que LIFE OS puede hacer",
    sub: "Toca una sección — se despliega la lista de posibilidades. No hace falta registrar nada a mano: tú simplemente cuentas, y LIFE OS lo ordena todo en estos estantes.",
    g: {
      input: "Cómo añadir — sin esfuerzo",
      day: "Tu día y tu diario",
      body: "Cuerpo y salud",
      plans: "Planes, metas y tareas",
      know: "Conocimiento y memoria",
      ai: "La IA le da sentido a tu vida",
      people: "Personas, lugares, familia",
      data: "Tus datos, tu control",
    },
    in_voice: { icon: "ti-brand-telegram", name: "Voz en Telegram", desc: "Háblale al bot como a un amigo — de camino, entre tareas. La IA transcribe y lo organiza todo." },
    in_text: { icon: "ti-edit", name: "Texto y entradas en el sitio", desc: "¿No te gusta la voz? Escribe en texto libre — directo en la app o al bot." },
    in_photo: { icon: "ti-camera", name: "Fotos y documentos", desc: "Envía una foto o un escaneo — un recibo, una garantía, un momento. La IA entiende el sentido, extrae los datos y los clasifica." },
    in_link: { icon: "ti-link", name: "Enlaces de Instagram y YouTube", desc: "Envíale al bot un enlace de post, reel o video — la IA extrae lo esencial y lo guarda en tu base de conocimiento." },
    reminders: { icon: "ti-bell", name: "Recordatorios y mañanas", desc: "Un mensaje matutino personal y recordatorios llegan a Telegram a la hora que te convenga." },
    export: { icon: "ti-download", name: "Exportar a Markdown y Obsidian", desc: "Descarga todo en un clic. Tu libro de vida se queda contigo — incluso sin internet y sin nuestro servicio." },
    privacy: { icon: "ti-shield-lock", name: "Privacidad honesta", desc: "Solo tú ves tu diario. Exporta o elimina todo en un clic." },
    opensource: { icon: "ti-brand-github", name: "Código abierto", desc: "El proyecto es público — puedes comprobar cómo funciona todo por dentro." },
  },
};

export function capabilities(locale: Locale): Capabilities {
  const nav = getDict(locale).nav;
  const h = hints(locale);
  const t = TR[locale] || TR.ru;
  // Пункт-раздел: имя из навигации, описание из hints.
  const s = (key: string): Cap => ({ icon: ICON[key] || "ti-point", name: nav[key] || key, desc: h[key] || "" });

  const groups: CapGroup[] = [
    { icon: "ti-microphone", color: "var(--accent)", title: t.g.input, items: [t.in_voice, t.in_text, t.in_photo, t.in_link] },
    { icon: "ti-book", color: "var(--accent)", title: t.g.day, items: [s("today"), s("diary"), s("tasks"), t.reminders] },
    { icon: "ti-heartbeat", color: "#ef4444", title: t.g.body, items: [s("health"), s("energy"), s("sport"), s("food")] },
    { icon: "ti-target", color: "#3b82f6", title: t.g.plans, items: [s("goals"), s("projects"), s("finance")] },
    { icon: "ti-bookmarks", color: "#0ea5e9", title: t.g.know, items: [s("knowledge"), s("memory"), s("books"), s("wishlist")] },
    { icon: "ti-sparkles", color: "var(--insight)", title: t.g.ai, items: [s("analytics"), s("biographer"), s("lab"), s("lifebook"), s("insights"), s("intelligence")] },
    { icon: "ti-user-heart", color: "#ec4899", title: t.g.people, items: [s("people"), s("places"), s("family")] },
    { icon: "ti-shield-lock", color: "var(--positive)", title: t.g.data, items: [t.export, t.privacy, s("profile"), t.opensource] },
  ];

  return { kicker: t.kicker, title: t.title, sub: t.sub, groups };
}
