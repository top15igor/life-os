// Короткий вопрос в конце утреннего/вечернего пуша — чтобы человек сразу ответил
// (ответ уходит боту как обычная реплика). Ротация по дню (seed), 4 языка.

type Lang = "ru" | "en" | "uk" | "fr";

const MORNING: Record<Lang, string[]> = {
  ru: [
    "Кстати, как спалось? 😴",
    "Как самочувствие с утра?",
    "С каким настроением начинаешь день?",
    "Что сегодня для тебя самое важное?",
    "Что тебе сегодня в радость?",
    "Как тело — бодрое или ещё просыпается?",
    "За что скажешь спасибо этому утру?",
  ],
  en: [
    "By the way, how did you sleep? 😴",
    "How are you feeling this morning?",
    "What mood are you starting the day in?",
    "What's the most important thing for you today?",
    "What are you looking forward to today?",
    "How's your body — fresh or still waking up?",
    "What are you grateful for this morning?",
  ],
  uk: [
    "До речі, як спалося? 😴",
    "Як самопочуття зранку?",
    "З яким настроєм починаєш день?",
    "Що сьогодні для тебе найважливіше?",
    "Що тебе сьогодні тішить?",
    "Як тіло — бадьоре чи ще прокидається?",
    "За що подякуєш цьому ранку?",
  ],
  fr: [
    "Au fait, tu as bien dormi ? 😴",
    "Comment te sens-tu ce matin ?",
    "Dans quelle humeur commences-tu la journée ?",
    "Quelle est la chose la plus importante pour toi aujourd'hui ?",
    "Qu'est-ce qui te réjouit aujourd'hui ?",
    "Comment est ton corps — en forme ou encore endormi ?",
    "De quoi es-tu reconnaissant ce matin ?",
  ],
};

const EVENING: Record<Lang, string[]> = {
  ru: [
    "Кстати, как настроение сейчас? 🙂",
    "Что сегодня порадовало?",
    "Что было лучшим за день?",
    "Как ты сейчас — на энергии или устал(а)?",
    "Что нового узнал(а) за день?",
    "За что сегодня благодарен(на)?",
    "Что бы сделал(а) сегодня иначе?",
  ],
  en: [
    "By the way, how's your mood right now? 🙂",
    "What made you happy today?",
    "What was the best part of the day?",
    "How are you now — energized or tired?",
    "What did you learn today?",
    "What are you grateful for today?",
    "What would you do differently today?",
  ],
  uk: [
    "До речі, який зараз настрій? 🙂",
    "Що сьогодні порадувало?",
    "Що було найкращим за день?",
    "Як ти зараз — на енергії чи втомився(лася)?",
    "Що нового дізнався(лася) за день?",
    "За що сьогодні вдячний(на)?",
    "Що зробив(ла) б сьогодні інакше?",
  ],
  fr: [
    "Au fait, quelle est ton humeur là ? 🙂",
    "Qu'est-ce qui t'a fait plaisir aujourd'hui ?",
    "Quel a été le meilleur moment de la journée ?",
    "Comment tu te sens là — en forme ou fatigué(e) ?",
    "Qu'as-tu appris aujourd'hui ?",
    "De quoi es-tu reconnaissant aujourd'hui ?",
    "Qu'aurais-tu fait autrement aujourd'hui ?",
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
