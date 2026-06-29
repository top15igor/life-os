import { supabaseAdmin } from "./supabaseAdmin";

// «Вопрос для книги»: тёплый наводящий вопрос, нацеленный на самую «тонкую»
// главу книги — чтобы пользователь рассказывал больше про недозаполненные темы
// и тем самым наполнял свою книгу года. Источник вопросов — готовый банк по
// темам (без расхода AI). Тема выбирается по реальным данным (категории записей).

export const THEMES = ["family", "health", "work", "travel", "growth", "gratitude", "emotions"] as const;
export type Theme = (typeof THEMES)[number];

// Какие категории записей «питают» каждую тему (совпадает со слугами категорий).
const THEME_CATS: Record<Theme, string[]> = {
  family: ["family", "relationship"],
  health: ["health", "sport", "food"],
  work: ["business", "finance"],
  travel: ["travel"],
  growth: ["insight", "ideas"],
  gratitude: ["gratitude"],
  emotions: ["emotions"],
};

const TITLES: Record<string, Record<Theme, string>> = {
  ru: { family: "Семья", health: "Здоровье", work: "Работа и дело", travel: "Путешествия", growth: "О себе", gratitude: "Благодарность", emotions: "Чувства" },
  en: { family: "Family", health: "Health", work: "Work", travel: "Travel", growth: "About you", gratitude: "Gratitude", emotions: "Feelings" },
  uk: { family: "Сім'я", health: "Здоров'я", work: "Робота", travel: "Подорожі", growth: "Про себе", gratitude: "Вдячність", emotions: "Почуття" },
  fr: { family: "Famille", health: "Santé", work: "Travail", travel: "Voyages", growth: "Sur toi", gratitude: "Gratitude", emotions: "Émotions" },
};

const QUESTIONS: Record<string, Record<Theme, string[]>> = {
  ru: {
    family: [
      "Расскажи о близком человеке, который был рядом в этом году. Чем он тебе дорог?",
      "Какой тёплый момент с семьёй ты хочешь сохранить навсегда?",
      "О ком из родных ты в последнее время думаешь? Что хочется им сказать?",
      "Какая семейная мелочь или традиция делает твой дом домом?",
    ],
    health: [
      "Как ты себя чувствуешь в последнее время — телом и силами?",
      "Что хорошего ты сделал для своего здоровья на этой неделе?",
      "Какая привычка тебе помогает, а какая мешает?",
      "Если бы тело могло сказать тебе спасибо или о чём-то попросить — что бы это было?",
    ],
    work: [
      "Над чем ты сейчас работаешь, что для тебя по-настоящему важно?",
      "Какой маленький шаг в делах сегодня стоит записать как победу?",
      "Что в работе вдохновляет, а что забирает силы?",
      "О какой цели или проекте ты мечтаешь, но всё откладываешь?",
    ],
    travel: [
      "Какое место в этом году запомнилось тебе больше всего?",
      "Куда ты давно хочешь поехать — и почему именно туда?",
      "Расскажи про дорогу или прогулку, которая осталась в памяти.",
      "Какое место рядом с домом ты любишь — и за что?",
    ],
    growth: [
      "Что важного ты понял о себе за последнее время?",
      "Какая мысль или идея не отпускает тебя в эти дни?",
      "Чему тебя научила недавняя трудность?",
      "Что бы ты сказал себе год назад, зная то, что знаешь сейчас?",
    ],
    gratitude: [
      "За что ты сегодня благодарен — пусть даже за мелочь?",
      "Кому хочется сказать спасибо, но ты всё откладываешь?",
      "Какое доброе дело ты сделал недавно — или кто-то сделал для тебя?",
      "Что хорошего случилось за неделю, что легко забыть, но жаль терять?",
    ],
    emotions: [
      "Что ты чувствуешь прямо сейчас — честно, без прикрас?",
      "Какой момент за день тронул тебя больше всего?",
      "Что в последнее время радует, а что тревожит?",
      "Если бы твоё настроение этой недели было погодой — какой?",
    ],
  },
  en: {
    family: [
      "Tell me about someone close who was there for you this year. Why do they matter?",
      "What warm moment with your family do you want to keep forever?",
      "Who in your family have you been thinking about? What would you tell them?",
      "What small family ritual makes your home feel like home?",
    ],
    health: [
      "How have you been feeling lately — in body and energy?",
      "What good thing did you do for your health this week?",
      "Which habit helps you, and which one holds you back?",
      "If your body could thank you or ask you for something — what would it be?",
    ],
    work: [
      "What are you working on that truly matters to you?",
      "What small step today is worth writing down as a win?",
      "What in your work inspires you, and what drains you?",
      "What goal or project do you dream of but keep putting off?",
    ],
    travel: [
      "Which place stayed with you most this year?",
      "Where have you long wanted to go — and why there?",
      "Tell me about a walk or a journey you still remember.",
      "What place near home do you love — and what for?",
    ],
    growth: [
      "What important thing have you understood about yourself lately?",
      "What thought or idea won't let you go these days?",
      "What did a recent difficulty teach you?",
      "What would you tell yourself a year ago, knowing what you know now?",
    ],
    gratitude: [
      "What are you grateful for today — even a small thing?",
      "Who do you want to thank but keep putting it off?",
      "What kind thing did you do recently — or someone did for you?",
      "What good happened this week that's easy to forget but worth keeping?",
    ],
    emotions: [
      "What do you feel right now — honestly, no filter?",
      "Which moment today touched you most?",
      "What's been making you glad lately, and what's been weighing on you?",
      "If this week's mood were weather, what would it be?",
    ],
  },
  uk: {
    family: [
      "Розкажи про близьку людину, яка була поруч цього року. Чим вона тобі дорога?",
      "Який теплий момент із сім'єю ти хочеш зберегти назавжди?",
      "Про кого з рідних ти думаєш останнім часом? Що хочеться їм сказати?",
      "Яка сімейна дрібниця чи традиція робить твій дім домом?",
    ],
    health: [
      "Як ти почуваєшся останнім часом — тілом і силами?",
      "Що доброго ти зробив для свого здоров'я цього тижня?",
      "Яка звичка тобі допомагає, а яка заважає?",
      "Якби тіло могло подякувати тобі чи про щось попросити — що б це було?",
    ],
    work: [
      "Над чим ти зараз працюєш, що для тебе по-справжньому важливе?",
      "Який маленький крок у справах сьогодні варто записати як перемогу?",
      "Що в роботі надихає, а що забирає сили?",
      "Про яку ціль чи проєкт ти мрієш, але все відкладаєш?",
    ],
    travel: [
      "Яке місце цього року запам'яталося тобі найбільше?",
      "Куди ти давно хочеш поїхати — і чому саме туди?",
      "Розкажи про дорогу чи прогулянку, яка лишилася в пам'яті.",
      "Яке місце поруч із домом ти любиш — і за що?",
    ],
    growth: [
      "Що важливого ти зрозумів про себе останнім часом?",
      "Яка думка чи ідея не відпускає тебе ці дні?",
      "Чого тебе навчила нещодавня труднощ?",
      "Що б ти сказав собі рік тому, знаючи те, що знаєш зараз?",
    ],
    gratitude: [
      "За що ти сьогодні вдячний — нехай навіть за дрібницю?",
      "Кому хочеться сказати дякую, але ти все відкладаєш?",
      "Яку добру справу ти зробив нещодавно — чи хтось зробив для тебе?",
      "Що доброго сталося за тиждень, що легко забути, але шкода втрачати?",
    ],
    emotions: [
      "Що ти відчуваєш просто зараз — чесно, без прикрас?",
      "Який момент за день зворушив тебе найбільше?",
      "Що останнім часом радує, а що тривожить?",
      "Якби твій настрій цього тижня був погодою — якою?",
    ],
  },
  fr: {
    family: [
      "Parle-moi d'un proche qui a été là pour toi cette année. Pourquoi compte-t-il ?",
      "Quel moment tendre en famille veux-tu garder pour toujours ?",
      "À qui dans ta famille penses-tu ces temps-ci ? Que voudrais-tu lui dire ?",
      "Quel petit rituel familial fait que ta maison est un vrai foyer ?",
    ],
    health: [
      "Comment te sens-tu ces derniers temps — corps et énergie ?",
      "Qu'as-tu fait de bien pour ta santé cette semaine ?",
      "Quelle habitude t'aide, et laquelle te freine ?",
      "Si ton corps pouvait te remercier ou te demander quelque chose — quoi ?",
    ],
    work: [
      "Sur quoi travailles-tu qui compte vraiment pour toi ?",
      "Quel petit pas aujourd'hui mérite d'être noté comme une victoire ?",
      "Qu'est-ce qui t'inspire dans ton travail, et qu'est-ce qui t'épuise ?",
      "Quel objectif ou projet rêves-tu de faire mais repousses sans cesse ?",
    ],
    travel: [
      "Quel lieu t'a le plus marqué cette année ?",
      "Où rêves-tu d'aller depuis longtemps — et pourquoi là ?",
      "Parle-moi d'une promenade ou d'un voyage dont tu te souviens encore.",
      "Quel endroit près de chez toi aimes-tu — et pour quoi ?",
    ],
    growth: [
      "Qu'as-tu compris d'important sur toi ces derniers temps ?",
      "Quelle pensée ou idée ne te lâche pas ces jours-ci ?",
      "Que t'a appris une difficulté récente ?",
      "Que dirais-tu à toi-même il y a un an, avec ce que tu sais aujourd'hui ?",
    ],
    gratitude: [
      "De quoi es-tu reconnaissant aujourd'hui — même une petite chose ?",
      "À qui veux-tu dire merci mais tu repousses toujours ?",
      "Quelle bonne action as-tu faite récemment — ou quelqu'un pour toi ?",
      "Quel bon moment de la semaine est facile à oublier mais précieux à garder ?",
    ],
    emotions: [
      "Que ressens-tu là, maintenant — honnêtement, sans filtre ?",
      "Quel moment de la journée t'a le plus touché ?",
      "Qu'est-ce qui te réjouit ces temps-ci, et qu'est-ce qui te pèse ?",
      "Si l'humeur de ta semaine était une météo, laquelle serait-ce ?",
    ],
  },
};

function loc(locale?: string): string {
  return locale && QUESTIONS[locale] ? locale : "ru";
}

// Лёгкий выбор вопроса: один запрос по категориям записей года → самая тонкая
// тема → вопрос из банка (ротация по seed = дню года). Работает и для новых
// пользователей (нет записей → все темы по нулям → ротация по дням).
export async function getBookPrompt(
  userId: string,
  locale: string,
  seed: number,
  opts?: { themes?: Theme[]; customPrompts?: string[] }
): Promise<{ theme: Theme; title: string; question: string } | null> {
  const l = loc(locale);
  const year = new Date().getFullYear();
  const counts: Record<string, number> = {};
  try {
    const { data } = await supabaseAdmin()
      .from("entries")
      .select("entry_categories(categories(slug))")
      .eq("user_id", userId)
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`);
    for (const e of data || [])
      for (const ec of (e as any).entry_categories || []) {
        const s = ec.categories?.slug;
        if (s) counts[s] = (counts[s] || 0) + 1;
      }
  } catch {
    // нет данных — ротация по дням ниже
  }

  // Если пользователь выбрал темы в профиле — берём вопросы только из них.
  const allowed = (opts?.themes && opts.themes.length) ? THEMES.filter((t) => opts.themes!.includes(t)) : THEMES;
  const totals = allowed.map((t) => ({ t, n: THEME_CATS[t].reduce((a, s) => a + (counts[s] || 0), 0) }));
  const min = Math.min(...totals.map((x) => x.n));
  const thin = totals.filter((x) => x.n === min).map((x) => x.t);
  const theme = thin[Math.abs(seed) % thin.length];

  // Свои подсказки пользователя подмешиваем в пул выбранной темы.
  const custom = (opts?.customPrompts || []).filter(Boolean);
  const candidates = [...QUESTIONS[l][theme], ...custom];
  const question = candidates[Math.abs(seed) % candidates.length];
  return { theme, title: TITLES[l][theme], question };
}

// Текст вопроса-пуша для Telegram-бота.
export function bookPromptMessage(locale: string, question: string): string {
  const l = loc(locale);
  const wrap: Record<string, [string, string]> = {
    ru: ["📖 Вопрос для книги", "Ответь — хоть голосом — и это станет страницей твоей жизни."],
    en: ["📖 A question for your book", "Answer — even by voice — and it becomes a page of your life."],
    uk: ["📖 Питання для книги", "Відповідай — хоч голосом — і це стане сторінкою твого життя."],
    fr: ["📖 Une question pour ton livre", "Réponds — même à la voix — et ça devient une page de ta vie."],
  };
  const [head, foot] = wrap[l];
  return `${head}\n\n${question}\n\n${foot}`;
}
