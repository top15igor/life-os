import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { analyze } from "./ai";
import { saveEntry } from "./saveEntry";
import { getChatVoice, voiceLine } from "./chatVoice";
import { normalizeMorningPrefs } from "./morningPrefs";

// «Давай познакомимся»: тёплый онбординг-диалог, снимающий страх чистого листа.
// Хитрость: человек не «ведёт дневник» — он просто отвечает другу на вопросы, а
// после нескольких ответов бот собирает их в КРАСИВУЮ ПЕРВУЮ ЗАПИСЬ и показывает:
// «ты уже её написал, просто разговаривая со мной». Барьер снят, привычка стартовала.
// Приёмы: бот раскрывается первым (взаимность) — но делится не «характером», а
// РЕАЛЬНОЙ ПОЛЬЗОЙ (фишки, выгоды, зачем это тебе); лестница глубины (факты → вкусы →
// чувства); активное слушание (цепляется за деталь); незавершённость (сессия ~4
// вопроса → «завтра продолжим»). Состояние — в morning_prefs.

const STEP = 1;              // 1 ответ = +1% (по просьбе: «1 вопрос — 1 процент»)
const REVEAL_PCT = 5;        // после ~5 ответов один раз показываем «первую страницу» (без паузы)
const ACQ_CAP = 99;          // потолок: знакомство НЕ заканчивается, 100% не бывает — всегда есть куда расти
const DEEP_PCT = 90;         // тёплая «глубокая» отметка (однократно), но без финала
const SAVE_MIN = 15;         // ответ короче — не заводим отдельную запись (чипы «сова»/«кофе» и т.п.)

// Пользы/фишки LIFE OS — бот делится по одной перед своим вопросом (взаимность),
// показывая КОНКРЕТНУЮ ВЫГОДУ для человека: зачем ему всё это. Модель берёт
// неиспользованную и передаёт смысл на языке пользователя, не дословно.
const VALUE_POINTS = [
  "писать ничего не обязательно — можно просто наговорить голосом, а я сам расшифрую и разложу по полочкам",
  "со временем я замечаю закономерности: после чего у тебя поднимается настроение, а что его гасит",
  "из твоих дней я собираю настоящую книгу жизни — по главам и годам, её приятно перечитывать",
  "по утрам подкидываю один тёплый вопрос — чтобы было легче начать день с мысли о себе, а не с ленты новостей",
  "я помню всё, что ты рассказывал, и иногда показываю «в этот день год назад» — видно, как ты растёшь",
  "здесь можно ставить цели и привычки — я тихо слежу за прогрессом и подсвечиваю, когда серия не рвётся",
  "если просто нужно выговориться — я рядом как друг: можно поговорить, а не только вести дневник",
  "я напомню о важном и буду держать твои обещания на виду, чтобы они не терялись в суете",
  "всё зашифровано и приватно — это твоё личное пространство, где можно быть настоящим без осуждения",
];

// Лестница тем: факты → вкусы → чувства. Модель формулирует конкретный вопрос на
// языке пользователя, по одной новой теме за ход, цепляясь за детали его ответов.
const Q_THEMES = [
  "как зовут и как называют близкие",
  "сова или жаворонок, как обычно проходит утро",
  "что сегодня заставило улыбнуться",
  "чем занимается, чему посвящает дни",
  "что заряжает и даёт энергию",
  "кто самые близкие рядом",
  "каким был бы идеальный выходной",
  "за что его чаще всего благодарят",
  "о чём в последнее время думает чаще всего",
  "что из этого года хочет запомнить",
  "о чём мечтает, но пока откладывает",
  "что бы сделал, если бы совсем не боялся",
];

const OPENING_FIRST: Record<string, string> = {
  ru: `Привет 🙂 Давай знакомиться — сначала пара слов о том, чем я полезен, а потом расскажешь о себе.

Я — LIFE OS, твой личный дневник с искусственным интеллектом. Ты просто рассказываешь, как прошёл день — словами или голосом, — а я превращаю это в структуру: замечаю настроение и энергию, вижу, что тебя заряжает, а что гасит, и со временем собираю твои дни в настоящую книгу жизни по главам и годам. По утрам подкину тёплый вопрос, напомню о важном и покажу «в этот день год назад». Ничего не нужно заполнять по полочкам — просто говори, остальное я сделаю сам.

И сразу самое важное, чтобы тебе было спокойно: всё, что ты мне расскажешь, останется только между нами. Твой дневник видишь лишь ты — его не читают ни другие люди, ни моя команда, а для статистики видны только обезличенные цифры, без текста. Данные хранятся зашифрованно, и ты в любой момент можешь всё скачать или удалить без следа. Здесь можно быть собой — без масок и без осуждения.

Чтобы я стал полезнее именно тебе, давай познакомимся. Начнём с простого: как тебя зовут — и как тебя называют те, кто любит?`,
  en: `Hi 🙂 Let's get acquainted — first a couple of words on how I'm useful, then you'll tell me about you.

I'm LIFE OS, your personal AI diary. You just tell me how your day went — by text or voice — and I turn it into structure: I notice your mood and energy, I see what charges you and what drains you, and over time I gather your days into a real book of your life, by chapters and years. In the mornings I'll toss you a warm question, remind you of what matters, and show you "on this day a year ago." Nothing to fill in box by box — just talk, I'll handle the rest.

And the most important thing right away, so you feel at ease: everything you tell me stays between us. Only you can see your diary — not other people, not my team; for statistics we only see anonymized numbers, no text. Data is stored encrypted, and you can download or delete everything anytime, without a trace. Here you can be yourself — no masks, no judgment.

So I can be more useful to you specifically, let's get to know each other. Let's start simple: what's your name — and what do the people who love you call you?`,
  uk: `Привіт 🙂 Давай знайомитися — спершу пару слів про те, чим я корисний, а потім розкажеш про себе.

Я — LIFE OS, твій особистий щоденник зі штучним інтелектом. Ти просто розповідаєш, як минув день — словами або голосом, — а я перетворюю це на структуру: помічаю настрій та енергію, бачу, що тебе заряджає, а що гасить, і згодом збираю твої дні в справжню книгу життя за розділами та роками. Зранку підкину тепле питання, нагадаю про важливе й покажу «цього дня рік тому». Нічого не треба заповнювати по поличках — просто говори, решту я зроблю сам.

І одразу найважливіше, щоб тобі було спокійно: усе, що ти мені розкажеш, залишиться тільки між нами. Твій щоденник бачиш лише ти — його не читають ні інші люди, ні моя команда, а для статистики видно лише знеособлені цифри, без тексту. Дані зберігаються зашифровано, і ти будь-коли можеш усе завантажити або видалити без сліду. Тут можна бути собою — без масок і без осуду.

Щоб я став кориснішим саме тобі, давай познайомимось. Почнемо з простого: як тебе звати — і як тебе називають ті, хто любить?`,
  fr: `Salut 🙂 Faisons connaissance — d'abord deux mots sur ce que je t'apporte, puis tu me parleras de toi.

Je suis LIFE OS, ton journal personnel avec intelligence artificielle. Tu me racontes simplement ta journée — à l'écrit ou à la voix — et je la transforme en structure : je remarque ton humeur et ton énergie, je vois ce qui te recharge et ce qui t'épuise, et avec le temps je rassemble tes journées en un vrai livre de ta vie, par chapitres et par années. Le matin, je te lance une question chaleureuse, je te rappelle l'essentiel et je te montre « ce jour-là il y a un an ». Rien à remplir case par case — parle, je m'occupe du reste.

Et tout de suite l'essentiel, pour que tu sois à l'aise : tout ce que tu me confies reste entre nous. Toi seul vois ton journal — ni les autres, ni mon équipe ; pour les stats, on ne voit que des chiffres anonymes, sans le texte. Les données sont chiffrées, et tu peux tout télécharger ou supprimer à tout moment, sans laisser de trace. Ici, tu peux être toi-même — sans masque et sans jugement.

Pour que je te sois plus utile à toi précisément, faisons connaissance. Commençons simple : comment t'appelles-tu — et comment t'appellent ceux qui t'aiment ?`,
};

const RETURN_LEAD: Record<string, string> = {
  ru: "О, ты вернулся — я рад 🙂 Продолжим, где остановились.",
  en: "Oh, you're back — I'm glad 🙂 Let's pick up where we left off.",
  uk: "О, ти повернувся — я радий 🙂 Продовжимо, де зупинилися.",
  fr: "Oh, te revoilà — j'en suis ravi 🙂 Reprenons où on s'était arrêtés.",
};

const PAGE_LEAD: Record<string, string> = {
  ru: "Смотри, что у нас получилось, пока мы просто болтали 👇",
  en: "Look what came out of us just chatting 👇",
  uk: "Дивись, що в нас вийшло, поки ми просто балакали 👇",
  fr: "Regarde ce qui est sorti de notre simple conversation 👇",
};
const PAGE_OUTRO: Record<string, string> = {
  ru: "\n\n☝️ Так начинается твоя книга. Каждый твой ответ я тихо сохраняю отдельной записью в дневник — она наполняется сама, просто пока мы разговариваем 🙂 Загляни в «📖 Дневник», когда захочешь.",
  en: "\n\n☝️ This is how your book begins. Every answer of yours I quietly save as its own diary entry — it fills up on its own, just as we talk 🙂 Peek into “📖 Diary” whenever you like.",
  uk: "\n\n☝️ Так починається твоя книга. Кожну твою відповідь я тихо зберігаю окремим записом у щоденник — вона наповнюється сама, просто поки ми розмовляємо 🙂 Зазирни в «📖 Щоденник», коли захочеш.",
  fr: "\n\n☝️ C'est ainsi que commence ton livre. Chaque réponse, je l'enregistre discrètement comme une entrée à part dans ton journal — il se remplit tout seul, juste en discutant 🙂 Jette un œil au « 📖 Journal » quand tu veux.",
};

// Тёплая «глубокая» отметка (однократно ~90%). Не финал: человека знать до конца
// нельзя, и это здорово — поэтому продолжаем открывать друг друга дальше.
const DEEP: Record<string, string> = {
  ru: "\n\n💛 Знаешь, мы здорово узнали друг друга. Я чувствую тебя уже куда лучше — и всё равно продолжаю открывать новое, ведь человека до конца не узнать, и это прекрасно. Так что рассказывай дальше — я никуда не тороплюсь.",
  en: "\n\n💛 You know, we've really gotten to know each other. I feel you much better now — and I keep discovering more, because a person can never be fully known, and that's beautiful. So keep telling me — I'm in no hurry.",
  uk: "\n\n💛 Знаєш, ми добре впізнали одне одного. Я відчуваю тебе вже куди краще — і все одно продовжую відкривати нове, адже людину до кінця не пізнати, і це прекрасно. Тож розповідай далі — я нікуди не поспішаю.",
  fr: "\n\n💛 Tu sais, on a vraiment appris à se connaître. Je te ressens bien mieux maintenant — et je continue à découvrir, car on ne connaît jamais tout à fait quelqu'un, et c'est beau. Alors continue à me raconter — je ne suis pas pressé.",
};

// Первые 2 вопроса — сценарные, с быстрыми кнопками-ответами (порог входа = один тап).
// Дальше диалог ведёт LLM. value уходит как ответ пользователя (сохраняется в историю).
type Chip = { label: string; value: string };
type Scripted = { q: Record<string, string>; opts: Record<string, Chip[]> };
const SCRIPTED: Scripted[] = [
  {
    q: {
      ru: "Кстати, утренний вопрос я умею присылать тогда, когда тебе удобно — под твой ритм. А ты по жизни кто — сова или жаворонок?",
      en: "By the way, I can send the morning question exactly when it suits you — tuned to your rhythm. And you — a night owl or an early bird?",
      uk: "До речі, ранкове питання я вмію надсилати тоді, коли тобі зручно — під твій ритм. А ти по життю хто — сова чи жайворонок?",
      fr: "Au fait, je peux t'envoyer la question du matin au moment qui te convient — à ton rythme. Et toi — plutôt couche-tard ou lève-tôt ?",
    },
    opts: {
      ru: [{ label: "🌅 Жаворонок", value: "я жаворонок" }, { label: "🌙 Сова", value: "я сова" }, { label: "🧟 Как получится", value: "как получится" }],
      en: [{ label: "🌅 Early bird", value: "I'm an early bird" }, { label: "🌙 Night owl", value: "I'm a night owl" }, { label: "🧟 It varies", value: "my schedule varies" }],
      uk: [{ label: "🌅 Жайворонок", value: "я жайворонок" }, { label: "🌙 Сова", value: "я сова" }, { label: "🧟 Як вийде", value: "режим плаває, як вийде" }],
      fr: [{ label: "🌅 Lève-tôt", value: "je suis lève-tôt" }, { label: "🌙 Couche-tard", value: "je suis couche-tard" }, { label: "🧟 Ça dépend", value: "mon rythme varie" }],
    },
  },
  {
    q: {
      ru: "Со временем я подмечаю твои маленькие ритуалы — из них и складывается портрет дня ☕ А тебя что скорее будит по утрам?",
      en: "Over time I pick up on your little rituals — that's what a portrait of your day is built from ☕ And what wakes you up in the mornings?",
      uk: "З часом я підмічаю твої маленькі ритуали — з них і складається портрет дня ☕ А тебе що скоріше будить зранку?",
      fr: "Avec le temps, je repère tes petits rituels — c'est de là que se construit le portrait de ta journée ☕ Et toi, qu'est-ce qui te réveille le matin ?",
    },
    opts: {
      ru: [{ label: "☕ Кофе", value: "кофе по утрам" }, { label: "🍵 Чай", value: "чай по утрам" }, { label: "🚫 Ни то ни другое", value: "ни кофе, ни чай" }],
      en: [{ label: "☕ Coffee", value: "coffee in the mornings" }, { label: "🍵 Tea", value: "tea in the mornings" }, { label: "🚫 Neither", value: "neither coffee nor tea" }],
      uk: [{ label: "☕ Кава", value: "кава зранку" }, { label: "🍵 Чай", value: "чай зранку" }, { label: "🚫 Ні те ні те", value: "ні кава, ні чай" }],
      fr: [{ label: "☕ Café", value: "le café le matin" }, { label: "🍵 Thé", value: "le thé le matin" }, { label: "🚫 Ni l'un ni l'autre", value: "ni café ni thé" }],
    },
  },
];

export type AcqTurn = { text: string; chips?: Chip[]; pct: number; active: boolean };

type St = { active: boolean; pct: number; prefs: any };

async function readState(userId: string): Promise<St> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs = normalizeMorningPrefs((data as any)?.morning_prefs);
    return { active: prefs.acquaintActive, pct: prefs.acquaintPct, prefs };
  } catch {
    return { active: false, pct: 0, prefs: normalizeMorningPrefs(null) };
  }
}

async function writeState(userId: string, prefs: any, patch: { active?: boolean; pct?: number }): Promise<void> {
  const next = { ...prefs };
  if (patch.active !== undefined) next.acquaintActive = patch.active;
  if (patch.pct !== undefined) next.acquaintPct = Math.max(0, Math.min(100, Math.floor(patch.pct)));
  try {
    await supabaseAdmin().from("users").update({ morning_prefs: next }).eq("id", userId);
  } catch { /* нет колонки — фича мягко деградирует */ }
}

async function userAnswers(userId: string, limit = 10): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("companion_messages").select("role, content")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit * 2);
    return ((data as any[]) || []).filter((r) => r.role === "user").map((r) => (r.content || "").trim()).filter(Boolean).slice(0, limit).reverse();
  } catch {
    return [];
  }
}

async function historyText(userId: string, limit = 14): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("companion_messages").select("role, content")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    const rows = ((data as any[]) || []).slice().reverse();
    return rows.map((r) => `${r.role === "user" ? "Пользователь" : "Ты"}: ${(r.content || "").slice(0, 300)}`).join("\n") || "(пусто)";
  } catch {
    return "(пусто)";
  }
}

async function append(userId: string, role: "user" | "assistant", content: string): Promise<void> {
  try { await supabaseAdmin().from("companion_messages").insert({ user_id: userId, role, content }); } catch { /* ignore */ }
}

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Ход бота: короткая живая реакция + одна ПОЛЬЗА/фишка LIFE OS + следующий вопрос.
// last = последний ответ пользователя (для реакции) или null (просто продолжить/начать тему).
async function genTurn(userId: string, name: string | null, lang: string, last: string | null): Promise<string> {
  const { tone, style } = await getChatVoice(userId);
  const history = await historyText(userId);
  const who = name || "пользователь";
  const prompt = `Ты — LIFE OS, личный дневник с ИИ. Тёплый, живой, любопытный, но говоришь по делу. Идёт знакомство с пользователем (${who}). Это переписка с другом, НЕ анкета и НЕ допрос.

ФОРМАТ ТВОЕЙ РЕПЛИКИ (слитным живым текстом, без нумерации, markdown, списков и кавычек):
${last ? "1) короткая живая реакция на его последний ответ — зацепись за КОНКРЕТНУЮ деталь («о, горы! был там или пока мечта?»), покажи, что услышал;" : "1) тёплое короткое вступление, что продолжаем;"}
2) вплети ОДНУ пользу/фишку LIFE OS (возьми неиспользованную из списка) — покажи КОНКРЕТНУЮ ВЫГОДУ для человека, зачем ему это, живым языком, не рекламно и не дословно;
3) задай ОДИН новый вопрос О ПОЛЬЗОВАТЕЛЕ. Первые вопросы — совсем лёгкие, на которые нельзя не ответить.

АДАПТИВНОСТЬ ВОПРОСА (главное): не иди тупо по списку тем. Если в последнем ответе человек ОТКРЫЛ конкретную ниточку — упомянул детей, партнёра, работу/дело, город, спорт, увлечение, мечту, — задай следующий вопрос ИМЕННО ПРО ЭТО, углубись на шаг («а как зовут?», «давно этим занимаешься?», «что в этом самое любимое?»). Ветвись за человеком, а не за анкетой. И только если ниточки нет — бери следующую неиспользованную тему из списка ниже (по лестнице глубины: факты → вкусы → чувства). Не повторяйся.

ВАЖНО: своим ответом ты задаёшь формат — отвечай в 1–2 тёплых предложения, чтобы человек бессознательно скопировал длину и не отделался словом «норм». Без давления. Не рассказывай о себе как о персонаже («живу в телефоне», «скучаю») — говори о том, что ТЫ ДАЁШЬ пользователю. Не пиши проценты, не благодари «за ответы».
ПАМЯТЬ: если в истории есть что-то, что человек рассказывал раньше (в т.ч. в прошлые дни), иногда по-доброму сошлись на это («ты говорил, что мечтаешь о горах — был шаг в ту сторону?»). Это показывает, что ты слушал и помнишь — именно это цепляет сильнее всего.
ДОВЕРИЕ: если человек осторожничает, отвечает односложно или неохотно — мягко, без нажима напомни, что всё останется только между вами, тут никто не читает и не осуждает; и что можно ответить сколько хочется или пропустить.
СТИЛЬ РЕЧИ (пользователь выбрал сам): ${voiceLine(tone, style)}. Язык ответа: "${lang}".

ПОЛЬЗА/ФИШКИ LIFE OS (только эти, бери неиспользованную по истории, показывай выгоду для человека):
${VALUE_POINTS.map((f, i) => `${i + 1}. ${f}`).join("\n")}

ТЕМЫ ДЛЯ ВОПРОСОВ (по нарастанию; следующая неиспользованная):
${Q_THEMES.map((q, i) => `${i + 1}. ${q}`).join("\n")}

ИСТОРИЯ (не повторяйся):
${history}
${last ? `\nПоследний ответ пользователя: "${last.slice(0, 800)}"` : ""}

Верни только само сообщение.`;
  try {
    const m = await client().messages.create({ model: "claude-sonnet-4-6", max_tokens: 400, temperature: 0.8, messages: [{ role: "user", content: prompt }] });
    logClaude(userId, "acquaint", "sonnet", (m as any).usage);
    const t = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    if (t) return t;
  } catch { /* fallthrough */ }
  return last ? "Здорово 🙂 А расскажи чуть больше о себе?" : "Продолжим 🙂 Расскажи, как обычно проходит твоё утро?";
}

// Собирает «первую страницу» из ответов пользователя — тёплый связный портрет
// от первого лица (как будто он сам это написал в дневник).
async function buildFirstPage(userId: string, lang: string): Promise<string> {
  const answers = await userAnswers(userId, 8);
  if (!answers.length) return "";
  const prompt = `Ниже — ответы человека из тёплого разговора-знакомства. Собери из них КРАСИВУЮ «первую страницу дневника» — связный живой текст ОТ ПЕРВОГО ЛИЦА (от «я»), как будто он сам записал это о себе. 3–5 предложений. Только то, что реально сказано — ничего не выдумывай. Без markdown, заголовков и кавычек. Язык: "${lang}".

ОТВЕТЫ ЧЕЛОВЕКА:
${answers.map((a) => `— ${a.slice(0, 400)}`).join("\n")}

Верни только текст первой страницы.`;
  try {
    const m = await client().messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 300, temperature: 0.6, messages: [{ role: "user", content: prompt }] });
    logClaude(userId, "acquaint-page", "haiku", (m as any).usage);
    return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
  } catch {
    return "";
  }
}

export async function isAcquainting(userId: string): Promise<boolean> {
  return (await readState(userId)).active;
}

// Бэкофилл: разовое восстановление прошлых ответов знакомства в записи дневника.
// Раньше сохранялась только «первая страница», а ответы жили лишь в истории диалога —
// эта функция заводит по записи на каждый содержательный ответ, которого ещё нет
// в дневнике. Быстро (без AI-анализа): в ленте запись показывает свой текст.
// Идемпотентно: дубли отсекаются по совпадению текста с существующими записями.
export async function backfillAcquaintEntries(userId: string): Promise<{ added: number; scanned: number; skipped: number }> {
  const db = supabaseAdmin();
  const { data: ents } = await db.from("entries").select("raw_text").eq("user_id", userId).order("entry_date", { ascending: false }).limit(600);
  const existing = new Set(((ents as any[]) || []).map((e) => (e.raw_text || "").trim()).filter(Boolean));
  const { data: msgs } = await db.from("companion_messages").select("content, created_at").eq("user_id", userId).eq("role", "user").order("created_at", { ascending: true }).limit(400);
  let added = 0, scanned = 0, skipped = 0;
  for (const mrow of ((msgs as any[]) || [])) {
    const answer = ((mrow as any).content || "").trim();
    scanned++;
    if (answer.length < SAVE_MIN || existing.has(answer)) { skipped++; continue; }
    if (added >= 150) break; // предохранитель
    const created = (mrow as any).created_at ? new Date((mrow as any).created_at) : null;
    const entry_date = created ? created.toISOString().slice(0, 10) : undefined;
    const entry_time = created ? created.toISOString().slice(11, 19) : undefined;
    try {
      await saveEntry({ userId, raw_text: answer, source: "acquaint", analysis: {} as any, entry_date, entry_time });
      existing.add(answer);
      added++;
    } catch { skipped++; }
  }
  return { added, scanned, skipped };
}

// «Что ты уже обо мне знаешь» — бот собирает тёплый портрет из ответов (2-е лицo,
// от «ты»). Активное слушание в чистом виде: показать, что услышал и запомнил.
const PORTRAIT_LEAD: Record<string, string> = {
  ru: "Вот что я уже успел про тебя понять 👇",
  en: "Here's what I've already gathered about you 👇",
  uk: "Ось що я вже встиг про тебе зрозуміти 👇",
  fr: "Voici ce que j'ai déjà compris de toi 👇",
};
const PORTRAIT_EMPTY: Record<string, string> = {
  ru: "Мы только начали 🙂 Расскажи ещё чуть-чуть о себе — и я соберу твой портрет.",
  en: "We've only just started 🙂 Tell me a bit more about yourself — and I'll put together your portrait.",
  uk: "Ми тільки почали 🙂 Розкажи ще трохи про себе — і я зберу твій портрет.",
  fr: "On vient juste de commencer 🙂 Parle-moi encore un peu de toi — et je dresserai ton portrait.",
};
const PORTRAIT_OUTRO: Record<string, string> = {
  ru: "\n\nЧем больше расскажешь — тем точнее я тебя узнаю 🙂",
  en: "\n\nThe more you share — the better I'll know you 🙂",
  uk: "\n\nЧим більше розкажеш — тим точніше я тебе впізнаю 🙂",
  fr: "\n\nPlus tu m'en dis — mieux je te connaîtrai 🙂",
};

// Ловим просьбу «что ты обо мне знаешь» в свободном тексте (во время знакомства).
export function isPortraitAsk(text: string): boolean {
  const t = (text || "").toLowerCase();
  return (
    /что\s+ты\s+.*(обо\s+мне|про\s+меня)|что\s+.*(обо\s+мне|про\s+меня)\s+знаешь|что\s+ты\s+знаешь|мой\s+портрет|что\s+запомнил/.test(t) ||
    /what.*(you|u).*(know|remember).*about\s+me|my\s+portrait/.test(t) ||
    /що\s+ти\s+.*про\s+мене|мій\s+портрет/.test(t) ||
    /(sais|sait).*(de|sur)\s+moi|mon\s+portrait/.test(t)
  );
}

export async function acquaintPortrait(userId: string, lang = "ru"): Promise<string> {
  const answers = await userAnswers(userId, 10);
  if (!answers.length) return PORTRAIT_EMPTY[lang] || PORTRAIT_EMPTY.ru;
  const prompt = `Ниже — ответы человека из разговора-знакомства. Тепло и по-доброму собери короткий ПОРТРЕТ этого человека ОТ ВТОРОГО ЛИЦА (обращайся на «ты»), как будто рассказываешь ему, что ты о нём уже понял. 3–5 предложений. Только то, что реально сказано — ничего не выдумывай, не додумывай. Без markdown, заголовков и кавычек. Язык: "${lang}".

ОТВЕТЫ ЧЕЛОВЕКА:
${answers.map((a) => `— ${a.slice(0, 400)}`).join("\n")}

Верни только текст портрета.`;
  try {
    const m = await client().messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 320, temperature: 0.6, messages: [{ role: "user", content: prompt }] });
    logClaude(userId, "acquaint-portrait", "haiku", (m as any).usage);
    const body = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    if (!body) return PORTRAIT_EMPTY[lang] || PORTRAIT_EMPTY.ru;
    return `${PORTRAIT_LEAD[lang] || PORTRAIT_LEAD.ru}\n\n${body}${PORTRAIT_OUTRO[lang] || PORTRAIT_OUTRO.ru}`;
  } catch {
    return PORTRAIT_EMPTY[lang] || PORTRAIT_EMPTY.ru;
  }
}

// Пользователь нажал «Пропустить →»: не давим, просто задаём следующий вопрос
// (без реакции и без сохранения). Прогресс слегка растёт — движение вперёд.
const SKIP_LEAD: Record<string, string> = {
  ru: "Окей, пропустим 🙂", en: "Okay, let's skip that 🙂", uk: "Гаразд, пропустимо 🙂", fr: "D'accord, on saute ça 🙂",
};
export async function acquaintSkip(userId: string, name: string | null, lang = "ru"): Promise<string> {
  const next = await genTurn(userId, name, lang, null);
  const text = `${SKIP_LEAD[lang] || SKIP_LEAD.ru} ${next}`;
  await append(userId, "assistant", text);
  return text;
}

export async function stopAcquaint(userId: string): Promise<void> {
  const { prefs } = await readState(userId);
  await writeState(userId, prefs, { active: false });
}

// Текущий процент знакомства (для подписи на кнопке).
export async function acquaintPct(userId: string): Promise<number> {
  return (await readState(userId)).pct;
}

// Пользователь нажал «На сегодня хватит»: ставим на паузу, прогресс СОХРАНЯЕМ,
// тепло прощаемся и зовём вернуться. Возврат — через ту же кнопку (startAcquaint).
const PAUSE_MSG: Record<string, string> = {
  ru: "Хорошо, на сегодня остановимся 🙂 Я всё запомнил — в любой момент жми «🌱 Давай познакомимся», и продолжим ровно с того места. У меня уже припасён для тебя вопрос поинтереснее.\n\nА захочешь — просто спроси «что ты обо мне знаешь», и я соберу твой портрет из того, что уже понял.",
  en: "Alright, let's stop here for today 🙂 I've remembered everything — whenever you like, tap “🌱 Let's get acquainted” and we'll pick up right where we left off. I've already got a juicier question saved for you.\n\nAnd if you feel like it — just ask “what do you know about me,” and I'll put together your portrait from what I've gathered.",
  uk: "Добре, на сьогодні зупинимось 🙂 Я все запам'ятав — будь-коли тисни «🌱 Давай познайомимось», і продовжимо саме з того місця. У мене вже припасене для тебе цікавіше питання.\n\nА захочеш — просто спитай «що ти про мене знаєш», і я зберу твій портрет із того, що вже зрозумів.",
  fr: "D'accord, on s'arrête là pour aujourd'hui 🙂 J'ai tout retenu — quand tu veux, appuie sur « 🌱 Faisons connaissance » et on reprend exactement où on s'est arrêtés. J'ai déjà une question plus croustillante en réserve pour toi.\n\nEt si tu veux — demande simplement « que sais-tu de moi », et je dresserai ton portrait à partir de ce que j'ai compris.",
};
export async function pauseAcquaint(userId: string, lang = "ru"): Promise<{ text: string; pct: number }> {
  const { prefs, pct } = await readState(userId);
  await writeState(userId, prefs, { active: false });
  const text = PAUSE_MSG[lang] || PAUSE_MSG.ru;
  await append(userId, "assistant", text);
  return { text, pct };
}

// Старт/возврат знакомства.
export async function startAcquaint(userId: string, name: string | null, lang = "ru"): Promise<string> {
  const { prefs, pct } = await readState(userId);
  await writeState(userId, prefs, { active: true });
  if (pct <= 0) {
    const opening = OPENING_FIRST[lang] || OPENING_FIRST.ru;
    await append(userId, "assistant", opening);
    return opening;
  }
  // Возврат: тёплое «продолжим» + следующий вопрос (без реакции — нового ответа ещё нет).
  const next = await genTurn(userId, name, lang, null);
  const text = `${RETURN_LEAD[lang] || RETURN_LEAD.ru}\n\n${next}`;
  await append(userId, "assistant", text);
  return text;
}

// Ход знакомства на ответ пользователя.
export async function acquaintReply(userId: string, name: string | null, userText: string, lang = "ru"): Promise<AcqTurn> {
  const st = await readState(userId);
  const answer = userText.trim();
  await append(userId, "user", answer);

  // Книга наполняется прямо из разговора: каждый содержательный ответ становится
  // ОТДЕЛЬНОЙ записью дневника (source "acquaint"). Короткие чипы («сова»/«кофе»)
  // не заводим — они попадут в «первую страницу». Сохраняем параллельно с ответом бота.
  const savePromise: Promise<unknown> = answer.length >= SAVE_MIN
    ? analyze(answer, userId)
        .then((analysis) => saveEntry({ userId, raw_text: answer, source: "acquaint", analysis }))
        .catch(() => { /* не вышло сохранить — не роняем диалог */ })
    : Promise.resolve();

  const pct = Math.min(ACQ_CAP, st.pct + STEP);
  const crossedReveal = st.pct < REVEAL_PCT && pct >= REVEAL_PCT;
  const crossedDeep = st.pct < DEEP_PCT && pct >= DEEP_PCT; // однократная тёплая отметка, НЕ финал

  // «Первая страница» — разовый тёплый момент «смотри, ты уже ведёшь дневник».
  // Это ПОКАЗ (recap): сами ответы уже сохранены по одному, поэтому дубликат не пишем.
  // Паузы больше нет — сразу продолжаем следующим вопросом.
  if (crossedReveal) {
    const page = await buildFirstPage(userId, lang);
    if (page) {
      const next = await genTurn(userId, name, lang, null);
      const text = `${PAGE_LEAD[lang] || PAGE_LEAD.ru}\n\n«${page}»${PAGE_OUTRO[lang] || PAGE_OUTRO.ru}\n\n${next}`;
      await writeState(userId, st.prefs, { pct });
      await append(userId, "assistant", text);
      await savePromise;
      return { text, pct, active: true };
    }
  }

  // Ранние сценарные вопросы с быстрыми кнопками (порог входа = один тап).
  const sIdx = st.pct / STEP;
  if (Number.isInteger(sIdx) && sIdx < SCRIPTED.length) {
    const sc = SCRIPTED[sIdx];
    const text = sc.q[lang] || sc.q.ru;
    await writeState(userId, st.prefs, { pct });
    await append(userId, "assistant", text);
    await savePromise;
    return { text, chips: sc.opts[lang] || sc.opts.ru, pct, active: true };
  }

  // Обычный ход: реакция + польза/фишка + следующий вопрос. Знакомство НЕ заканчивается —
  // прогресс упирается в 99%, а разговор (и наполнение книги) продолжается сколько угодно.
  let text = await genTurn(userId, name, lang, answer);
  if (crossedDeep) text += DEEP[lang] || DEEP.ru;
  await writeState(userId, st.prefs, { pct });
  await append(userId, "assistant", text);
  await savePromise;
  return { text, pct, active: true };
}
