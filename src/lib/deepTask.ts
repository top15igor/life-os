import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { searchEverything, type Found } from "./vaultSearch";

// «Перебери всё про здоровье и дай саммари» — долгая работа агента по всем
// данным человека.
//
// Отличие от обычного вопроса: обычный ищет ОДИН факт и отвечает строкой. Здесь
// человек просит просмотреть ВСЁ по теме и вернуть картину — что было, как
// менялось, на что смотреть. Это дороже и дольше, поэтому запускается только по
// явной просьбе, а не при каждом вопросе.
//
// Как устроено: сначала сбор по всем полкам, потом сжатие пачками (дешёвой
// моделью), потом сборка отчёта (сильной). Одним запросом это не сделать —
// материал не влезает в контекст, а если просто обрезать, отчёт получится по
// первым попавшимся кускам и будет тихо врать о полноте.

const CHUNK_CHARS = 12000;
const MAX_CHUNKS = 6;
const MAX_ITEMS = 120;

let _c: Anthropic | null = null;
const client = () => (_c ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

const LANG: Record<string, string> = { ru: "русском", en: "English", uk: "українській", fr: "français", es: "español" };

const SRC: Record<string, string> = { diary: "дневник", note: "заметки", knowledge: "база знаний", doc: "документы" };

const NOTHING: Record<string, (t: string) => string> = {
  ru: (t) => `Не нашёл, что перебрать по теме «${t}». Возможно, записей на эту тему пока нет — или они называются другими словами.`,
  en: (t) => `Nothing to go through on “${t}” yet. Maybe there are no entries on it — or they're worded differently.`,
  uk: (t) => `Не знайшов, що перебрати за темою «${t}». Можливо, записів на цю тему ще немає — або вони названі інакше.`,
  fr: (t) => `Rien à parcourir sur « ${t} ». Il n'y a peut-être pas encore d'entrées — ou elles sont formulées autrement.`,
  es: (t) => `No hay nada que revisar sobre «${t}». Quizá aún no haya entradas — o estén con otras palabras.`,
};

export const WORKING: Record<string, (t: string) => string> = {
  ru: (t) => `🔍 Перебираю всё, что у тебя есть про «${t}». Это займёт до минуты — не уходи.`,
  en: (t) => `🔍 Going through everything you have on “${t}”. Up to a minute — hang on.`,
  uk: (t) => `🔍 Переглядаю все, що в тебе є про «${t}». Це займе до хвилини — не йди.`,
  fr: (t) => `🔍 Je parcours tout ce que tu as sur « ${t} ». Jusqu'à une minute — reste là.`,
  es: (t) => `🔍 Estoy revisando todo lo que tienes sobre «${t}». Hasta un minuto — no te vayas.`,
};

// Сжатие пачки: вытащить факты, а не пересказать красиво. Красоту наведём в
// финальной сборке — здесь важно ничего не потерять и не додумать.
const SQUEEZE = `Ниже — куски записей одного человека по одной теме. Выпиши из них ФАКТЫ, коротко, по одному в строке: что было, когда, какие числа и имена названы. Ничего не додумывай и не обобщай. Если в куске нет ничего по теме — пропусти его. Только список фактов, без вступления.`;

const REPORT = `Ты — внимательный помощник, который перебрал все записи человека по одной теме и теперь докладывает ему лично.

СТРУКТУРА ОТВЕТА:
1. Одно предложение — главное, что видно из всего материала.
2. «Что было» — ключевые факты и события, по времени. Числа и даты называй точно.
3. «Что меняется» — динамика, повторы, закономерности. Только если они действительно видны.
4. «На что посмотреть» — 1–3 наблюдения или вопроса к самому себе. Не советы врача и не диагнозы.

ПРАВИЛА:
— Опирайся ТОЛЬКО на приведённые факты. Ничего не выдумывай и не достраивай «как обычно бывает».
— Если материала мало для выводов, так и скажи — это честнее, чем натянуть закономерность на три записи.
— Обращайся на «ты», пиши по-человечески, без канцелярита и без markdown-заголовков.
— Никаких медицинских, юридических и финансовых предписаний: ты показываешь ЕГО данные, а не советуешь, что делать.`;

async function squeeze(userId: string, chunk: string): Promise<string> {
  try {
    const m = await client().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      temperature: 0,
      messages: [{ role: "user", content: `${SQUEEZE}\n\n${chunk}` }],
    });
    logClaude(userId, "deep-squeeze", "haiku", (m as any).usage);
    return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
  } catch {
    return "";
  }
}

export type DeepResult = { text: string; items: number; sources: string };

export async function deepSummary(userId: string, topic: string, locale = "ru"): Promise<DeepResult> {
  const t = (topic || "").trim();
  if (!t) return { text: (NOTHING[locale] || NOTHING.ru)(t), items: 0, sources: "" };

  const found: Found[] = await searchEverything(userId, t, MAX_ITEMS);
  if (!found.length) return { text: (NOTHING[locale] || NOTHING.ru)(t), items: 0, sources: "" };

  // По каким полкам собрано — человеку полезно понимать, на чём построен отчёт.
  const bySrc = new Map<string, number>();
  for (const f of found) bySrc.set(f.src, (bySrc.get(f.src) || 0) + 1);
  const sources = [...bySrc.entries()].map(([s, n]) => `${SRC[s] || s}: ${n}`).join(", ");

  // Материал режем на пачки и сжимаем каждую отдельно — иначе не влезает в
  // контекст, а обрезка молча превратила бы отчёт «по всему» в отчёт «по началу».
  const lines = found.map((f) => `[${SRC[f.src] || f.src}${f.date ? `, ${f.date}` : ""}] ${f.title ? f.title + ": " : ""}${f.text}`);
  const chunks: string[] = [];
  let cur = "";
  for (const line of lines) {
    if (cur.length + line.length > CHUNK_CHARS && cur) { chunks.push(cur); cur = ""; }
    if (chunks.length >= MAX_CHUNKS) break;
    cur += line + "\n---\n";
  }
  if (cur && chunks.length < MAX_CHUNKS) chunks.push(cur);

  const squeezed = (await Promise.all(chunks.map((c) => squeeze(userId, c)))).filter(Boolean).join("\n");
  const facts = squeezed || lines.join("\n").slice(0, 20000);

  const models = ["claude-sonnet-5", "claude-sonnet-4-6"];
  for (const model of models) {
    try {
      const m = await client().messages.create({
        model,
        max_tokens: 1600,
        temperature: 0.3,
        system: REPORT,
        messages: [{ role: "user", content: `ТЕМА: ${t}\nСОБРАНО ИЗ: ${sources}\n\nФАКТЫ ИЗ ЕГО ЗАПИСЕЙ:\n${facts}\n\nОтветь на ${LANG[locale] || LANG.ru} языке.` }],
      });
      logClaude(userId, "deep-report", "sonnet", (m as any).usage);
      const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      if (text) return { text, items: found.length, sources };
    } catch (e) {
      if (model === models[models.length - 1]) {
        return { text: facts.slice(0, 3000), items: found.length, sources };
      }
    }
  }
  return { text: facts.slice(0, 3000), items: found.length, sources };
}
