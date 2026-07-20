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

const STEP = 6;              // +% знакомства за один ответ
const REVEAL_PCT = 24;       // ~4 ответа → показываем «первую страницу» и делаем паузу

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

const CLIFFHANGER: Record<string, string> = {
  ru: "\n\nВсё, на сегодня хватит откровений 😄 Завтра продолжим — у меня уже есть для тебя вопрос поинтереснее. Нажми «🌱 Давай познакомимся», когда захочешь.",
  en: "\n\nOkay, enough confessions for today 😄 We'll continue tomorrow — I already have a juicier question for you. Tap “🌱 Let's get acquainted” whenever you like.",
  uk: "\n\nВсе, на сьогодні досить одкровень 😄 Завтра продовжимо — у мене вже є для тебе цікавіше питання. Натисни «🌱 Давай познайомимось», коли захочеш.",
  fr: "\n\nBon, assez de confidences pour aujourd'hui 😄 On continue demain — j'ai déjà une question plus croustillante pour toi. Appuie sur « 🌱 Faisons connaissance » quand tu veux.",
};

const PAGE_LEAD: Record<string, string> = {
  ru: "Смотри, что у нас получилось, пока мы просто болтали 👇",
  en: "Look what came out of us just chatting 👇",
  uk: "Дивись, що в нас вийшло, поки ми просто балакали 👇",
  fr: "Regarde ce qui est sorti de notre simple conversation 👇",
};
const PAGE_OUTRO: Record<string, string> = {
  ru: "\n\n☝️ Это — твоя первая запись. Ты уже её написал, просто разговаривая со мной 🙂 Я её сохранил в твой дневник.",
  en: "\n\n☝️ That's your first entry. You already wrote it, just by talking to me 🙂 I've saved it to your diary.",
  uk: "\n\n☝️ Це — твій перший запис. Ти вже його написав, просто розмовляючи зі мною 🙂 Я зберіг його у твій щоденник.",
  fr: "\n\n☝️ C'est ta première entrée. Tu l'as déjà écrite, juste en me parlant 🙂 Je l'ai enregistrée dans ton journal.",
};

const FULL: Record<string, string> = {
  ru: "\n\n🎉 Всё, теперь я знаю тебя на 100%! Спасибо, что открылся. Дальше просто рассказывай, как проходят дни — я всё сохраню.",
  en: "\n\n🎉 That's it — I now know you 100%! Thanks for opening up. From here, just tell me how your days go — I'll keep it all.",
  uk: "\n\n🎉 Все, тепер я знаю тебе на 100%! Дякую, що відкрився. Далі просто розповідай, як минають дні — я все збережу.",
  fr: "\n\n🎉 Voilà — je te connais à 100 % ! Merci de t'être ouvert. Ensuite, raconte-moi tes journées — je garde tout.",
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

export type AcqTurn = { text: string; chips?: Chip[] };

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
3) задай ОДИН новый вопрос О ПОЛЬЗОВАТЕЛЕ — по лестнице глубины (факты → вкусы → чувства), по одной новой теме, не повторяйся. Первые вопросы — совсем лёгкие, на которые нельзя не ответить.

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
  await append(userId, "user", userText);

  const pct = Math.min(100, st.pct + STEP);
  const crossedReveal = st.pct < REVEAL_PCT && pct >= REVEAL_PCT;
  const crossedFull = st.pct < 100 && pct >= 100;

  // Момент «первой страницы»: собираем ответы в запись, сохраняем, показываем — и пауза.
  if (crossedReveal) {
    const page = await buildFirstPage(userId, lang);
    if (page) {
      try {
        const analysis = await analyze(page, userId);
        await saveEntry({ userId, raw_text: page, source: "acquaint", analysis });
      } catch { /* не вышло — покажем страницу всё равно */ }
      const text = `${PAGE_LEAD[lang] || PAGE_LEAD.ru}\n\n«${page}»${PAGE_OUTRO[lang] || PAGE_OUTRO.ru}${CLIFFHANGER[lang] || CLIFFHANGER.ru}`;
      await writeState(userId, st.prefs, { pct, active: false }); // незавершённость-крючок: пауза до возврата
      await append(userId, "assistant", text);
      return { text };
    }
  }

  // Ранние сценарные вопросы с быстрыми кнопками (порог входа = один тап).
  const sIdx = st.pct / STEP;
  if (Number.isInteger(sIdx) && sIdx < SCRIPTED.length) {
    const sc = SCRIPTED[sIdx];
    const text = sc.q[lang] || sc.q.ru;
    await writeState(userId, st.prefs, { pct });
    await append(userId, "assistant", text);
    return { text, chips: sc.opts[lang] || sc.opts.ru };
  }

  // Обычный ход: реакция + факт о себе + следующий вопрос.
  let text = await genTurn(userId, name, lang, userText.trim());
  if (crossedFull) text += FULL[lang] || FULL.ru;
  await writeState(userId, st.prefs, { pct, active: crossedFull ? false : undefined });
  await append(userId, "assistant", text);
  return { text };
}
