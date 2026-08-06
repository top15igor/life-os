import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { getBookPrompt } from "./bookPrompts";
import type { MorningPrefs } from "./morningPrefs";

// Вечерний «вопрос для книги». По умолчанию — из банка (по самой тонкой главе
// и темам/подсказкам пользователя). Если включён режим AI — генерируем тёплый
// личный вопрос под эту тему. Возвращает текст вопроса или null.
// Возвращает вопрос вместе с ключом и источником: по ним недельный агент-редактор
// считает отклик и понимает, что именно работает — вопрос из банка, свой вопрос
// пользователя или сгенерированный AI.
export type EveningPick = { question: string; key: string; source: string };

export async function personalEvening(userId: string, lang: string, prefs: MorningPrefs): Promise<EveningPick | null> {
  const seed = Math.floor(Date.now() / 86400000);
  const bp = await getBookPrompt(userId, lang, seed, { themes: prefs.evening.themes, customPrompts: prefs.evening.customPrompts });
  if (!bp) return null;
  // Не AI (или нет ключа) → банковый/кастомный вопрос как есть.
  if (!prefs.evening.ai || !process.env.ANTHROPIC_API_KEY) return { question: bp.question, key: bp.key, source: bp.source };

  try {
    const db = supabaseAdmin();
    const { data: entries } = await db.from("entries").select("entry_date, summary").eq("user_id", userId).order("entry_date", { ascending: false }).limit(8);
    const recent = (entries || []).map((e: any) => `${e.entry_date}: ${(e.summary || "").slice(0, 200)}`).join("\n") || "(записей пока нет)";
    const addressLine = prefs.address ? `Обращайся к пользователю так: «${prefs.address}». ` : "";
    const hints = prefs.evening.customPrompts.length ? `\nНаправления-подсказки от самого пользователя (можешь вдохновиться): ${prefs.evening.customPrompts.join("; ")}.` : "";

    const prompt = `Вечер. Задай пользователю ОДИН тёплый, личный наводящий вопрос для его «Книги жизни» по теме «${bp.title}» — чтобы ему захотелось рассказать побольше об этой стороне жизни.
${addressLine}Пиши на языке с кодом "${lang}" (ru/en/uk/fr). Один вопрос, 1–2 предложения, бережно и по-человечески. Без преамбулы и без кавычек — только сам вопрос.
Можешь мягко опереться на недавние записи ниже, но НЕ выдумывай фактов и не пересказывай их — просто пригласи поделиться.${hints}

Недавние записи:
${recent}`;

    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    });
    logClaude(userId, "evening", "haiku", (m as any).usage);
    const text = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    // Ключ AI-вопроса — по теме: сами формулировки каждый раз новые, и считать
    // отклик по ним поштучно бессмысленно. Зато видно, работает ли AI-режим
    // в принципе и на каких темах.
    return text ? { question: text, key: `ai:${bp.theme}`, source: "ai" } : { question: bp.question, key: bp.key, source: bp.source };
  } catch (e) {
    console.error("personalEvening", userId, e);
    return { question: bp.question, key: bp.key, source: bp.source }; // фолбэк на банковый вопрос
  }
}
