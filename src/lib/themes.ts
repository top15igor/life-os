import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";

// Ретро-структура: шкаф замечает, что сорок записей за полгода — одна тема.
//
// Порядок в дневнике появляется задним числом. В момент записи «ездил за
// плиткой» — это просто вечер вторника; и только через полгода видно, что
// это был ремонт, и что про него набралось сорок записей, разбросанных по
// всей ленте. Человек сам такое не замечает: он живёт вперёд, а не назад.
//
// Ищем по ТЕГАМ, которые разбор и так проставляет каждой записи. Это дешёво,
// не требует ни новых данных, ни перемалывания всего дневника моделью: тег,
// встретившийся у десятка записей за полгода, — уже кандидат. Модель нужна
// только чтобы отсеять мусорные («мысли», «день») и дать теме человеческое
// имя.

export type Theme = {
  tagId: number;
  tag: string;
  title: string;
  why: string;
  count: number;
  first: string;
  last: string;
  samples: string[];
};

const MIN_ENTRIES = 6; // реже — это ещё не тема, а совпадение
const MONTHS = 12;

const norm = (s: string) => (s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-яіїєґ0-9]+/gi, "");

// Отброшенные предложения храним в общих настройках — ради одной строчки
// заводить таблицу не стоит.
async function dismissed(userId: string): Promise<Set<number>> {
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const list = ((data as any)?.morning_prefs?.themesDismissed || []) as any[];
    return new Set(list.map((x) => Number(x)).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function dismissTheme(userId: string, tagId: number): Promise<boolean> {
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("morning_prefs").eq("id", userId).maybeSingle();
    const prefs: any = { ...((data as any)?.morning_prefs || {}) };
    const list = new Set<number>((prefs.themesDismissed || []).map((x: any) => Number(x)).filter(Boolean));
    list.add(Number(tagId));
    prefs.themesDismissed = [...list].slice(-200);
    const { error } = await db.from("users").update({ morning_prefs: prefs }).eq("id", userId);
    return !error;
  } catch {
    return false;
  }
}

// ===== Кандидаты =====

type Cand = { tagId: number; tag: string; entries: { id: string; date: string; text: string }[] };

async function candidates(userId: string): Promise<Cand[]> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - MONTHS * 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // Записи за период — сразу с тегами и текстом, одним запросом.
  const { data } = await db
    .from("entries")
    .select("id, entry_date, summary, raw_text, entry_tags ( tags ( id, name ) )")
    .eq("user_id", userId)
    .gte("entry_date", since)
    .order("entry_date", { ascending: false })
    .limit(1200);

  const by = new Map<number, Cand>();
  for (const e of ((data as any[]) || [])) {
    const text = String(e.raw_text || e.summary || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    for (const link of e.entry_tags || []) {
      const t = link?.tags;
      if (!t?.id || !t?.name) continue;
      const id = Number(t.id);
      const c = by.get(id) || { tagId: id, tag: String(t.name), entries: [] };
      c.entries.push({ id: String(e.id), date: String(e.entry_date || "").slice(0, 10), text });
      by.set(id, c);
    }
  }
  return [...by.values()].filter((c) => c.entries.length >= MIN_ENTRIES).sort((a, b) => b.entries.length - a.entries.length);
}

// Темы, которые уже оформлены как проект, предлагать незачем.
async function existingProjects(userId: string): Promise<Set<string>> {
  try {
    const { data } = await supabaseAdmin().from("projects").select("name").eq("user_id", userId).limit(200);
    return new Set(((data as any[]) || []).map((p) => norm(String(p.name))));
  } catch {
    return new Set();
  }
}

// ===== Отбор моделью =====

const SYS = `Тебе дают темы, которые повторяются в личном дневнике человека: тег, сколько записей, за какой срок и несколько цитат.

Реши по каждой: это НАСТОЯЩАЯ тема жизни, которую стоит собрать в одно место, — или просто частое слово.

Настоящая тема: у неё есть развитие во времени и общий предмет. Ремонт, изучение языка, поиск работы, беременность, переезд, болезнь родителя, запуск проекта, подготовка к соревнованию.

НЕ тема: общие слова, которые встречаются просто потому, что человек живёт («день», «мысли», «настроение», «семья», «работа» вообще, «еда», «спорт» вообще). Если по цитатам не видно ОДНОГО сюжета — это не тема.

Для настоящих: дай человеческое название темы (как назвал бы сам человек, 1-4 слова) и одну фразу, почему это тема — со ссылкой на то, что видно в цитатах.

Лучше предложить две-три верные темы, чем десять сомнительных.`;

const TOOL: Anthropic.Tool = {
  name: "themes",
  description: "Отобранные настоящие темы.",
  input_schema: {
    type: "object",
    properties: {
      themes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tag: { type: "string", description: "тег из списка, дословно" },
            title: { type: "string", description: "человеческое название темы, 1-4 слова" },
            why: { type: "string", description: "одна фраза: почему это тема" },
          },
          required: ["tag", "title", "why"],
        },
      },
    },
    required: ["themes"],
  },
};

const cache = new Map<string, { key: string; at: number; themes: Theme[] }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function findThemes(userId: string): Promise<Theme[]> {
  const [cands, projects, skip] = await Promise.all([candidates(userId), existingProjects(userId), dismissed(userId)]);
  const pool = cands.filter((c) => !skip.has(c.tagId) && !projects.has(norm(c.tag))).slice(0, 10);
  if (!pool.length || !process.env.ANTHROPIC_API_KEY) return [];

  // Разбор всего дневника моделью — дорогая операция, а страницу открывают
  // часто. Пока набор кандидатов тот же, ответ не изменится.
  const key = pool.map((c) => `${c.tagId}:${c.entries.length}`).join("|");
  const hit = cache.get(userId);
  if (hit && hit.key === key && Date.now() - hit.at < CACHE_MS) return hit.themes;

  const brief = pool
    .map((c) => {
      const dates = c.entries.map((e) => e.date).filter(Boolean).sort();
      const quotes = c.entries.slice(0, 4).map((e) => `— ${e.text.slice(0, 160)}`).join("\n");
      return `ТЕГ: ${c.tag}\nЗаписей: ${c.entries.length}, с ${dates[0] || "?"} по ${dates[dates.length - 1] || "?"}\n${quotes}`;
    })
    .join("\n\n");

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      temperature: 0,
      system: SYS,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "themes" },
      messages: [{ role: "user", content: brief }],
    });
    logClaude(userId, "themes", "haiku", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const raw = ((block && block.type === "tool_use" ? (block.input as any)?.themes : []) || []) as any[];
    const byTag = new Map(pool.map((c) => [norm(c.tag), c]));

    const out: Theme[] = [];
    for (const t of raw) {
      const c = byTag.get(norm(String(t?.tag || "")));
      if (!c) continue;
      const dates = c.entries.map((e) => e.date).filter(Boolean).sort();
      out.push({
        tagId: c.tagId,
        tag: c.tag,
        title: String(t.title || c.tag).slice(0, 60),
        why: String(t.why || "").slice(0, 200),
        count: c.entries.length,
        first: dates[0] || "",
        last: dates[dates.length - 1] || "",
        samples: c.entries.slice(0, 3).map((e) => e.text.slice(0, 140)),
      });
    }
    const themes = out.slice(0, 5);
    cache.set(userId, { key, at: Date.now(), themes });
    return themes;
  } catch {
    return [];
  }
}

// ===== Собрать тему в проект =====

// Создаём проект и переносим в него все записи с этим тегом. Записи остаются
// на своих местах — просто у них появляется общая нить.
export async function makeProject(userId: string, tagId: number, title: string): Promise<{ ok: boolean; linked: number }> {
  const db = supabaseAdmin();
  const name = (title || "").trim().slice(0, 80);
  if (!name || !tagId) return { ok: false, linked: 0 };
  try {
    let projectId: number | null = null;
    const { data: ex } = await db.from("projects").select("id").eq("user_id", userId).ilike("name", name).maybeSingle();
    if (ex) projectId = Number((ex as any).id);
    else {
      const { data: created, error } = await db.from("projects").insert({ user_id: userId, name, status: "active" }).select("id").single();
      if (error || !created) return { ok: false, linked: 0 };
      projectId = Number((created as any).id);
    }

    const { data: links } = await db.from("entry_tags").select("entry_id").eq("tag_id", tagId).limit(2000);
    const rows = ((links as any[]) || []).map((l) => ({ entry_id: l.entry_id, project_id: projectId }));
    if (rows.length) await db.from("entry_projects").upsert(rows, { onConflict: "entry_id,project_id", ignoreDuplicates: true });
    // Больше не предлагаем: тема оформлена.
    await dismissTheme(userId, tagId);
    return { ok: true, linked: rows.length };
  } catch {
    return { ok: false, linked: 0 };
  }
}
