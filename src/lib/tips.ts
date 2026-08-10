import type { Locale } from "./i18n";

// Подсказки для правой колонки на «Сегодня». Показываются только на широких
// экранах, где справа всё равно пустое место (см. .tips-rail в globals.css).
//
// Правило для содержимого: каждая подсказка — про то, что РЕАЛЬНО умеет продукт,
// с живой фразой, которую можно прямо повторить боту. Никакой рекламы.

export type Tip = { icon: string; title: string; text: string; href?: string };

const T: Record<Locale, Tip[]> = {
  ru: [
    { icon: "ti-alarm", title: "Напоминания словами", text: "«Напомни завтра в 9 позвонить маме» — придёт точно в срок, с кнопками «Готово» и «Через час».", href: "/reminders" },
    { icon: "ti-note", title: "Справка под рукой", text: "«Запиши код от домофона 4582». Потом просто спроси — бот ответит за секунду.", href: "/notes" },
    { icon: "ti-camera", title: "Фото документов", text: "Пришли боту чек, гарантию или договор — AI прочитает и разложит в Память.", href: "/memory" },
    { icon: "ti-link", title: "Ссылки из соцсетей", text: "Кинь ссылку из Instagram, YouTube, TikTok или Facebook — суть сохранится в Базу знаний.", href: "/knowledge" },
    { icon: "ti-clock-hour-4", title: "План дня одним вопросом", text: "Спроси бота «что у меня сегодня?» — покажет напоминания и задачи с датой.", href: "/tasks" },
    { icon: "ti-microphone", title: "Голосом на ходу", text: "Наговори боту по дороге — расшифрует и разложит сам. Даже длинное, на восемь минут.", href: "/diary" },
    { icon: "ti-hourglass", title: "Письмо в будущее", text: "Капсула времени: письмо себе или детям, доставим ровно в назначенный день.", href: "/lifebook" },
    { icon: "ti-book-2", title: "Книга жизни", text: "Записи сами складываются в главы. В конце года книгу можно напечатать и подарить.", href: "/lifebook" },
  ],
  en: [
    { icon: "ti-alarm", title: "Reminders in plain words", text: "“Remind me tomorrow at 9 to call mum” — arrives on time, with “Done” and “In an hour”.", href: "/reminders" },
    { icon: "ti-note", title: "Facts at hand", text: "“Save the door code 4582”. Later just ask — the bot answers in a second.", href: "/notes" },
    { icon: "ti-camera", title: "Photos of documents", text: "Send a receipt, warranty or contract — AI reads it and files it into Memory.", href: "/memory" },
    { icon: "ti-link", title: "Links from social", text: "Send an Instagram, YouTube, TikTok or Facebook link — the gist lands in your Knowledge Base.", href: "/knowledge" },
    { icon: "ti-clock-hour-4", title: "Your day in one question", text: "Ask the bot “what's on today?” — reminders and dated tasks in one list.", href: "/tasks" },
    { icon: "ti-microphone", title: "Voice on the go", text: "Talk to the bot on your way home — it transcribes and sorts it out. Even eight-minute notes.", href: "/diary" },
    { icon: "ti-hourglass", title: "A letter to the future", text: "Time capsule: a letter to yourself or your kids, delivered on the exact day.", href: "/lifebook" },
    { icon: "ti-book-2", title: "Book of life", text: "Entries turn into chapters on their own. At year's end you can print it as a gift.", href: "/lifebook" },
  ],
  uk: [
    { icon: "ti-alarm", title: "Нагадування словами", text: "«Нагадай завтра о 9 подзвонити мамі» — прийде вчасно, з кнопками «Готово» і «Через годину».", href: "/reminders" },
    { icon: "ti-note", title: "Довідка під рукою", text: "«Запиши код від домофона 4582». Потім просто спитай — бот відповість за секунду.", href: "/notes" },
    { icon: "ti-camera", title: "Фото документів", text: "Надішли боту чек, гарантію чи договір — AI прочитає і розкладе в Пам'ять.", href: "/memory" },
    { icon: "ti-link", title: "Посилання із соцмереж", text: "Кинь посилання з Instagram, YouTube, TikTok чи Facebook — суть збережеться в Базу знань.", href: "/knowledge" },
    { icon: "ti-clock-hour-4", title: "План дня одним питанням", text: "Спитай бота «що в мене сьогодні?» — покаже нагадування й задачі з датою.", href: "/tasks" },
    { icon: "ti-microphone", title: "Голосом дорогою", text: "Наговори боту в дорозі — розшифрує й розкладе сам. Навіть довге, на вісім хвилин.", href: "/diary" },
    { icon: "ti-hourglass", title: "Лист у майбутнє", text: "Капсула часу: лист собі або дітям, доставимо рівно в призначений день.", href: "/lifebook" },
    { icon: "ti-book-2", title: "Книга життя", text: "Записи самі складаються в розділи. Наприкінці року книгу можна надрукувати.", href: "/lifebook" },
  ],
  fr: [
    { icon: "ti-alarm", title: "Rappels en langage normal", text: "« Rappelle-moi demain à 9h d'appeler maman » — pile à l'heure, avec « Fait » et « Dans une heure ».", href: "/reminders" },
    { icon: "ti-note", title: "Les infos sous la main", text: "« Note le code de la porte 4582 ». Ensuite demande — le bot répond en une seconde.", href: "/notes" },
    { icon: "ti-camera", title: "Photos de documents", text: "Envoie un reçu, une garantie ou un contrat — l'IA le lit et le range dans Mémoire.", href: "/memory" },
    { icon: "ti-link", title: "Liens des réseaux", text: "Envoie un lien Instagram, YouTube, TikTok ou Facebook — l'essentiel va dans ta Base de connaissances.", href: "/knowledge" },
    { icon: "ti-clock-hour-4", title: "Ta journée en une question", text: "Demande au bot « qu'est-ce que j'ai aujourd'hui ? » — rappels et tâches datées.", href: "/tasks" },
    { icon: "ti-microphone", title: "À la voix, en chemin", text: "Parle au bot sur la route — il transcrit et range tout seul. Même huit minutes.", href: "/diary" },
    { icon: "ti-hourglass", title: "Une lettre au futur", text: "Capsule temporelle : une lettre à toi ou à tes enfants, livrée le jour dit.", href: "/lifebook" },
    { icon: "ti-book-2", title: "Livre de vie", text: "Les entrées deviennent des chapitres toutes seules. En fin d'année, imprime-le.", href: "/lifebook" },
  ],
  es: [
    { icon: "ti-alarm", title: "Recordatorios hablando normal", text: "«Recuérdame mañana a las 9 llamar a mamá» — llega puntual, con «Hecho» y «En una hora».", href: "/reminders" },
    { icon: "ti-note", title: "Datos a mano", text: "«Apunta el código del portal 4582». Luego pregunta — el bot responde en un segundo.", href: "/notes" },
    { icon: "ti-camera", title: "Fotos de documentos", text: "Envía un recibo, garantía o contrato — la IA lo lee y lo archiva en Memoria.", href: "/memory" },
    { icon: "ti-link", title: "Enlaces de redes", text: "Manda un enlace de Instagram, YouTube, TikTok o Facebook — lo esencial va a tu Base de conocimiento.", href: "/knowledge" },
    { icon: "ti-clock-hour-4", title: "Tu día en una pregunta", text: "Pregunta al bot «¿qué tengo hoy?» — recordatorios y tareas con fecha.", href: "/tasks" },
    { icon: "ti-microphone", title: "Con la voz, de camino", text: "Háblale al bot de camino a casa — transcribe y ordena solo. Incluso ocho minutos.", href: "/diary" },
    { icon: "ti-hourglass", title: "Una carta al futuro", text: "Cápsula del tiempo: una carta para ti o tus hijos, entregada el día exacto.", href: "/lifebook" },
    { icon: "ti-book-2", title: "Libro de vida", text: "Las entradas se agrupan en capítulos solas. A fin de año puedes imprimirlo.", href: "/lifebook" },
  ],
};

/**
 * Подсказки на сегодня. Набор меняется каждый день, но в пределах дня
 * одинаков — иначе сервер и браузер отрисовали бы разное.
 *
 * Если известен раздел, подсказки про него идут первыми: на «Заметках»
 * логично сначала прочитать про заметки, а не про капсулу времени.
 */
export function tipsOfDay(locale: Locale, count = 3, section?: string): Tip[] {
  const all = T[locale] || T.ru;
  const dayNumber = Math.floor(Date.now() / 86400000);
  const start = dayNumber % all.length;
  const rotated = Array.from({ length: all.length }, (_, i) => all[(start + i) % all.length]);
  const here = section ? `/${section}` : null;
  const ordered = here
    ? [...rotated.filter((t) => t.href === here), ...rotated.filter((t) => t.href !== here)]
    : rotated;
  return ordered.slice(0, Math.min(count, all.length));
}
