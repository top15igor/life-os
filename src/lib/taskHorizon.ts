// ============================================================
//  Горизонты задач: «Сегодня / Неделя / Месяц».
//  Задачи извлекаются из дневника автоматически и не имеют срока.
//  Горизонт присваивает AI по смыслу (разовое/срочное → сегодня,
//  привычки и «на неделе» → неделя, крупное/долгое → месяц),
//  а пользователь может переместить вручную. Хранится в morning_prefs
//  (jsonb на users) как taskHorizons: { [taskId]: horizon } — без миграций.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { normalizeMorningPrefs } from "./morningPrefs";

export type Horizon = "today" | "week" | "month";
export const HORIZONS: Horizon[] = ["today", "week", "month"];

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function readPrefs(userId: string): Promise<any> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    return normalizeMorningPrefs((data as any)?.morning_prefs);
  } catch {
    return normalizeMorningPrefs(null);
  }
}

async function writePrefs(userId: string, prefs: any): Promise<void> {
  try {
    await supabaseAdmin().from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch { /* нет колонки — мягкая деградация */ }
}

// Текущая карта горизонтов пользователя.
export async function getHorizons(userId: string): Promise<Record<string, Horizon>> {
  const prefs = await readPrefs(userId);
  return { ...(prefs.taskHorizons || {}) };
}

// Переместить одну задачу в другой горизонт (ручное действие пользователя).
export async function setHorizon(userId: string, taskId: string, horizon: Horizon): Promise<void> {
  if (!HORIZONS.includes(horizon)) return;
  const prefs = await readPrefs(userId);
  const map = { ...(prefs.taskHorizons || {}) };
  map[taskId] = horizon;
  await writePrefs(userId, { ...prefs, taskHorizons: map });
}

// AI-раскладка списка задач по горизонтам. Возвращает массив, выровненный по входу.
async function classifyAI(tasks: { text: string }[]): Promise<Horizon[]> {
  const list = tasks.map((t, i) => `${i + 1}. ${t.text}`).join("\n");
  const prompt = `Ты помогаешь разложить личные задачи по трём горизонтам планирования:
- "today" — срочное, разовое, «на сегодня/завтра», то, что логично сделать прямо сейчас;
- "week" — на этой неделе: привычки и регулярные действия (спорт, прогулки, режим), задачи со сроком в днях;
- "month" — крупное, долгое, «постепенно», проекты, цели на месяц и дальше.

Задачи:
${list}

Ответь СТРОГО валидным JSON-массивом из ${tasks.length} строк, по одной на каждую задачу в том же порядке, каждая — одно из: "today", "week", "month". Без пояснений, только массив.`;
  try {
    const m = await client().messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 800, temperature: 0.2, messages: [{ role: "user", content: prompt }] });
    const raw = m.content.map((c: any) => (c.type === "text" ? c.text : "")).join("").trim();
    const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return tasks.map((_, i) => (HORIZONS.includes(arr[i]) ? arr[i] : "week"));
  } catch { /* падаем на дефолт ниже */ }
  return tasks.map(() => "week");
}

// Убедиться, что у всех задач есть горизонт: недостающие раскидывает AI и кэширует.
// Возвращает полную карта id→horizon для переданных задач.
export async function ensureHorizons(userId: string, tasks: { id: string; text: string }[]): Promise<Record<string, Horizon>> {
  const prefs = await readPrefs(userId);
  const map: Record<string, Horizon> = { ...(prefs.taskHorizons || {}) };
  const missing = tasks.filter((t) => !map[t.id]);
  if (missing.length) {
    const buckets = await classifyAI(missing);
    missing.forEach((t, i) => { map[t.id] = buckets[i] || "week"; });
    // подчищаем горизонты задач, которых уже нет среди открытых (чтобы jsonb не рос вечно)
    const alive = new Set(tasks.map((t) => t.id));
    const trimmed: Record<string, Horizon> = {};
    for (const [id, h] of Object.entries(map)) if (alive.has(id)) trimmed[id] = h;
    await writePrefs(userId, { ...prefs, taskHorizons: trimmed });
    return trimmed;
  }
  return map;
}

// Разложить задачи по трём корзинам согласно карте (недостающие → week).
export function bucketize<T extends { id: string }>(tasks: T[], map: Record<string, Horizon>): Record<Horizon, T[]> {
  const out: Record<Horizon, T[]> = { today: [], week: [], month: [] };
  for (const t of tasks) out[map[t.id] || "week"].push(t);
  return out;
}
