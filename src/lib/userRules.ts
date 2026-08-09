import { supabaseAdmin } from "./supabaseAdmin";

// Правила «если — то»: «запомни, как со мной работать».
//
// Расписание бот менять умеет, категории документов после поправки запоминает.
// Но общего механизма не было: «когда я пишу про тренировку — веди в проект
// Спорт», «трату без валюты считай в евро», «не спрашивай меня про работу» —
// на всё это агент отвечал «запомнил» и ничего не менял. Обещание, которое не
// выполняется, хуже честного отказа.
//
// Правило — это одна фраза человека, которая подмешивается в разбор каждой
// новой записи. Никакого своего языка условий: то, что человек сказал своими
// словами, понятнее и ему, и модели.

export type UserRule = { id: string; text: string; at: number };

const MAX = 20;

async function prefsOf(userId: string): Promise<any> {
  const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
  return { ...((data as any)?.morning_prefs || {}) };
}

export async function listRules(userId: string): Promise<UserRule[]> {
  try {
    const prefs = await prefsOf(userId);
    return (prefs.userRules || []) as UserRule[];
  } catch {
    return [];
  }
}

export async function addRule(userId: string, text: string): Promise<UserRule | null> {
  const t = (text || "").trim().slice(0, 200);
  if (!t) return null;
  try {
    const db = supabaseAdmin();
    const prefs = await prefsOf(userId);
    const list: UserRule[] = prefs.userRules || [];
    // Похожее правило не плодим: человек часто повторяет просьбу теми же словами.
    const same = list.find((r) => r.text.toLowerCase() === t.toLowerCase());
    if (same) return same;
    const rule: UserRule = { id: `r${Date.now().toString(36)}`, text: t, at: Date.now() };
    prefs.userRules = [rule, ...list].slice(0, MAX);
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
    return rule;
  } catch {
    return null;
  }
}

export async function dropRule(userId: string, idOrText: string): Promise<UserRule | null> {
  const q = (idOrText || "").trim().toLowerCase();
  if (!q) return null;
  try {
    const db = supabaseAdmin();
    const prefs = await prefsOf(userId);
    const list: UserRule[] = prefs.userRules || [];
    const victim = list.find((r) => r.id.toLowerCase() === q) || list.find((r) => r.text.toLowerCase().includes(q));
    if (!victim) return null;
    prefs.userRules = list.filter((r) => r.id !== victim.id);
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
    return victim;
  } catch {
    return null;
  }
}

// Блок для разбора новой записи. Пусто — значит правил нет, и лишнего
// заголовка в подсказке тоже быть не должно.
export async function rulesForAnalysis(userId: string): Promise<string> {
  const list = await listRules(userId);
  if (!list.length) return "";
  const body = list.map((r, i) => `${i + 1}. ${r.text}`).join("\n");
  return `\n\nПРАВИЛА ЭТОГО ЧЕЛОВЕКА (он сам их установил, выполняй их при разборе):\n${body}`;
}
