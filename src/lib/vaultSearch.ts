import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { logClaude } from "./usage";
import { searchMemories } from "./semanticMemory";

// Единый поиск по всему, что человек когда-либо сложил в LIFE OS.
//
// Зачем: полок много — дневник, заметки, база знаний, документы и фото. Человек
// не помнит, куда именно он это положил, и не должен помнить. Он помнит смысл:
// «где-то я записывал код от домофона», «что там было про анализы весной».
// До этого искать приходилось в каждом ящике отдельно, и в трёх из четырёх
// случаев поиск честно отвечал «не нашёл» — просто потому, что искал не там.
//
// Дневник ищем ПО СМЫСЛУ (эмбеддинги), остальное — по словам с огрублением
// основ: у справки формулировка обычно совпадает почти дословно, а у жизни —
// почти никогда.

type Src = "diary" | "note" | "knowledge" | "doc";

export type Found = { src: Src; date: string | null; title: string; text: string; score: number };

const SRC_LABEL: Record<Src, string> = {
  diary: "дневник",
  note: "заметки",
  knowledge: "база знаний",
  doc: "документы и фото",
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

// ===== Полки =====

async function fromNotes(userId: string, st: string[]): Promise<Found[]> {
  try {
    const { data } = await supabaseAdmin().from("notes").select("text, created_at").eq("user_id", userId).limit(500);
    return ((data as any[]) || [])
      .map((n) => ({ src: "note" as Src, date: String(n.created_at || "").slice(0, 10), title: "", text: String(n.text || ""), score: scoreOf(n.text || "", st) }))
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

async function fromKnowledge(userId: string, st: string[]): Promise<Found[]> {
  try {
    const { data } = await supabaseAdmin().from("saved_items")
      .select("title, topic, summary, key_points, tags, created_at").eq("user_id", userId).limit(300);
    return ((data as any[]) || [])
      .map((d) => {
        const hay = [d.title, d.topic, d.summary, ...(Array.isArray(d.key_points) ? d.key_points : []), ...(Array.isArray(d.tags) ? d.tags : [])].join(" ");
        return { src: "knowledge" as Src, date: String(d.created_at || "").slice(0, 10), title: String(d.title || ""), text: String(d.summary || hay).slice(0, 600), score: scoreOf(hay, st) };
      })
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

async function fromDocs(userId: string, st: string[]): Promise<Found[]> {
  try {
    const { data } = await supabaseAdmin().from("memories")
      .select("title, summary, fields, mem_date, created_at").eq("user_id", userId).limit(300);
    return ((data as any[]) || [])
      .map((m) => {
        const flds = Array.isArray(m.fields) ? m.fields.map((f: any) => `${f?.label ?? ""} ${f?.value ?? ""}`).join(" ") : "";
        const hay = [m.title, m.summary, flds].join(" ");
        return { src: "doc" as Src, date: String(m.mem_date || m.created_at || "").slice(0, 10), title: String(m.title || ""), text: [m.summary, flds].filter(Boolean).join(" · ").slice(0, 600), score: scoreOf(hay, st) };
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
    return hits
      .filter((h) => h.similarity >= 0.15)
      .map((h) => ({ src: "diary" as Src, date: h.entry_date, title: "", text: String(h.raw_text || h.summary || "").slice(0, 700), score: Math.round(h.similarity * 10) + 1 }));
  }
  try {
    const { data } = await supabaseAdmin().from("entries")
      .select("raw_text, summary, entry_date").eq("user_id", userId)
      .order("entry_date", { ascending: false }).limit(400);
    return ((data as any[]) || [])
      .map((e) => ({ src: "diary" as Src, date: String(e.entry_date || ""), title: "", text: String(e.raw_text || e.summary || "").slice(0, 700), score: scoreOf(`${e.raw_text || ""} ${e.summary || ""}`, st) }))
      .filter((x) => x.score > 0);
  } catch {
    return [];
  }
}

export async function searchEverything(userId: string, query: string, limit = 12): Promise<Found[]> {
  const st = stems(query);
  if (!st.length) return [];
  const [d, n, k, m] = await Promise.all([
    fromDiary(userId, query, st),
    fromNotes(userId, st),
    fromKnowledge(userId, st),
    fromDocs(userId, st),
  ]);
  return [...d, ...n, ...k, ...m]
    .filter((x) => x.text.trim())
    .sort((a, b) => b.score - a.score || String(b.date || "").localeCompare(String(a.date || "")))
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

const SYS = `Ты отвечаешь человеку по ЕГО СОБСТВЕННЫМ записям в LIFE OS. Тебе дают куски, найденные на разных полках: дневник, заметки, база знаний, документы и фото.

ПРАВИЛА:
— Отвечай ТОЛЬКО по данным ниже. Ничего не додумывай: если ответа в них нет, так и скажи.
— Если нашлось конкретное значение (код, номер, адрес, сумма) — назови его сразу, первым делом, без предисловий.
— Указывай, ОТКУДА это: «в заметках», «в дневнике 12 мая», «в документах». Человек не помнит, куда положил, — и именно это ему полезно узнать.
— Если куски противоречат друг другу, скажи об этом и покажи оба.
— Коротко. Без markdown, списков со звёздочками и заголовков.`;

export async function answerFromEverything(userId: string, query: string, locale = "ru"): Promise<string> {
  const found = await searchEverything(userId, query);
  if (!found.length) return NOTHING[locale] || NOTHING.ru;
  if (!process.env.ANTHROPIC_API_KEY) {
    return found.slice(0, 5).map((f) => `• [${SRC_LABEL[f.src]}${f.date ? `, ${f.date}` : ""}] ${f.text.slice(0, 200)}`).join("\n");
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
    return t || (NOTHING[locale] || NOTHING.ru);
  } catch {
    return found.slice(0, 5).map((f) => `• [${SRC_LABEL[f.src]}${f.date ? `, ${f.date}` : ""}] ${f.text.slice(0, 200)}`).join("\n");
  }
}
