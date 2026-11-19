import Anthropic from "@anthropic-ai/sdk";

// Устройства, которые слушают постоянно (Omi и подобные), присылают ВСЁ: рабочие
// звонки, разговор в магазине, телевизор на фоне. Если лить это в дневник как
// есть, дневник превратится в свалку. Поэтому решаем мы, а не устройство.
//
// Три режима, от самого строгого к самому свободному:
//   trigger — сохраняем только то, что сказано после ключевой фразы
//   ai      — модель решает, мысль это или болтовня
//   all     — сохраняем всё (для кнопки: каждое нажатие осознанно)

export type FilterRules = {
  filter_mode?: string | null;
  trigger_phrases?: string | null;
  min_words?: number | null;
  only_me?: boolean | null;
  quiet_from?: number | null;
  quiet_to?: number | null;
};

export type FilterResult = { keep: boolean; text: string; reason?: string };

// Фразы по умолчанию. Распознавание речи пишет их по-разному, поэтому сравниваем
// и со сжатыми пробелами тоже: «лайф ос» и «лайфос» — одно и то же.
export const DEFAULT_PHRASES = ["лайф ос", "life os", "запиши", "заметка", "note to self"];

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function phrasesOf(rules: FilterRules): string[] {
  const raw = (rules.trigger_phrases || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (raw.length ? raw : DEFAULT_PHRASES).map(norm).filter(Boolean);
}

// Ищем ключевую фразу и возвращаем то, что сказано ПОСЛЕ неё.
// Сравниваем по нормализованному тексту, но режем исходный — чтобы в дневник
// попала живая фраза со знаками препинания, а не вычищенная.
function cutOnce(text: string, phrases: string[]): string | null {
  const flat = norm(text);
  const flatNoSpace = flat.replace(/ /g, "");

  let best = -1;
  let bestLen = 0;
  for (const p of phrases) {
    let i = flat.indexOf(p);
    let len = p.length;
    if (i < 0) {
      // «лайфос» вместо «лайф ос» — ищем без пробелов
      const j = flatNoSpace.indexOf(p.replace(/ /g, ""));
      if (j < 0) continue;
      // переводим позицию обратно в индекс строки с пробелами
      let seen = 0;
      for (let k = 0; k < flat.length; k++) {
        if (flat[k] !== " ") {
          if (seen === j) { i = k; break; }
          seen++;
        }
      }
      len = p.replace(/ /g, "").length;
      if (i < 0) continue;
    }
    if (best < 0 || i < best) { best = i; bestLen = len; }
  }
  if (best < 0) return null;

  // Нормализация меняет длину, поэтому позицию в исходном тексте ищем по числу слов.
  const wordsBefore = flat.slice(0, best + bestLen).split(" ").filter(Boolean).length;
  const srcWords = text.split(/\s+/).filter(Boolean);
  const tail = srcWords.slice(wordsBefore).join(" ").replace(/^[\s,.:;—-]+/, "").trim();
  return tail;
}

// В живой речи фразы идут подряд: «Лайф ОС, запиши: надо поменять масло».
// После первого среза снимаем и те, что остались в самом начале, — иначе
// в дневник попадёт «запиши: надо поменять масло».
export function afterTrigger(text: string, phrases: string[]): string | null {
  const first = cutOnce(text, phrases);
  if (first == null) return null;

  let out = first;
  for (let guard = 0; guard < 3; guard++) {
    const flat = norm(out);
    const lead = phrases.find((p) => flat === p || flat.startsWith(p + " ") || flat.replace(/ /g, "").startsWith(p.replace(/ /g, "")));
    if (!lead) break;
    const next = cutOnce(out, [lead]);
    if (next == null || next === out) break;
    out = next;
  }
  return out;
}

function inQuietHours(hour: number, from?: number | null, to?: number | null) {
  if (from == null || to == null || from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

// Дешёвые проверки — до всякого AI, чтобы не жечь деньги на мусоре.
function cheapChecks(text: string, rules: FilterRules, localHour?: number): FilterResult | null {
  if (localHour != null && inQuietHours(localHour, rules.quiet_from, rules.quiet_to)) {
    return { keep: false, text, reason: "тихие часы" };
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  const min = rules.min_words ?? 4;
  if (words < min) return { keep: false, text, reason: `короче ${min} слов` };
  return null;
}

async function aiWorthKeeping(text: string): Promise<boolean> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      messages: [{ role: "user", content: `Это кусок расшифровки с носимого диктофона, который пишет весь день подряд. Реши, стоит ли это сохранять в личный дневник, и ответь СТРОГО одним словом.

"keep" — человек делится мыслью, идеей, планом, решением, впечатлением, самочувствием или событием своей жизни. То, к чему он захочет вернуться.

"skip" — бытовая болтовня, обрывок без смысла, рабочая рутина, чужая речь, реклама, телевизор, разговор с кассиром, обсуждение погоды, приветствия и прощания.

Если сомневаешься — отвечай skip: лучше потерять мелочь, чем засорить дневник.

Текст:
"""${text.slice(0, 2000)}"""

Одним словом (keep или skip):` }],
    });
    const out = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").toLowerCase();
    return out.includes("keep");
  } catch {
    return false; // сбой AI не должен превращаться в поток мусора
  }
}

// Главная функция: что из пришедшего попадёт в дневник и в каком виде.
export async function applyFilter(text: string, rules: FilterRules, localHour?: number): Promise<FilterResult> {
  const clean = (text || "").trim();
  if (!clean) return { keep: false, text: "", reason: "пусто" };

  const mode = rules.filter_mode || "all";

  if (mode === "trigger") {
    const tail = afterTrigger(clean, phrasesOf(rules));
    if (tail == null) return { keep: false, text: clean, reason: "нет ключевой фразы" };
    const cheap = cheapChecks(tail, rules, localHour);
    if (cheap) return cheap;
    return { keep: true, text: tail };
  }

  const cheap = cheapChecks(clean, rules, localHour);
  if (cheap) return cheap;

  if (mode === "ai") {
    const ok = await aiWorthKeeping(clean);
    return ok ? { keep: true, text: clean } : { keep: false, text: clean, reason: "AI счёл это болтовнёй" };
  }

  return { keep: true, text: clean };
}
