// Короткий вопрос в конце утреннего/вечернего пуша — чтобы человек сразу ответил
// (ответ уходит боту как обычная реплика). Ротация по дню (seed), 4 языка.

type Lang = "ru" | "en" | "uk" | "fr";

const MORNING: Record<Lang, string[]> = {
  ru: [
    "Кстати, как спалось? 😴",
    "Как самочувствие с утра?",
    "С каким настроением начинаешь день?",
    "Что сегодня для тебя самое важное?",
  ],
  en: [
    "By the way, how did you sleep? 😴",
    "How are you feeling this morning?",
    "What mood are you starting the day in?",
    "What's the most important thing for you today?",
  ],
  uk: [
    "До речі, як спалося? 😴",
    "Як самопочуття зранку?",
    "З яким настроєм починаєш день?",
    "Що сьогодні для тебе найважливіше?",
  ],
  fr: [
    "Au fait, tu as bien dormi ? 😴",
    "Comment te sens-tu ce matin ?",
    "Dans quelle humeur commences-tu la journée ?",
    "Quelle est la chose la plus importante pour toi aujourd'hui ?",
  ],
};

const EVENING: Record<Lang, string[]> = {
  ru: [
    "Кстати, как настроение сейчас? 🙂",
    "Что сегодня порадовало?",
    "Что было лучшим за день?",
    "Как ты сейчас — на энергии или устал(а)?",
  ],
  en: [
    "By the way, how's your mood right now? 🙂",
    "What made you happy today?",
    "What was the best part of the day?",
    "How are you now — energized or tired?",
  ],
  uk: [
    "До речі, який зараз настрій? 🙂",
    "Що сьогодні порадувало?",
    "Що було найкращим за день?",
    "Як ти зараз — на енергії чи втомився(лася)?",
  ],
  fr: [
    "Au fait, quelle est ton humeur là ? 🙂",
    "Qu'est-ce qui t'a fait plaisir aujourd'hui ?",
    "Quel a été le meilleur moment de la journée ?",
    "Comment tu te sens là — en forme ou fatigué(e) ?",
  ],
};

function pick(list: string[], seed: number): string {
  const i = ((Math.floor(seed) % list.length) + list.length) % list.length;
  return list[i];
}

export function morningQuestion(lang: string, seed: number): string {
  return pick(MORNING[(lang as Lang)] || MORNING.ru, seed);
}

export function eveningQuestion(lang: string, seed: number): string {
  return pick(EVENING[(lang as Lang)] || EVENING.ru, seed);
}
