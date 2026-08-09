import { supabaseAdmin } from "./supabaseAdmin";
import { indexRow } from "./vaultIndex";

// Полка «Разобрать» — место, где шкаф честно показывает, где он сомневался.
//
// Агент раскладывает вещи сам и иногда ошибается. До этого ошибка просто
// уезжала на полку молча: человек узнавал о ней через полгода, когда не мог
// что-то найти. Спрашивать в момент записи мы не хотим — это возвращает тот
// самый ступор, от которого уходили. Поэтому сомнения копятся и разбираются
// пачкой, когда человеку удобно: пять-семь карточек, по одному нажатию.
//
// И главное: поправка становится ПРАВИЛОМ. Поправил один раз «чеки — в
// документы, а не в моменты» — агент больше так не делает.

export type SortItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  folder: string | null;
  image_url: string | null;
  file_url: string | null;
  created_at: string;
  // Почему вещь попала на разбор — человеку это важнее, чем нам.
  why: "unsure" | "unknown" | "empty";
};

const SEL = "id, title, summary, category, folder, mem_date, image_url, file_url, status, created_at";

// Что считается «шкаф не уверен».
//
// Три разных случая, и все три стоит разобрать:
//   unsure  — разбор сам сказал, что не уверен;
//   unknown — не смог отнести никуда, свалил в «Другое»;
//   empty   — не вытащил ни сути, ни данных, то есть по сути не понял.
function whyOf(m: any): SortItem["why"] | null {
  if (m.status === "review") return "unsure";
  if (m.category === "other") return "unknown";
  const noSummary = !String(m.summary || "").trim();
  const noFields = !Array.isArray(m.fields) || !m.fields.length;
  if (noSummary && noFields) return "empty";
  return null;
}

export async function listToSort(userId: string, limit = 12): Promise<SortItem[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("memories")
      .select(SEL + ", fields")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300);
    const out: SortItem[] = [];
    for (const m of (data as any[]) || []) {
      const why = whyOf(m);
      if (!why) continue;
      out.push({
        id: String(m.id),
        title: String(m.title || ""),
        summary: String(m.summary || ""),
        category: String(m.category || "other"),
        folder: m.folder || null,
        image_url: m.image_url || null,
        file_url: m.file_url || null,
        created_at: String(m.created_at || ""),
        why,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

// Сколько всего ждёт разбора — для значка в меню.
export async function countToSort(userId: string): Promise<number> {
  const items = await listToSort(userId, 99);
  return items.length;
}

// ===== Разбор =====

// «Всё верно» — вещь остаётся как есть, просто снимаем с разбора.
export async function keepAsIs(userId: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from("memories").update({ status: "ok" }).eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

// Поправка категории. Заодно записываем правило: то, ради чего это всё.
export async function fixCategory(userId: string, id: string, category: string): Promise<boolean> {
  const db = supabaseAdmin();
  try {
    const { data: before } = await db.from("memories").select("title, category").eq("id", id).eq("user_id", userId).maybeSingle();
    const { error } = await db.from("memories").update({ category, status: "ok" }).eq("id", id).eq("user_id", userId);
    if (error) return false;
    await rememberRule(userId, String((before as any)?.title || ""), String((before as any)?.category || ""), category);
    // Категория входит в текст для вектора — переиндексируем, иначе поиск
    // будет помнить вещь по-старому.
    await indexRow("memories", id, userId);
    return true;
  } catch {
    return false;
  }
}

// ===== Правила =====

// Правило пишем от НАЗВАНИЯ вещи: «Чек из кафе…» → «чек». Это грубо, зато
// понятно человеку, если он захочет посмотреть, чему шкаф научился.
function subjectOf(title: string): string {
  const t = (title || "").trim().toLowerCase();
  const first = t.split(/[\s,—–-]+/).filter(Boolean).slice(0, 2).join(" ");
  return (first || t).slice(0, 60);
}

export async function rememberRule(userId: string, title: string, was: string, shouldBe: string): Promise<void> {
  const subject = subjectOf(title);
  if (!subject || was === shouldBe) return;
  const db = supabaseAdmin();
  try {
    const { data: same } = await db
      .from("sort_rules")
      .select("id, times")
      .eq("user_id", userId)
      .eq("kind", "category")
      .eq("subject", subject)
      .eq("should_be", shouldBe)
      .maybeSingle();
    if (same) {
      await db.from("sort_rules").update({ times: (Number((same as any).times) || 1) + 1, updated_at: new Date().toISOString() }).eq("id", (same as any).id);
      return;
    }
    await db.from("sort_rules").insert({ user_id: userId, kind: "category", subject, was: was || null, should_be: shouldBe });
  } catch {
    // таблицы ещё нет — поправка всё равно применилась, просто не запомнилась
  }
}

// Правила человека компактной строкой. Их подмешивают ДВАЖДЫ: в текст задания
// и в описание самого поля «категория». Второе решает: проверено вживую, что
// одного упоминания в задании мало — жёсткая инструкция в схеме («чек →
// документ») перебивает его, и поправка человека остаётся без последствий.
export async function rulesHint(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("sort_rules")
      .select("subject, should_be, times")
      .eq("user_id", userId)
      .eq("kind", "category")
      .order("updated_at", { ascending: false })
      .limit(12);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    return rows.map((r) => `«${r.subject}» → ${r.should_be}`).join("; ");
  } catch {
    return "";
  }
}

// Кусок для текста задания.
export function rulesBlock(list: string): string {
  if (!list) return "";
  return `\n\nЛИЧНЫЕ ПРАВИЛА ЭТОГО ЧЕЛОВЕКА (он сам их установил, поправив тебя раньше): ${list}. Они ВАЖНЕЕ общих правил категорий. Если новая вещь похожа на одну из них — ставь ту категорию, которую он выбрал, даже если по общему правилу вышло бы иначе.`;
}

export async function listRules(userId: string): Promise<{ id: string; subject: string; should_be: string; times: number }[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("sort_rules")
      .select("id, subject, should_be, times")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function forgetRule(userId: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from("sort_rules").delete().eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}
