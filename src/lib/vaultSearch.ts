import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { searchMemories } from "./semanticMemory";
import { semanticAll, type Sim } from "./vaultIndex";

// Единый поиск по всему, что человек когда-либо сложил в LIFE OS.
//
// Зачем: полок много — дневник, заметки, база знаний, документы и фото, книги.
// Человек не помнит, куда именно он это положил, и не должен помнить. Он помнит
// смысл: «где-то я записывал код от домофона», «что там было про анализы весной».
//
// Ищем ДВУМЯ способами сразу, на каждой полке:
//   по смыслу — вектор запроса против векторов строк («жильё» находит «квартиру»);
//   по буквам — огрублённые основы слов (точный номер договора, редкое имя,
//   код от домофона: там смысл не помогает, а буквальное совпадение решает).
// Оценки складываются, поэтому вещь, найденная обоими способами, всплывает выше.
// Если pgvector или ключ OpenAI не настроены, остаётся только буквенный поиск —
// ровно то, как это работало раньше.

type Src = "diary" | "note" | "knowledge" | "doc" | "book";

export type Found = { src: Src; date: string | null; title: string; text: string; score: number; path?: string;
  // Сам файл (скан, фото, PDF), если он есть: человек чаще просит документ, а не пересказ.
  fileUrl?: string | null };

// Куда ведёт источник. У записи дневника есть своя страница, у остальных полок —
// только раздел: точнее не сделать, но и это лучше, чем ничего.
export type Source = { label: string; path: string };

const SRC_LABEL: Record<Src, string> = {
  diary: "дневник",
  note: "заметки",
  knowledge: "база знаний",
  doc: "документы и фото",
  book: "книги",
};

const norm = (x: string) => (x || "").toLowerCase().replace(/ё/g, "е");

// Те же правила, что и в поиске напоминаний: короткие слова режем сильнее,
// иначе падежное окончание («воду» против «воды») убивает совпадение.
function stems(q: string): string[] {
  return norm(q)
    .split(/[^a-zа-яіїєґ0-9]+/i)
    .filter((w) => w.length >= 3)
    .map((w) => w.slice(0, w.length <= 4 ? 3 : 4));
}

function scoreOf(hay: string, st: string[]): number {
  const h = norm(hay);
  return st.filter((x) => h.includes(x)).length;
}

// Насколько «весит» смысловое совпадение рядом с буквенным. Похожесть 0..1
// превращаем в баллы того же порядка, что и совпавшие слова: близкое по
// смыслу (0.5) стоит примерно как три общих слова.
// Порог подобран по живым данным: у text-embedding-3-small случайные тексты
// дают 0.1-0.25, и с низким порогом дневник вываливал восемь «похожих» записей
// на любой вопрос, вытесняя документы. Ниже порога — это не находка, а шум.
const SIM_MIN = 0.3;
function simScore(sim: number | undefined): number {
  if (!sim || sim < SIM_MIN) return 0;
  return sim * 6;
}

// Сколько находок пускаем с одной полки. Без этого полка, где вещей на порядок
// больше (дневник), занимает всю выдачу собой — даже когда спрашивали про
// документ. Разнообразие полок здесь важнее лишней пятой записи.
const PER_SHELF = 4;
function topOf(list: Found[]): Found[] {
  return [...list].sort((a, b) => b.score - a.score).slice(0, PER_SHELF);
}

// ===== Полки =====
//
// Каждая полка возвращает всё, что нашлось хоть одним способом. Строки,
// найденные по смыслу, дочитываются отдельно по id: они могут лежать глубже,
// чем страница, которую мы просматриваем побуквенно.

async function pull(table: string, cols: string, userId: string, ids: string[], limit: number): Promise<any[]> {
  const db = supabaseAdmin();
  const [page, exact] = await Promise.all([
    db.from(table).select(cols).eq("user_id", userId).limit(limit).then((r) => (r.data as any[]) || []),
    ids.length ? db.from(table).select(cols).eq("user_id", userId).in("id", ids).then((r) => (r.data as any[]) || []) : Promise.resolve([]),
  ]);
  const byId = new Map<string, any>();
  for (const r of [...page, ...exact]) byId.set(String(r.id), r);
  return [...byId.values()];
}

async function fromNotes(userId: string, st: string[], sim: Sim): Promise<Found[]> {
  try {
    const rows = await pull("notes", "id, text, created_at", userId, [...sim.keys()], 500);
    return rows
      .map((n) => ({
        src: "note" as Src,
        date: String(n.created_at || "").slice(0, 10),
        title: "",
        text: String(n.text || ""),
        score: scoreOf(n.text || "", st) + simScore(sim.get(String(n.id))),
        path: "/notes",
      }))
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

async function fromKnowledge(userId: string, st: string[], sim: Sim): Promise<Found[]> {
  try {
    const rows = await pull("saved_items", "id, title, topic, summary, key_points, tags, created_at", userId, [...sim.keys()], 300);
    return rows
      .map((d) => {
        const hay = [d.title, d.topic, d.summary, ...(Array.isArray(d.key_points) ? d.key_points : []), ...(Array.isArray(d.tags) ? d.tags : [])].join(" ");
        return {
          src: "knowledge" as Src,
          date: String(d.created_at || "").slice(0, 10),
          title: String(d.title || ""),
          text: String(d.summary || hay).slice(0, 600),
          score: scoreOf(hay, st) + simScore(sim.get(String(d.id))),
          path: "/knowledge",
        };
      })
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

async function fromDocs(userId: string, st: string[], sim: Sim): Promise<Found[]> {
  try {
    const rows = await pull("memories", "id, title, summary, fields, mem_date, created_at, image_url", userId, [...sim.keys()], 300);
    return rows
      .map((m) => {
        const flds = Array.isArray(m.fields) ? m.fields.map((f: any) => `${f?.label ?? ""} ${f?.value ?? ""}`).join(" ") : "";
        const hay = [m.title, m.summary, flds].join(" ");
        return {
          src: "doc" as Src,
          date: String(m.mem_date || m.created_at || "").slice(0, 10),
          title: String(m.title || ""),
          text: [m.summary, flds].filter(Boolean).join(" · ").slice(0, 600),
          score: scoreOf(hay, st) + simScore(sim.get(String(m.id))),
          path: "/memory",
          fileUrl: m.image_url || null,
        };
      })
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

async function fromBooks(userId: string, st: string[], sim: Sim): Promise<Found[]> {
  try {
    const rows = await pull("books", "id, title, author, genre, review, notes, status, created_at", userId, [...sim.keys()], 300);
    return rows
      .map((b) => {
        const hay = [b.title, b.author, b.genre, b.review, b.notes].filter(Boolean).join(" ");
        return {
          src: "book" as Src,
          date: String(b.created_at || "").slice(0, 10),
          title: [b.title, b.author].filter(Boolean).join(" — "),
          text: [b.review, b.notes].filter(Boolean).join(" · ").slice(0, 600) || String(b.genre || ""),
          score: scoreOf(hay, st) + simScore(sim.get(String(b.id))),
          path: "/books",
        };
      })
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

// Дневник: сначала по смыслу, и только если pgvector не настроен — по словам.
async function fromDiary(userId: string, query: string, st: string[]): Promise<Found[]> {
  const hits = await searchMemories(userId, query, 8).catch(() => []);
  if (hits.length) {
    // Та же шкала, что и у остальных полок: раньше дневник считался по своей,
    // получал вдвое больше баллов и всегда выигрывал у документов.
    const sem = hits
      .filter((h) => h.similarity >= SIM_MIN)
      .map((h) => ({ src: "diary" as Src, date: h.entry_date, title: "", text: String(h.raw_text || h.summary || "").slice(0, 700), score: simScore(h.similarity), path: h.id ? `/entry/${h.id}` : "/diary" }));
    if (sem.length) return sem;
  }
  try {
    const { data } = await supabaseAdmin().from("entries")
      .select("id, raw_text, summary, entry_date").eq("user_id", userId)
      .order("entry_date", { ascending: false }).limit(400);
    return ((data as any[]) || [])
      .map((e) => ({ src: "diary" as Src, date: String(e.entry_date || ""), title: "", text: String(e.raw_text || e.summary || "").slice(0, 700), score: scoreOf(`${e.raw_text || ""} ${e.summary || ""}`, st), path: e.id ? `/entry/${e.id}` : "/diary" }))
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

export async function searchEverything(userId: string, query: string, limit = 12): Promise<Found[]> {
  const st = stems(query);
  if (!st.length) return [];
  // Вектор запроса считаем один раз на все полки.
  const sim = await semanticAll(userId, query, 8).catch(() => null);
  const S = (k: keyof NonNullable<typeof sim>): Sim => (sim ? sim[k] : new Map());

  const [d, n, k, m, b] = await Promise.all([
    fromDiary(userId, query, st),
    fromNotes(userId, st, S("notes")),
    fromKnowledge(userId, st, S("saved_items")),
    fromDocs(userId, st, S("memories")),
    fromBooks(userId, st, S("books")),
  ]);
  return [...topOf(d), ...topOf(n), ...topOf(k), ...topOf(m), ...topOf(b)]
    .filter((x) => x.text.trim())
    .sort((a, b2) => b2.score - a.score || String(b2.date || "").localeCompare(String(a.date || "")))
    .slice(0, limit);
}

// ===== Ответ человеку =====

const LANG: Record<string, string> = { ru: "русском", en: "English", uk: "українській", fr: "français", es: "español" };

const NOTHING: Record<string, string> = {
  ru: "Ничего не нашёл — ни в дневнике, ни в заметках, ни в базе знаний, ни в документах. Возможно, это записано другими словами: попробуй сказать иначе.",
  en: "Found nothing — not in your diary, notes, knowledge base or documents. Maybe it's worded differently: try other words.",
  uk: "Нічого не знайшов — ні в щоденнику, ні в нотатках, ні в базі знань, ні в документах. Можливо, записано іншими словами: спробуй інакше.",
  fr: "Je n'ai rien trouvé — ni dans le journal, ni dans les notes, ni dans la base, ni dans les documents. C'est peut-être formulé autrement : essaie d'autres mots.",
  es: "No encontré nada — ni en el diario, ni en las notas, ni en la base, ni en los documentos. Quizá esté con otras palabras: prueba de otra forma.",
};

const SYS = `Ты отвечаешь человеку по ЕГО СОБСТВЕННЫМ записям в LIFE OS. Тебе дают куски, найденные на разных полках: дневник, заметки, база знаний, документы и фото, книги.

ПРАВИЛА:
— Отвечай ТОЛЬКО по данным ниже. Ничего не додумывай: если ответа в них нет, так и скажи.
— Если нашлось конкретное значение (код, номер, адрес, сумма) — назови его сразу, первым делом, без предисловий.
— Указывай, ОТКУДА это: «в заметках», «в дневнике 12 мая», «в документах». Человек не помнит, куда положил, — и именно это ему полезно узнать.
— Куски найдены в том числе ПО СМЫСЛУ, поэтому среди них бывают близкие, но не про то. Молча пропускай лишнее, не пересказывай всё подряд.
— Если куски противоречат друг другу, скажи об этом и покажи оба.
— Коротко. Без markdown, списков со звёздочками и заголовков.`;

export async function answerFromEverything(userId: string, query: string, locale = "ru"): Promise<{ text: string; sources: Source[]; files: { url: string; title: string }[] }> {
  const found = await searchEverything(userId, query);
  if (!found.length) return { text: NOTHING[locale] || NOTHING.ru, sources: [], files: [] };

  // До трёх ссылок на то, откуда взят ответ: человек должен иметь возможность
  // открыть первоисточник, а не верить пересказу на слово.
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const f of found) {
    const path = f.path || "";
    if (!path || seen.has(path)) continue;
    seen.add(path);
    sources.push({ label: `${SRC_LABEL[f.src]}${f.date ? ` · ${f.date}` : ""}`, path });
    if (sources.length >= 3) break;
  }

  // Сами файлы: если нашлись документы со сканом, человеку нужен ОРИГИНАЛ,
  // а не пересказ его содержимого. Больше двух не шлём — это уже свалка.
  const files = found
    .filter((f) => f.src === "doc" && f.fileUrl)
    .slice(0, 2)
    .map((f) => ({ url: String(f.fileUrl), title: f.title || "документ" }));

  if (!process.env.ANTHROPIC_API_KEY) {
    return { text: found.slice(0, 5).map((f) => `• [${SRC_LABEL[f.src]}${f.date ? `, ${f.date}` : ""}] ${f.text.slice(0, 200)}`).join("\n"), sources, files };
  }

  const ctx = found
    .map((f) => `[${SRC_LABEL[f.src]}${f.date ? `, ${f.date}` : ""}] ${f.title ? f.title + ": " : ""}${f.text}`)
    .join("\n---\n")
    .slice(0, 12000);

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      temperature: 0.2,
      system: SYS,
      messages: [{ role: "user", content: `ВОПРОС: ${query}\n\nНАЙДЕНО У НЕГО:\n${ctx}\n\nОтветь на ${LANG[locale] || LANG.ru} языке.` }],
    });
    logClaude(userId, "vault-search", "haiku", (m as any).usage);
    const t = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
    return { text: t || (NOTHING[locale] || NOTHING.ru), sources, files };
  } catch {
    return { text: found.slice(0, 5).map((f) => `• [${SRC_LABEL[f.src]}${f.date ? `, ${f.date}` : ""}] ${f.text.slice(0, 200)}`).join("\n"), sources, files };
  }
}
