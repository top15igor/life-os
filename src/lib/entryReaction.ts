import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { getChatVoice, voiceLine } from "./chatVoice";

// «Реакция друга» под разбором записи: одна короткая живая реплика от AI-друга
// в выбранном пользователем тоне/стиле. НЕ пересказывает запись и не меняет факты —
// это тёплый отклик рядом с фактическим разбором. Best-effort: при ошибке — null,
// сохранение записи от этого не зависит.
const LANG_CODE: Record<string, string> = { ru: "русском", en: "English", uk: "українській", fr: "français" };

export async function friendReaction(userId: string, entryText: string, lang = "ru"): Promise<string | null> {
  const clean = (entryText || "").trim();
  if (clean.length < 8) return null; // слишком коротко, чтобы осмысленно откликаться
  try {
    const { tone, style } = await getChatVoice(userId);
    const prompt = `Пользователь только что записал в свой дневник:
"${clean.slice(0, 1500)}"

Ты — его личный AI-друг. Ответь ОДНОЙ короткой живой репликой-реакцией (1 предложение, максимум два), как близкий друг, который это прочитал: поддержи, порадуйся вместе, по-доброму подметь важное или мягко подтолкни — по ситуации.
Стиль речи (пользователь выбрал сам): ${voiceLine(tone, style)}.
Отвечай на ${LANG_CODE[lang] || LANG_CODE.ru} языке. Без пересказа записи, без списков, без markdown и без кавычек. Верни только саму реплику.`;
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "reaction", "haiku", (m as any).usage);
    const t = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    return t ? t.replace(/^[«"']+|[»"']+$/g, "").trim() : null;
  } catch {
    return null;
  }
}
