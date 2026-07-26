// Питч-приглашение друга: текст, который уходит другу при «🎁 Позвать друга».
// Вынесен из вебхука бота, чтобы переиспользовать в мини-аппе быстрого
// шэринга (/invite-share): кнопка меню сразу открывает окно «кому отправить».
export const INVITE: Record<string, { text: string; share: string }> = {
  ru: { text: "📖 Представь, что через 10 лет ты сможешь открыть любой день своей жизни.\nВспомнить, о чём мечтал, какие идеи приходили, какие решения изменили всё и что делало тебя счастливым.\n\nLIFE OS помогает создать такую «Книгу жизни». Просто записывай мысли голосом, а AI сам сохранит их, найдёт связи и превратит разрозненные дни в историю твоей жизни.\n\nПопробуй 👉 {bot}", share: "📤 Поделиться" },
  en: { text: "📖 Imagine that in 10 years you could open any day of your life.\nRemember what you dreamed of, what ideas came to you, which decisions changed everything and what made you happy.\n\nLIFE OS helps you create such a “Book of Life”. Just record your thoughts by voice, and AI saves them, finds the connections and turns scattered days into the story of your life.\n\nTry it 👉 {bot}", share: "📤 Share" },
  uk: { text: "📖 Уяви, що через 10 років ти зможеш відкрити будь-який день свого життя.\nПригадати, про що мріяв, які ідеї приходили, які рішення змінили все і що робило тебе щасливим.\n\nLIFE OS допомагає створити таку «Книгу життя». Просто записуй думки голосом, а AI сам збереже їх, знайде зв'язки й перетворить розрізнені дні на історію твого життя.\n\nСпробуй 👉 {bot}", share: "📤 Поділитися" },
  fr: { text: "📖 Imagine que dans 10 ans tu puisses ouvrir n'importe quel jour de ta vie.\nTe souvenir de tes rêves, des idées qui te venaient, des décisions qui ont tout changé et de ce qui te rendait heureux.\n\nLIFE OS t'aide à créer un tel « Livre de vie ». Enregistre simplement tes pensées à la voix, et l'IA les sauvegarde, trouve les liens et transforme des jours épars en l'histoire de ta vie.\n\nEssaie 👉 {bot}", share: "📤 Partager" },
  es: { text: "📖 Imagina que dentro de 10 años pudieras abrir cualquier día de tu vida.\nRecordar con qué soñabas, qué ideas se te ocurrían, qué decisiones lo cambiaron todo y qué te hacía feliz.\n\nLIFE OS te ayuda a crear ese «Libro de la vida». Simplemente graba tus pensamientos por voz, y la IA los guarda, encuentra las conexiones y convierte días dispersos en la historia de tu vida.\n\nPruébalo 👉 {bot}", share: "📤 Compartir" },
};

// Готовая ссылка t.me/share: текст питча (без {bot}) + личная ссылка-приглашение /i/<handle>.
export function inviteShareUrl(origin: string, handle: string, lang: string): string {
  const I = INVITE[lang] || INVITE.ru;
  const inviteLink = `${origin}/i/${handle}`;
  return `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(I.text.replace("{bot}", "").trim())}`;
}
