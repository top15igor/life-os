import { supabaseAdmin } from "./supabaseAdmin";

// Память разговора: что бот только что показал или создал.
//
// Зачем: человек говорит «убери второй», «а это в здоровье», «перенеси его на
// завтра» — и роутер не понимает, о чём речь. До сих пор он видел только
// последнюю реплику бота текстом; из фразы «Нашёл несколько похожих» невозможно
// достать, ЧТО именно было в списке.
//
// Здесь мы запоминаем сами объекты — тип, название и место в списке, — и отдаём
// их роутеру отдельным блоком. Он подставляет в команду нормальный текст вместо
// «второй», и дальше всё работает обычным путём.
//
// Живёт два часа: «это» через день относится уже к другому.

const FOCUS_TTL_MS = 2 * 3600_000;
const FOCUS_MAX = 6;

export type FocusItem = { kind: string; label: string; id?: string | null };

type Stored = { items: FocusItem[]; at: string };

export async function rememberFocus(userId: string, items: FocusItem[]): Promise<void> {
  const clean = (items || [])
    .filter((i) => i && i.label && String(i.label).trim())
    .slice(0, FOCUS_MAX)
    .map((i) => ({ kind: String(i.kind || "").slice(0, 20), label: String(i.label).trim().slice(0, 120), id: i.id ?? null }));
  if (!clean.length) return;
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    prefs.focus = { items: clean, at: new Date().toISOString() } as Stored;
    await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
  } catch { /* не записалось — просто останемся без контекста */ }
}

export async function getFocus(userId: string): Promise<FocusItem[]> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const f: Stored | undefined = (data as any)?.morning_prefs?.focus;
    if (!f?.items?.length) return [];
    const at = Date.parse(f.at || "");
    if (!Number.isNaN(at) && Date.now() - at > FOCUS_TTL_MS) return [];
    return f.items;
  } catch {
    return [];
  }
}

const KIND_RU: Record<string, string> = {
  entry: "запись дневника",
  note: "заметка",
  task: "задача",
  goal: "цель",
  reminder: "напоминание",
  finance: "трата",
  found: "найденный материал",
};

// Блок для роутера. Нумерация обязательна: именно по ней разбираются «первый»,
// «второй», «последний».
export async function focusLine(userId: string): Promise<string> {
  const items = await getFocus(userId);
  if (!items.length) return "";
  const lines = items.map((i, n) => `${n + 1}) ${KIND_RU[i.kind] || i.kind}: «${i.label}»`);
  return [
    "ОБЪЕКТЫ, О КОТОРЫХ ТОЛЬКО ЧТО ШЛА РЕЧЬ (по ним разбирай отсылки «это», «его», «второй», «последний»):",
    ...lines,
    "Если человек ссылается на один из них — подставь в параметры команды его НАЗВАНИЕ, а не слово «это».",
  ].join("\n");
}
