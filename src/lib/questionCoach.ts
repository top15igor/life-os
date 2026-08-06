import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage } from "./telegram";
import { logClaude } from "./usage";

// Агент-редактор вопросов.
//
// Задача: чтобы вопросы бота становились лучше не «на вкус модели», а по факту.
// Единственный честный признак качества вопроса — отвечают на него или молча
// пролистывают. Это и берём: отправлен → ответили → насколько длинно.
//
// Приватность (важно): агент видит ТОЛЬКО наш собственный вопрос и три числа —
// сколько раз задан, сколько раз ответили, средняя длина ответа. Ни одной буквы
// из чужого дневника сюда не попадает и в модель не уходит.
//
// Ничего не выкатывается само: предложения агента ложатся в question_candidates
// со статусом pending, а владелец одобряет их по одному на /admin/questions.
// Тон бота — это бренд, и ошибка тут бьёт по доверию сильнее, чем баг в коде.

const OWNER_ID = "00000000-0000-0000-0000-000000000000";

// Меньше этого числа показов статистика ничего не значит: вопрос, заданный
// трижды и проигнорированный трижды, — это не «плохой вопрос», это случайность.
const MIN_SENT = 8;
const MAX_CANDIDATES = 8;

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

export type QStat = { key: string; question: string; source: string; sent: number; answered: number; rate: number; avgLen: number };
export type Candidate = { theme: string; text: string; reason: string; replaces?: string };

// ===== Статистика =====

export async function questionStats(days = 60): Promise<QStat[]> {
  try {
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data } = await supabaseAdmin()
      .from("push_log").select("q_key, question, q_source, responded, answer_len")
      .eq("kind", "evening").gte("sent_at", since).not("q_key", "is", null).limit(5000);

    const map = new Map<string, QStat & { lenSum: number; lenN: number }>();
    for (const r of ((data as any[]) || [])) {
      const key = String(r.q_key || "");
      if (!key) continue;
      let g = map.get(key);
      if (!g) {
        g = { key, question: String(r.question || ""), source: String(r.q_source || ""), sent: 0, answered: 0, rate: 0, avgLen: 0, lenSum: 0, lenN: 0 };
        map.set(key, g);
      }
      g.sent++;
      if (r.responded) g.answered++;
      if (typeof r.answer_len === "number" && r.answer_len > 0) { g.lenSum += r.answer_len; g.lenN++; }
      if (!g.question && r.question) g.question = String(r.question);
    }
    return [...map.values()].map(({ lenSum, lenN, ...g }) => ({
      ...g,
      rate: g.sent ? g.answered / g.sent : 0,
      avgLen: lenN ? Math.round(lenSum / lenN) : 0,
    })).sort((a, b) => b.rate - a.rate || b.avgLen - a.avgLen);
  } catch {
    return [];
  }
}

// ===== Разбор моделью =====

const SYS = `Ты — редактор вопросов для личного дневника. Люди получают вечером один вопрос от бота и отвечают на него текстом или голосом — ответ становится страницей их книги жизни.

Тебе дают статистику: на какие вопросы отвечают часто и подробно, а какие молча пролистывают. Твоя задача — переписать слабые и предложить новые в духе сильных.

ЧТО ДЕЛАЕТ ВОПРОС ХОРОШИМ (это видно по данным, а не по вкусу):
— Конкретный. «Что сегодня было?» — пустота, отвечать нечего. «Кто сегодня тебя рассмешил?» — ответ приходит сам.
— Про случай, а не про обобщение. Человек легко вспоминает эпизод и с трудом формулирует «своё отношение к семье».
— Без домашнего задания. Вопрос, требующий подумать десять минут, не получит ответа вечером.
— Не лезет в больное без спроса. Смерть, разрывы, деньги — только мягко и по касательной.
— Тёплый, на «ты», без пафоса и без канцелярита.

ПРАВИЛА:
— Максимум ${MAX_CANDIDATES} предложений за раз.
— Для каждого: theme (одна из family, health, work, travel, growth, gratitude, emotions), text (сам вопрос, одно предложение), reason (почему считаешь, что сработает лучше — со ссылкой на данные), replaces (текст слабого вопроса, если предложение — замена ему; иначе пустая строка).
— Не предлагай вопрос, если он почти повторяет уже работающий.
— Не выдумывай статистику, которой нет.

Верни ТОЛЬКО JSON: {"candidates":[{"theme":"","text":"","reason":"","replaces":""}]}`;

async function ask(prompt: string): Promise<Candidate[]> {
  const models = ["claude-sonnet-5", "claude-sonnet-4-6"];
  for (const model of models) {
    try {
      const m = await client().messages.create({
        model, max_tokens: 2000, temperature: 0.7, system: SYS,
        messages: [{ role: "user", content: prompt }],
      });
      logClaude(OWNER_ID, "question-coach", "sonnet", (m as any).usage);
      const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      const list: any[] = Array.isArray(parsed.candidates) ? parsed.candidates : [];
      return list
        .filter((c) => c && typeof c.text === "string" && c.text.trim().length > 10)
        .map((c) => ({
          theme: String(c.theme || "growth").slice(0, 20),
          text: String(c.text).trim().slice(0, 300),
          reason: String(c.reason || "").slice(0, 500),
          replaces: String(c.replaces || "").slice(0, 300),
        }))
        .slice(0, MAX_CANDIDATES);
    } catch (e) {
      if (model === models[models.length - 1]) throw e;
    }
  }
  return [];
}

// ===== Прогон =====

export type CoachRun = { stats: number; strong: number; weak: number; proposed: number; sent: boolean; note?: string };

export async function runQuestionCoach(days = 60): Promise<CoachRun> {
  const all = await questionStats(days);
  const enough = all.filter((s) => s.sent >= MIN_SENT);

  // Пока данных мало — молчим и честно говорим, чего ждём. Предлагать правки по
  // трём показам было бы не улучшением, а угадыванием.
  if (enough.length < 3) {
    return { stats: all.length, strong: 0, weak: 0, proposed: 0, sent: false,
      note: `мало данных: вопросов с ${MIN_SENT}+ показами — ${enough.length}` };
  }

  const avgRate = enough.reduce((a, s) => a + s.rate, 0) / enough.length;
  const strong = enough.filter((s) => s.rate >= avgRate).slice(0, 12);
  const weak = enough.filter((s) => s.rate < avgRate).sort((a, b) => a.rate - b.rate).slice(0, 12);

  const fmt = (s: QStat) => `— «${s.question}»\n  отвечают ${Math.round(s.rate * 100)}% (${s.answered} из ${s.sent}), средний ответ ${s.avgLen} симв.`;
  const prompt = [
    `Средний отклик по всем вопросам: ${Math.round(avgRate * 100)}%.`,
    `РАБОТАЮТ ЛУЧШЕ СРЕДНЕГО:\n${strong.map(fmt).join("\n")}`,
    `РАБОТАЮТ ХУЖЕ СРЕДНЕГО:\n${weak.map(fmt).join("\n")}`,
    `Перепиши слабые и предложи новые в духе сильных.`,
  ].join("\n\n");

  const candidates = await ask(prompt);

  // Кладём в очередь на одобрение. Дубли отсекаем: агент бегает каждую неделю,
  // а нерассмотренное предложение живёт, пока владелец до него не дошёл.
  let proposed = 0;
  try {
    const db = supabaseAdmin();
    const { data: pending } = await db.from("question_candidates").select("text").eq("status", "pending").limit(200);
    const seen = new Set(((pending as any[]) || []).map((r) => String(r.text).toLowerCase().trim()));
    for (const c of candidates) {
      if (seen.has(c.text.toLowerCase().trim())) continue;
      const { error } = await db.from("question_candidates").insert({
        theme: c.theme, text: c.text, reason: c.reason, replaces: c.replaces || null,
        stats: { avgRate: Math.round(avgRate * 100), basedOn: enough.length, days },
      });
      if (!error) { proposed++; seen.add(c.text.toLowerCase().trim()); }
    }
  } catch { /* нет таблицы — предложения просто не сохранятся */ }

  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  let sent = false;
  if (owner && proposed) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const best = strong[0], worst = weak[0];
    const lines = [
      `✍️ <b>Разбор вопросов за ${days} дн.</b>`,
      `Средний отклик: ${Math.round(avgRate * 100)}%. Вопросов с надёжной статистикой: ${enough.length}.`,
      best ? `\n🏆 Лучший: «${esc(best.question)}» — ${Math.round(best.rate * 100)}%, ответы по ${best.avgLen} симв.` : "",
      worst ? `🥀 Худший: «${esc(worst.question)}» — ${Math.round(worst.rate * 100)}%.` : "",
      `\n📝 Новых предложений: <b>${proposed}</b>. Одобрить или отклонить — на странице «Вопросы» в админке.`,
    ].filter(Boolean);
    await sendMessage(owner, lines.join("\n"));
    sent = true;
  }

  return { stats: all.length, strong: strong.length, weak: weak.length, proposed, sent };
}

// ===== Одобрение владельцем =====

export async function approveCandidate(id: string, lang = "ru"): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db.from("question_candidates").select("theme, text").eq("id", id).maybeSingle();
  if (!data) return false;
  const { error } = await db.from("question_bank").insert({
    lang, theme: (data as any).theme, text: (data as any).text, source: "agent", active: true,
  });
  if (error) return false;
  await db.from("question_candidates").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
  return true;
}

export async function rejectCandidate(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("question_candidates")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
