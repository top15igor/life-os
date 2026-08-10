import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage } from "./telegram";
import { logClaude } from "./usage";

// Идеи от людей: надиктовал — обсудили — довели до формулировки — отдали
// владельцу — видно, что с ней стало.
//
// Почему не просто «записать пожелание». Человек говорит одно, а имеет в виду
// другое: «пусть бот напоминает про счета» может означать и напоминание по
// дате, и разбор писем из почты, и распознавание счёта на фото. Записанная
// дословно, такая идея бесполезна — до неё всё равно придётся возвращаться и
// переспрашивать, а автор к тому времени забудет, что имел в виду.
//
// Поэтому агент ОБСУЖДАЕТ: пересказывает своими словами (это одно уже ловит
// половину непониманий), задаёт два-три точных вопроса и показывает итог на
// подтверждение. Владельцу уходит не реплика, а готовая постановка.
//
// И главное, чего обычно не делают: автор УЗНАЁТ о судьбе своей идеи. Без
// этого предложения уходят в пустоту, и человек перестаёт предлагать после
// второго раза.

export type Status = "new" | "thinking" | "queued" | "doing" | "done" | "declined";

export const STATUS_LABEL: Record<Status, string> = {
  new: "новая",
  thinking: "обдумываем",
  queued: "в очереди",
  doing: "делаем",
  done: "готово",
  declined: "не будем",
};

const STATUS_EMOJI: Record<Status, string> = {
  new: "🆕", thinking: "🤔", queued: "📋", doing: "🔨", done: "✅", declined: "🚫",
};

export type Idea = {
  id: string;
  num: number;
  user_id: string;
  title: string;
  body: string;
  problem: string | null;
  who: string | null;
  done_when: string | null;
  status: Status;
  note: string | null;
  created_at: string;
  updated_at: string;
};

// ===== Черновик: обсуждение до отправки =====
//
// Живёт в общих настройках человека и никуда не уходит, пока он не подтвердит.
// Тот же принцип, что и в «Хочу, чтобы умел»: до явного согласия текст
// принадлежит только ему.

type Draft = { said: string[]; asked: string[]; step: number; at: number };

async function prefs(userId: string): Promise<any> {
  const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", userId).maybeSingle();
  return { ...((data as any)?.morning_prefs || {}) };
}

async function savePrefs(userId: string, p: any): Promise<void> {
  await supabaseAdmin().from("users").update({ morning_prefs: p }).eq("id", userId);
}

export async function getDraft(userId: string): Promise<Draft | null> {
  try {
    const d = (await prefs(userId)).ideaDraft as Draft | undefined;
    // Сутки — щедро: человек может отвлечься и вернуться вечером.
    if (!d || Date.now() - Number(d.at || 0) > 24 * 3600_000) return null;
    return d;
  } catch {
    return null;
  }
}

export async function clearDraft(userId: string): Promise<void> {
  try {
    const p = await prefs(userId);
    delete p.ideaDraft;
    await savePrefs(userId, p);
  } catch {
    /* нечего убирать */
  }
}

async function putDraft(userId: string, d: Draft): Promise<void> {
  try {
    const p = await prefs(userId);
    p.ideaDraft = d;
    await savePrefs(userId, p);
  } catch {
    /* без черновика обсуждение просто не продолжится */
  }
}

// ===== Обсуждение =====

const MAX_QUESTIONS = 3;

const SYS = `Ты помогаешь довести ИДЕЮ ПО ПРОДУКТУ LIFE OS до постановки, по которой можно работать.

LIFE OS — личный архив жизни: Telegram-бот и сайт. Человек надиктовывает боту события дня, тот разбирает их AI и раскладывает по разделам (дневник, деньги, задачи, напоминания, люди, места, здоровье, документы и фото, заметки, база знаний, книги). Есть поиск по смыслу по всем разделам и «Разобрать» — где агент показывает, в чём сомневался.

ТВОЯ ЗАДАЧА на этом шаге — задать ОДИН следующий вопрос, который сильнее всего уточняет идею. Хорошие вопросы:
— какую проблему это решает и когда она случается;
— что именно должно произойти: где, в какой момент, что человек увидит;
— чем предложенное лучше того, что уже есть;
— как понять, что сделано хорошо.

ПРАВИЛА:
— Ровно один вопрос, короткий, без вступлений и без списков.
— Не спрашивай очевидное и не повторяй уже спрошенное.
— Не предлагай своих решений и не спорь: твоё дело — понять.
— Если по сказанному уже понятно, ЧТО делать, для кого и когда — верни пустую строку вместо вопроса.`;

export async function nextQuestion(userId: string, said: string[], asked: string[]): Promise<string> {
  if (asked.length >= MAX_QUESTIONS || !process.env.ANTHROPIC_API_KEY) return "";
  try {
    const dialog = said.map((t, i) => `Автор: ${t}${asked[i] ? `\nТы спросил: ${asked[i]}` : ""}`).join("\n");
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      temperature: 0.3,
      system: SYS,
      messages: [{ role: "user", content: dialog }],
    });
    logClaude(userId, "idea-refine", "sonnet", (m as any).usage);
    return m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim().slice(0, 300);
  } catch {
    return "";
  }
}

const SUM_TOOL: Anthropic.Tool = {
  name: "idea",
  description: "Готовая постановка идеи.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "суть одной строкой, 3-8 слов, словами автора" },
      body: { type: "string", description: "что именно сделать: 2-4 предложения, конкретно" },
      problem: { type: "string", description: "какую проблему решает и когда она случается" },
      who: { type: "string", description: "кому это нужно: всем, новичкам, тем у кого много документов и т.п." },
      done_when: { type: "string", description: "как понять, что сделано хорошо — проверяемо" },
    },
    required: ["title", "body"],
  },
};

export async function summarize(userId: string, said: string[], asked: string[]): Promise<Partial<Idea> | null> {
  if (!process.env.ANTHROPIC_API_KEY) return { title: said[0]?.slice(0, 60) || "Идея", body: said.join(" ") };
  try {
    const dialog = said.map((t, i) => `Автор: ${t}${asked[i] ? `\nВопрос: ${asked[i]}` : ""}`).join("\n");
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.2,
      system: `Собери из разговора ПОСТАНОВКУ идеи по продукту LIFE OS. Пиши словами автора, не приукрашивай и НЕ ДОДУМЫВАЙ того, чего он не говорил: если чего-то не прозвучало, оставь поле пустым. Формулируй так, чтобы человек, который в разговоре не участвовал, понял, что делать.`,
      tools: [SUM_TOOL],
      tool_choice: { type: "tool", name: "idea" },
      messages: [{ role: "user", content: dialog }],
    });
    logClaude(userId, "idea-sum", "sonnet", (m as any).usage);
    const b = m.content.find((x) => x.type === "tool_use");
    const d = (b && b.type === "tool_use" ? b.input : {}) as any;
    if (!d?.title) return null;
    return { title: String(d.title).slice(0, 120), body: String(d.body || "").slice(0, 2000), problem: d.problem || null, who: d.who || null, done_when: d.done_when || null };
  } catch {
    return null;
  }
}

// Начать или продолжить обсуждение. Возвращает вопрос — либо null, если пора
// показывать итог.
export async function advance(userId: string, text: string): Promise<{ question: string } | { ready: Partial<Idea>; chat: { said: string[]; asked: string[] } }> {
  const d = (await getDraft(userId)) || { said: [], asked: [], step: 0, at: Date.now() };
  d.said.push(text.slice(0, 2000));
  d.at = Date.now();

  const q = await nextQuestion(userId, d.said, d.asked);
  if (q && d.asked.length < MAX_QUESTIONS) {
    d.asked.push(q);
    await putDraft(userId, d);
    return { question: q };
  }

  const ready = await summarize(userId, d.said, d.asked);
  await putDraft(userId, d);
  return { ready: ready || { title: d.said[0].slice(0, 80), body: d.said.join(" ") }, chat: { said: d.said, asked: d.asked } };
}

// ===== Сохранение и жизнь идеи =====

export async function createIdea(userId: string, who: { name?: string | null }, data: Partial<Idea>, chat: any): Promise<Idea | null> {
  try {
    const { data: row, error } = await supabaseAdmin()
      .from("ideas")
      .insert({
        user_id: userId,
        title: String(data.title || "Идея").slice(0, 120),
        body: String(data.body || "").slice(0, 2000),
        problem: data.problem || null,
        who: data.who || null,
        done_when: data.done_when || null,
        chat: chat || [],
      })
      .select("*")
      .single();
    if (error || !row) return null;
    await clearDraft(userId);
    await tellOwner(row as Idea, who);
    return row as Idea;
  } catch {
    return null;
  }
}

const esc = (s: string) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function tellOwner(idea: Idea, who: { name?: string | null }): Promise<void> {
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (!owner) return;
  const parts = [
    `💡 <b>Идея №${idea.num}</b> — от ${esc(who.name || "пользователя")}`,
    "",
    `<b>${esc(idea.title)}</b>`,
    esc(idea.body),
  ];
  if (idea.problem) parts.push("", `<b>Зачем:</b> ${esc(idea.problem)}`);
  if (idea.who) parts.push(`<b>Кому:</b> ${esc(idea.who)}`);
  if (idea.done_when) parts.push(`<b>Готово, когда:</b> ${esc(idea.done_when)}`);
  parts.push("", "Решение — на странице «Идеи» в админке.");
  try {
    await sendMessage(owner, parts.join("\n"));
  } catch {
    /* владельцу не дошло — идея всё равно сохранена */
  }
}

export async function listIdeas(userId: string, all: boolean): Promise<Idea[]> {
  try {
    let q: any = supabaseAdmin().from("ideas").select("*").order("created_at", { ascending: false }).limit(200);
    if (!all) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data as Idea[]) || [];
  } catch {
    return [];
  }
}

// Смена статуса владельцем. Автор об этом УЗНАЁТ — ради этого всё и затевалось.
export async function setStatus(id: string, status: Status, note?: string): Promise<boolean> {
  const db = supabaseAdmin();
  try {
    const { data: before } = await db.from("ideas").select("*").eq("id", id).maybeSingle();
    if (!before) return false;
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (typeof note === "string") patch.note = note.slice(0, 500) || null;
    const { error } = await db.from("ideas").update(patch).eq("id", id);
    if (error) return false;

    if ((before as any).status !== status) await tellAuthor({ ...(before as any), status, note: patch.note ?? (before as any).note } as Idea);
    return true;
  } catch {
    return false;
  }
}

async function tellAuthor(idea: Idea): Promise<void> {
  try {
    const { data: u } = await supabaseAdmin().from("users").select("chat_id").eq("id", idea.user_id).maybeSingle();
    const chat = Number((u as any)?.chat_id || 0);
    if (!chat) return;
    const head = `${STATUS_EMOJI[idea.status]} Твоя идея №${idea.num} — <b>${STATUS_LABEL[idea.status]}</b>`;
    const lines = [head, "", `«${esc(idea.title)}»`];
    if (idea.note) lines.push("", esc(idea.note));
    if (idea.status === "done") lines.push("", "Спасибо — она уже работает.");
    await sendMessage(chat, lines.join("\n"));
  } catch {
    /* не дошло — статус всё равно изменён */
  }
}

// Похожая идея уже есть? Спрашиваем ДО обсуждения, чтобы не гонять человека
// по кругу и не плодить у владельца пять формулировок одного и того же.
export async function similarIdea(text: string): Promise<Idea | null> {
  const norm = (x: string) => (x || "").toLowerCase().replace(/ё/g, "е");
  const st = norm(text)
    .split(/[^a-zа-яіїєґ0-9]+/i)
    .filter((w) => w.length >= 4)
    .map((w) => w.slice(0, 5));
  if (st.length < 2) return null;
  try {
    const { data } = await supabaseAdmin().from("ideas").select("*").neq("status", "declined").limit(200);
    const scored = ((data as Idea[]) || [])
      .map((i) => ({ i, n: st.filter((s) => norm(`${i.title} ${i.body}`).includes(s)).length }))
      .sort((a, b) => b.n - a.n);
    // Половина слов запроса — уже разговор об одном и том же.
    return scored[0] && scored[0].n >= Math.max(2, Math.ceil(st.length / 2)) ? scored[0].i : null;
  } catch {
    return null;
  }
}
