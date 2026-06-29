// Запасное утреннее сообщение — когда персонального (AI) ещё мало данных или
// нет ключа. Простая человеческая поддержка, без штампов и «роботизированных»
// фраз: пишем так, как написал бы живой человек. Ротация по дню года.

const MORNING: Record<string, string[]> = {
  ru: [
    "Доброе утро. Не пытайся успеть всё сразу — выбери одну важную вещь и начни с неё.",
    "Доброе утро. День будет таким, каким ты его сделаешь. Начни спокойно, без спешки.",
    "С добрым утром. Иногда лучшее начало — просто первый маленький шаг. Остальное подтянется.",
    "Доброе утро. Ты не обязан быть продуктивным каждую минуту. Выбери главное и займись им.",
    "Доброе утро. Если день кажется большим, разбей его на части и возьми первую.",
    "Доброе утро. Сегодня не про идеальность, а про то, чтобы просто двигаться. Шаг за шагом.",
    "С добрым утром. Выдохни, не торопись. Один хороший шаг сегодня важнее десяти суетливых.",
    "Доброе утро. Что бы ни было вчера, сегодня чистая страница. Начни с того, что важно тебе.",
  ],
  en: [
    "Good morning. Don't try to do it all at once — pick one important thing and start there.",
    "Good morning. The day will be what you make it. Start calm, no rush.",
    "Morning. Sometimes the best start is just the first small step. The rest follows.",
    "Good morning. You don't have to be productive every minute. Choose what matters and do that.",
    "Morning. If the day feels big, break it down and take the first piece.",
    "Good morning. Today isn't about perfect, it's about moving. Step by step.",
    "Morning. Breathe, don't rush. One good step today beats ten frantic ones.",
    "Good morning. Whatever yesterday was, today's a clean page. Start with what matters to you.",
  ],
  uk: [
    "Доброго ранку. Не намагайся встигнути все одразу — обери одну важливу річ і почни з неї.",
    "Доброго ранку. День буде таким, яким ти його зробиш. Починай спокійно, без поспіху.",
    "Ранок добрий. Іноді найкращий початок — просто перший маленький крок. Решта підтягнеться.",
    "Доброго ранку. Ти не зобов'язаний бути продуктивним щохвилини. Обери головне і займися ним.",
    "Доброго ранку. Якщо день здається великим, розбий його на частини і візьми першу.",
    "Доброго ранку. Сьогодні не про ідеальність, а про те, щоб просто рухатися. Крок за кроком.",
    "Доброго ранку. Видихни, не поспішай. Один добрий крок сьогодні важливіший за десять метушливих.",
    "Доброго ранку. Що б не було вчора, сьогодні чиста сторінка. Почни з того, що важливо тобі.",
  ],
  fr: [
    "Bonjour. N'essaie pas de tout faire d'un coup — choisis une chose importante et commence par là.",
    "Bonjour. La journée sera ce que tu en fais. Commence calmement, sans précipitation.",
    "Bonjour. Parfois le meilleur départ, c'est juste le premier petit pas. Le reste suit.",
    "Bonjour. Tu n'as pas à être productif chaque minute. Choisis l'essentiel et fais-le.",
    "Bonjour. Si la journée paraît grande, découpe-la et prends le premier morceau.",
    "Bonjour. Aujourd'hui, ce n'est pas la perfection, c'est avancer. Pas à pas.",
    "Bonjour. Respire, ne te presse pas. Un bon pas aujourd'hui vaut mieux que dix pressés.",
    "Bonjour. Quoi qu'il en soit d'hier, aujourd'hui est une page blanche. Commence par ce qui compte pour toi.",
  ],
};

export function morningMessage(locale: string, seed: number): string {
  const pool = MORNING[locale] || MORNING.ru;
  return pool[Math.abs(seed) % pool.length];
}
