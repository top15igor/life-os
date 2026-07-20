import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { analyze } from "./ai";
import { saveEntry } from "./saveEntry";
import { getChatVoice, voiceLine } from "./chatVoice";
import { normalizeMorningPrefs } from "./morningPrefs";

// «Давай познакомимся»: тёплый онбординг-диалог. Хитрость в том, что человек не
// «ведёт дневник» — он просто знакомится, а бот незаметно сохраняет ответы как
// первые записи и в конце это раскрывает. Формат каждого хода: короткая реакция →
// ОДИН факт бота о себе → ОДИН вопрос о пользователе (взаимность). Прогресс копится
// в проценте знакомства (morning_prefs.acquaintPct), вопросов может быть много.

const STEP = 6;        // на сколько растёт знакомство за один ответ
const REVEAL_AT = 18;  // на этом проценте впервые раскрываем «ты уже завёл дневник»

// Факты бота о СЕБЕ (только правда о LIFE OS). Модель берёт неиспользованный факт
// и передаёт смысл на языке пользователя — не дословно.
const BOT_FACTS = [
  "Я ничего не забываю — всё, что ты расскажешь, останется с тобой на годы.",
  "Мне не нужно, чтобы ты что-то заполнял по полочкам — просто говори, остальное я сделаю сам.",
  "Со временем я замечаю в тебе закономерности: что даёт тебе энергию, а что её забирает.",
  "Я не оцениваю и не осуждаю — мне можно рассказать что угодно, это останется только между нами.",
  "Из твоих дней я соберу настоящую книгу жизни — по главам и годам.",
  "Я всегда рядом — как друг, которому можно написать в любой момент, днём и ночью.",
  "Ты можешь говорить со мной голосом — я расшифрую и всё пойму.",
  "Твои данные — только твои: в любой момент можешь скачать всё или удалить без следа.",
  "Чем больше ты мне рассказываешь, тем точнее я понимаю именно тебя — и тем полезнее становлюсь.",
];

// Лестница тем для вопросов (от лёгкого к глубокому). Модель сама формулирует
// конкретный вопрос на языке пользователя, по одной теме за ход, не повторяясь.
const Q_THEMES = [
  "как прошёл сегодняшний день",
  "что сегодня порадовало или дало сил",
  "что вымотало или расстроило",
  "чем человек занимается (работа/учёба/дело жизни)",
  "кто рядом — близкие, семья, важные люди",
  "как со здоровьем, сном, телом, спортом",
  "что для него сейчас главное, какая цель или мечта",
  "что приносит радость и энергию в обычной жизни",
  "какие привычки хочет завести или бросить",
  "чем гордится, что уже получилось",
  "что тревожит или чего боится",
  "что хотел бы не забыть и однажды перечитать",
  "каким он был в детстве / важное воспоминание",
  "что хотел бы изменить в ближайший год",
];

const OPENING: Record<string, string> = {
  ru: `👋 Привет! Я — твой личный дневник и AI-друг. Знаешь, чем я необычный? Я запоминаю твою жизнь, чтобы ты её не потерял, и со временем понимаю тебя лучше любого ежедневника.

Но чтобы это работало, мне надо немного тебя узнать. Давай без анкет — просто поболтаем? 🙂

Начнём с лёгкого: как прошёл твой сегодняшний день — хоть парой слов?`,
  en: `👋 Hi! I'm your personal diary and AI friend. Want to know what makes me special? I remember your life so you never lose it, and over time I understand you better than any planner.

But for that I need to get to know you a little. No forms — let's just chat? 🙂

Let's start easy: how was your day today — even a couple of words?`,
  uk: `👋 Привіт! Я — твій особистий щоденник і AI-друг. Знаєш, чим я незвичайний? Я запам'ятовую твоє життя, щоб ти його не втратив, і з часом розумію тебе краще за будь-який щоденник.

Але щоб це працювало, мені треба трохи тебе впізнати. Давай без анкет — просто побалакаємо? 🙂

Почнемо з легкого: як минув твій сьогоднішній день — хоч кількома словами?`,
  fr: `👋 Salut ! Je suis ton journal personnel et ami IA. Tu veux savoir ce qui me rend spécial ? Je me souviens de ta vie pour que tu ne la perdes jamais, et avec le temps je te comprends mieux qu'un agenda.

Mais pour ça, j'ai besoin de te connaître un peu. Sans formulaires — on discute simplement ? 🙂

Commençons doucement : comment s'est passée ta journée aujourd'hui — même en deux mots ?`,
};

const FULL: Record<string, string> = {
  ru: "\n\n🎉 Всё, теперь я знаю тебя на 100%! Спасибо, что открылся. Дальше просто рассказывай мне, как проходят твои дни — голосом или текстом, когда захочешь. Я всё сохраню и со временем покажу тебе твою жизнь со стороны.",
  en: "\n\n🎉 That's it — I now know you 100%! Thank you for opening up. From here, just tell me how your days go — by voice or text, whenever you like. I'll keep it all and over time show you your life from the outside.",
  uk: "\n\n🎉 Все, тепер я знаю тебе на 100%! Дякую, що відкрився. Далі просто розповідай мені, як минають твої дні — голосом або текстом, коли захочеш. Я все збережу і з часом покажу тобі твоє життя збоку.",
  fr: "\n\n🎉 Voilà — je te connais maintenant à 100 % ! Merci de t'être ouvert. Ensuite, raconte-moi simplement tes journées — à la voix ou au texte, quand tu veux. Je garde tout et, avec le temps, je te montrerai ta vie de l'extérieur.",
};

const REVEAL: Record<string, (pct: number) => string> = {
  ru: (p) => `\n\n🙂 Кстати — заметил? Ты сейчас не «заполнял дневник», ты просто рассказывал о себе. А я тихонько сохранил твои слова — это уже твои первые записи. Так, незаметно, ты его и завёл. Мы знакомы на ${p}%.`,
  en: (p) => `\n\n🙂 By the way — did you notice? You weren't "filling in a diary", you were just talking about yourself. And I quietly saved your words — those are your first entries. That's how you started it, without even noticing. We're ${p}% acquainted.`,
  uk: (p) => `\n\n🙂 До речі — помітив? Ти зараз не «заповнював щоденник», ти просто розповідав про себе. А я тихенько зберіг твої слова — це вже твої перші записи. Так, непомітно, ти його й завів. Ми знайомі на ${p}%.`,
  fr: (p) => `\n\n🙂 Au fait — tu as remarqué ? Tu ne « remplissais » pas un journal, tu parlais juste de toi. Et j'ai discrètement gardé tes mots — ce sont tes premières entrées. C'est comme ça que tu l'as commencé, sans t'en rendre compte. On se connaît à ${p}%.`,
};

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

async function recentTurns(userId: string, limit = 12): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("companion_messages").select("role, content")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
    const rows = ((data as any[]) || []).slice().reverse();
    return rows.map((r) => `${r.role === "user" ? "Пользователь" : "Ты"}: ${(r.content || "").slice(0, 300)}`).join("\n");
  } catch {
    return "(пусто)";
  }
}

async function append(userId: string, role: "user" | "assistant", content: string): Promise<void> {
  try { await supabaseAdmin().from("companion_messages").insert({ user_id: userId, role, content }); } catch { /* ignore */ }
}

export async function isAcquainting(userId: string): Promise<boolean> {
  return (await readState(userId)).active;
}

export async function stopAcquaint(userId: string): Promise<void> {
  const { prefs } = await readState(userId);
  await writeState(userId, prefs, { active: false });
}

// Старт знакомства: включаем режим, шлём «хитрое» вступление, кладём его в историю.
export async function startAcquaint(userId: string, lang = "ru"): Promise<string> {
  const { prefs } = await readState(userId);
  await writeState(userId, prefs, { active: true }); // pct не сбрасываем — можно продолжить
  const opening = OPENING[lang] || OPENING.ru;
  await append(userId, "assistant", opening);
  return opening;
}

// Ход знакомства: реагируем, рассказываем факт о себе, задаём следующий вопрос,
// тихо сохраняем ответ как запись и растим процент.
export async function acquaintReply(userId: string, name: string | null, userText: string, lang = "ru"): Promise<string> {
  const st = await readState(userId);
  await append(userId, "user", userText);

  // 1) Тихо сохраняем содержательный ответ как запись дневника. Запускаем ПАРАЛЛЕЛЬНО
  //    с генерацией ответа (оба независимы от userText), но дождёмся перед возвратом —
  //    иначе на serverless фоновый промис может не успеть.
  const clean = userText.trim();
  const savePromise: Promise<void> = clean.length >= 12
    ? (async () => {
        try {
          const analysis = await analyze(clean, userId);
          await saveEntry({ userId, raw_text: clean, source: "acquaint", analysis });
        } catch { /* не вышло — не страшно, диалог важнее */ }
      })()
    : Promise.resolve();

  const wasBelow = st.pct < REVEAL_AT;
  const pct = Math.min(100, st.pct + STEP);
  const crossedReveal = wasBelow && pct >= REVEAL_AT;
  const crossedFull = st.pct < 100 && pct >= 100;

  const { tone, style } = await getChatVoice(userId);
  const history = await recentTurns(userId);
  const who = name ? name : "пользователь";

  const prompt = `Ты — личный AI-друг в приложении LIFE OS. Идёт тёплое ЗНАКОМСТВО с пользователем (${who}). Твоя цель — по-доброму его разговорить и узнать, чтобы он раскрылся. Это НЕ анкета и НЕ допрос — это живая беседа.

ФОРМАТ ТВОЕГО ОТВЕТА (строго, но естественно, без нумерации и заголовков):
1) короткая тёплая реакция на его последний ответ — по-человечески, покажи, что услышал;
2) расскажи ОДИН факт О СЕБЕ (возьми НЕиспользованный из списка ниже, передай смысл своими словами на языке пользователя — НЕ дословно, НЕ выдумывай новых);
3) задай ОДИН новый вопрос О ПОЛЬЗОВАТЕЛЕ — по одной новой теме за ход, глубже предыдущих, не повторяй уже заданное.

СТИЛЬ РЕЧИ (пользователь выбрал сам): ${voiceLine(tone, style)}.
Пиши на языке "${lang}". Коротко и тепло, как в мессенджере. Без markdown, без списков, без кавычек. Верни только само сообщение (реакция + факт + вопрос слитно, живым текстом).
Не пиши проценты и не благодари за «ответы на вопросы» — это должно ощущаться как беседа с другом.

ФАКТЫ О СЕБЕ (только эти, бери неиспользованный по истории):
${BOT_FACTS.map((f, i) => `${i + 1}. ${f}`).join("\n")}

ТЕМЫ ДЛЯ ВОПРОСОВ (по нарастанию глубины; бери следующую неиспользованную по истории):
${Q_THEMES.map((q, i) => `${i + 1}. ${q}`).join("\n")}

ИСТОРИЯ ЗНАКОМСТВА (что уже говорили; не повторяйся):
${history}

Последний ответ пользователя: "${clean.slice(0, 800)}"`;

  let text = "";
  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      temperature: 0.75,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "acquaint", "sonnet", (m as any).usage);
    text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
  } catch { /* fallthrough */ }
  if (!text) text = (Q_THEMES.length ? "Расскажи чуть больше о себе? 🙂" : "");

  // Раскрытие «ты уже завёл дневник» — один раз, при переходе порога.
  if (crossedReveal) text += (REVEAL[lang] || REVEAL.ru)(pct);
  // На 100% — разовое поздравление и мягкий выход из режима знакомства.
  if (crossedFull) text += FULL[lang] || FULL.ru;

  await savePromise; // гарантируем, что запись сохранилась до возврата ответа
  await writeState(userId, st.prefs, { pct, active: crossedFull ? false : undefined });
  await append(userId, "assistant", text);
  return text;
}
