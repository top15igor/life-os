import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

// Склейка одинакового: «Женя», «Евгения» и «жена» — один человек.
//
// Объединять людей и места руками приложение умело и раньше. Не хватало
// главного: заметить, что дубли ВООБЩЕ есть. Человек не ходит по списку людей
// с ревизией — он просто однажды видит, что про жену есть три карточки, и
// перестаёт доверять разделу целиком.
//
// Ищем в два прохода. Сначала дешёвый и точный: одинаковые после огрубления
// («Женя» и «женя», «Одесса» и «Одеса»). Потом умный: имена отдаёт модели —
// только СПИСОК ИМЁН, без единой строчки дневника, — и она группирует
// уменьшительные и полные формы, которые буквами не совпадают никак.

// Кусочек записи, где это имя встречается. Без него решение принять нельзя:
// «Коля» и «Коля Яровенко» — это один человек или два? Ответ не в имени, а в
// том, что про них написано. Показываем ровно столько, чтобы вспомнить.
export type Mention = { date: string; text: string };

export type Ent = { id: number; name: string; count: number; mentions: Mention[] };

export type DupGroup = {
  kind: "people" | "places";
  // кого оставляем — тот, кто чаще встречается в записях
  keep: Ent;
  merge: Ent[];
  // почему считаем дублями — человеку это важно, он принимает решение
  why: "same" | "similar";
};

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "")
    .trim();

const CFG = {
  people: { table: "people", link: "entry_people", fk: "person_id" },
  places: { table: "places", link: "entry_places", fk: "place_id" },
} as const;

type Row = { id: number; name: string; count: number; mentions: Mention[] };

async function loadRows(userId: string, kind: "people" | "places"): Promise<Row[]> {
  const c = CFG[kind];
  const db = supabaseAdmin();
  const { data } = await db.from(c.table).select("id, name").eq("user_id", userId).limit(400);
  const rows = ((data as any[]) || []).filter((r) => String(r.name || "").trim());
  if (!rows.length) return [];
  // Сколько раз встречается — по этому выбираем, какую карточку оставить.
  const counts = new Map<number, number>();
  try {
    const { data: links } = await db.from(c.link).select(c.fk).in(c.fk, rows.map((r) => r.id)).limit(5000);
    for (const l of (links as any[]) || []) {
      const id = Number((l as any)[c.fk]);
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  } catch {
    /* связей может не быть — тогда все по нулям, порядок решит длина имени */
  }
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name), count: counts.get(Number(r.id)) || 0, mentions: [] }));
}

// Подтянуть по паре записей на каждое имя — только для тех, кто попал в
// группы. Тянуть на всех подряд незачем: людей могут быть сотни.
async function addMentions(kind: "people" | "places", ids: number[]): Promise<Map<number, Mention[]>> {
  const c = CFG[kind];
  const out = new Map<number, Mention[]>();
  if (!ids.length) return out;
  try {
    const { data } = await supabaseAdmin()
      .from(c.link)
      .select(`${c.fk}, entries ( entry_date, summary, raw_text )`)
      .in(c.fk, ids)
      .limit(400);
    const rows = ((data as any[]) || [])
      .map((l) => ({ id: Number(l[c.fk]), e: l.entries }))
      .filter((x) => x.e)
      .sort((a, b) => String(b.e.entry_date || "").localeCompare(String(a.e.entry_date || "")));
    for (const r of rows) {
      const list = out.get(r.id) || [];
      if (list.length >= 2) continue;
      const text = String(r.e.raw_text || r.e.summary || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      list.push({ date: String(r.e.entry_date || "").slice(0, 10), text: text.slice(0, 160) });
      out.set(r.id, list);
    }
  } catch {
    /* связей нет — карточки просто останутся без цитат */
  }
  return out;
}

// Кого оставить.
//
// Обычно — того, у кого больше записей. Но если разница в одну-две записи,
// решает полнота имени: «Игрь» с одним упоминанием не должен побеждать
// «Игоря Михайловича» — останется исковерканное голосом написание, и человек
// будет всю жизнь видеть его в разделе «Люди».
function pickKeep(group: Row[]): { keep: Row; merge: Row[] } {
  const sorted = [...group].sort((a, b) => {
    if (Math.abs(a.count - b.count) <= 2) return b.name.length - a.name.length;
    return b.count - a.count;
  });
  return { keep: sorted[0], merge: sorted.slice(1) };
}

// ===== Проход 1: одинаковые после огрубления =====

function exactGroups(rows: Row[]): Row[][] {
  const by = new Map<string, Row[]>();
  for (const r of rows) {
    const k = norm(r.name);
    if (!k) continue;
    (by.get(k) || by.set(k, []).get(k)!).push(r);
  }
  return [...by.values()].filter((g) => g.length > 1);
}

// ===== Проход 2: разные слова, один человек =====

const SYS = `Тебе дают список имён из личного дневника одного человека. Найди среди них те, что означают ОДНО И ТО ЖЕ.

Что объединять:
— уменьшительные и полные формы одного имени: Женя / Евгения, Вова / Владимир / Вовчик, Саша / Александр;
— имя и роль одного и того же близкого, если это очевидно из списка: «жена» рядом с женским именем, «мама» рядом с именем матери;
— написания одного города или места на разных языках: Одесса / Одеса, Lisbon / Лиссабон.

Что НЕ объединять:
— разных людей с похожими именами (Анна и Анна Петровна могут быть разными — объединяй только при явном совпадении);
— роль без явной пары: «мама» само по себе не объединяется ни с чем;
— однофамильцев и тёзок.

Лучше пропустить сомнительное, чем склеить двух разных людей: склейку человеку потом не разобрать.`;

const TOOL: Anthropic.Tool = {
  name: "groups",
  description: "Группы имён, означающих одно и то же.",
  input_schema: {
    type: "object",
    properties: {
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: { names: { type: "array", items: { type: "string" }, description: "имена из списка, дословно" } },
          required: ["names"],
        },
      },
    },
    required: ["groups"],
  },
};

// Умный проход стоит вызова модели, а страницу открывают часто. Пока список
// имён не изменился, ответ тот же — держим его в памяти. Заодно уходит
// неприятность: без кэша модель на каждом заходе группировала чуть иначе,
// и список дублей «дрожал» у человека на глазах.
const cache = new Map<string, { key: string; at: number; groups: string[][] }>();
const CACHE_MS = 60 * 60 * 1000;

async function smartGroups(userId: string, kind: "people" | "places", rows: Row[], already: Set<number>): Promise<Row[][]> {
  const pool = rows.filter((r) => !already.has(r.id));
  if (pool.length < 2 || !process.env.ANTHROPIC_API_KEY) return [];

  const byName = new Map(pool.map((r) => [norm(r.name), r]));
  const key = pool.map((r) => norm(r.name)).sort().join("|");
  // Ячейка своя у людей и у мест: иначе они затирают друг друга и кэш
  // не срабатывает никогда.
  const cacheKey = `${userId}:${kind}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.key === key && Date.now() - hit.at < CACHE_MS) {
    return hit.groups
      .map((names) => names.map((n) => byName.get(n)).filter(Boolean) as Row[])
      .filter((g) => g.length > 1);
  }

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      temperature: 0,
      system: SYS,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "groups" },
      messages: [{ role: "user", content: pool.map((r) => r.name).join("\n") }],
    });
    logClaude(userId, "dedupe", "haiku", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const raw = (block && block.type === "tool_use" ? (block.input as any)?.groups : []) || [];
    const out: Row[][] = [];
    for (const g of raw) {
      const names: string[] = Array.isArray(g?.names) ? g.names : [];
      const found = names.map((n) => byName.get(norm(String(n)))).filter(Boolean) as Row[];
      const uniq = [...new Map(found.map((r) => [r.id, r])).values()];
      if (uniq.length > 1) out.push(uniq);
    }
    cache.set(cacheKey, { key, at: Date.now(), groups: out.map((g) => g.map((r) => norm(r.name))) });
    return out;
  } catch {
    return [];
  }
}

// ===== Всё вместе =====

export async function findDuplicates(userId: string, kind: "people" | "places"): Promise<DupGroup[]> {
  const rows = await loadRows(userId, kind);
  if (rows.length < 2) return [];

  const groups: DupGroup[] = [];
  const used = new Set<number>();

  for (const g of exactGroups(rows)) {
    const { keep, merge } = pickKeep(g);
    groups.push({ kind, keep, merge, why: "same" });
    g.forEach((r) => used.add(r.id));
  }

  for (const g of await smartGroups(userId, kind, rows, used)) {
    const fresh = g.filter((r) => !used.has(r.id));
    if (fresh.length < 2) continue;
    const { keep, merge } = pickKeep(fresh);
    groups.push({ kind, keep, merge, why: "similar" });
    fresh.forEach((r) => used.add(r.id));
  }

  // Сначала точные совпадения, потом догадки: очевидное решается не думая.
  const top = groups.sort((a, b) => (a.why === b.why ? 0 : a.why === "same" ? -1 : 1)).slice(0, 12);

  // И только теперь — цитаты, ровно для тех, кто остался на экране.
  const ids = top.flatMap((g) => [g.keep.id, ...g.merge.map((m) => m.id)]);
  const mentions = await addMentions(kind, ids);
  for (const g of top) {
    g.keep.mentions = mentions.get(g.keep.id) || [];
    for (const m of g.merge) m.mentions = mentions.get(m.id) || [];
  }
  return top;
}

// Объединение. Записи переезжают на оставшуюся карточку, лишние исчезают.
export async function mergeEntities(userId: string, kind: "people" | "places", keepId: number, mergeIds: number[]): Promise<boolean> {
  const c = CFG[kind];
  const db = supabaseAdmin();
  try {
    const { data: keep } = await db.from(c.table).select("id").eq("id", keepId).eq("user_id", userId).maybeSingle();
    if (!keep) return false;
    for (const id of mergeIds) {
      if (!id || id === keepId) continue;
      const { data: own } = await db.from(c.table).select("id").eq("id", id).eq("user_id", userId).maybeSingle();
      if (!own) continue;
      const { data: links } = await db.from(c.link).select("entry_id").eq(c.fk, id);
      const rows = ((links as any[]) || []).map((l) => ({ entry_id: l.entry_id, [c.fk]: keepId }));
      if (rows.length) await db.from(c.link).upsert(rows, { onConflict: `entry_id,${c.fk}`, ignoreDuplicates: true });
      await db.from(c.link).delete().eq(c.fk, id);
      await db.from(c.table).delete().eq("id", id).eq("user_id", userId);
    }
    return true;
  } catch {
    return false;
  }
}
