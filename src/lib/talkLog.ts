import { supabaseAdmin } from "./supabaseAdmin";

// Общая память разговора — одна на все режимы.
//
// До этого память была лоскутной: у AI-друга своя, у «спроси свою жизнь» —
// последние шесть вопросов, у остального — только предыдущая реплика бота. И
// человек это чувствовал: рассказал что-то боту, через минуту спросил «а что я
// про это говорил» — и получал ответ так, будто разговора не было.
//
// Здесь мы держим один непрерывный журнал: что человек сказал и что бот
// ответил, в любом режиме. Он ложится в подсказку каждого думающего ответа —
// поэтому агент всегда в контексте того, о чём вы только что говорили.

export type Turn = { r: "u" | "a"; t: string; at: number };

// Сколько помним. Двадцати реплик хватает на связный разговор; больше — это
// уже не «о чём мы говорили», а история, для которой есть дневник и поиск.
const MAX = 20;
const KEEP_MS = 12 * 3600_000;

async function prefsOf(userId: string): Promise<any> {
  const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
  return { ...((data as any)?.morning_prefs || {}) };
}

export async function remember(userId: string, role: "u" | "a", text: string): Promise<void> {
  const t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 700);
  if (!userId || !t) return;
  try {
    const db = supabaseAdmin();
    const p = await prefsOf(userId);
    const list: Turn[] = Array.isArray(p.talk) ? p.talk : [];
    const now = Date.now();
    p.talk = [...list.filter((x) => now - Number(x.at || 0) < KEEP_MS), { r: role, t, at: now }].slice(-MAX);
    await db.from("users").update({ morning_prefs: p }).eq("id", userId);
  } catch {
    // без журнала бот просто менее памятлив — ломать разговор из-за этого нельзя
  }
}

export async function recentTalk(userId: string, limit = MAX): Promise<Turn[]> {
  try {
    const list: Turn[] = (await prefsOf(userId)).talk || [];
    const now = Date.now();
    return list.filter((x) => now - Number(x.at || 0) < KEEP_MS).slice(-limit);
  } catch {
    return [];
  }
}

// Готовый кусок для подсказки. Пусто — значит разговора не было, и лишнего
// заголовка быть не должно.
export async function talkBlock(userId: string, limit = 12): Promise<string> {
  const list = await recentTalk(userId, limit);
  if (!list.length) return "";
  const lines = list.map((x) => `${x.r === "u" ? "Человек" : "Ты"}: ${x.t}`).join("\n");
  return `\n\nО ЧЁМ ВЫ ТОЛЬКО ЧТО ГОВОРИЛИ (последнее внизу, это ВАЖНЕЕ старых записей — на «а что я про это говорил» отвечай отсюда):\n${lines}`;
}
