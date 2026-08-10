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
// Поэтому агент ОБСУЖДАЕТ — именно разговором, а не анкетой. Он помнит весь
// диалог целиком, возвращается к сказанному раньше, предлагает более острую
// версию, спорит, если идея решает не ту проблему. Заканчивает не по счётчику
// вопросов, а когда стало ясно, ЧТО делать, ЗАЧЕМ и КОМУ. Владельцу уходит не
// реплика, а готовая постановка.
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

// Разговор — не анкета. Держим ВСЮ переписку и каждый раз отдаём её модели
// целиком: человек возвращается к сказанному, меняет мнение, вспоминает
// подробность через десять реплик. Анкета из трёх вопросов этого не умеет —
// она спрашивает своё и не слышит, что ей ответили.
type Msg = { r: "u" | "a"; t: string };
type Draft = { msgs: Msg[]; at: number };

const MAX_MSGS = 40;

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
    if (!d?.msgs?.length || Date.now() - Number(d.at || 0) > 24 * 3600_000) return null;
    return d;
  } catch {
    return null;
  }
}

export async function clearDraft(userId: string): Promise<void> {
  try {
    const p = await prefs(userId);
    delete p.ideaDraft;
    delete p.ideaReady;
    delete p.ideaEditing;
    delete p.ideaShots;
    await savePrefs(userId, p);
  } catch {
    /* нечего убирать */
  }
}

async function putDraft(userId: string, d: Draft): Promise<void> {
  try {
    const p = await prefs(userId);
    p.ideaDraft = { msgs: d.msgs.slice(-MAX_MSGS), at: Date.now() };
    await savePrefs(userId, p);
  } catch {
    /* без черновика разговор не продолжится */
  }
}

// ===== Разговор =====

const SYS = `Ты обсуждаешь с человеком ИДЕЮ ПО ПРОДУКТУ LIFE OS. Он не заказчик и не подчинённый — он соавтор, который хорошо знает жизнь пользователя, но не обязан знать, как устроен продукт.

ЧТО ТАКОЕ LIFE OS. Личный архив жизни: Telegram-бот и сайт. Человек надиктовывает боту события дня, AI разбирает их и раскладывает по разделам: дневник, деньги, задачи, напоминания, люди, места, здоровье, документы и фото, заметки, база знаний, книги, мечты, путешествия. Есть поиск по смыслу по всем разделам сразу, «Разобрать» — где агент показывает, в чём сомневался, и учится на поправках, выгрузка всех своих данных, книга жизни.

КАК РАЗГОВАРИВАТЬ.
— Это живой разговор, а не анкета. Ты помнишь всё сказанное раньше и опираешься на это.
— Сначала пойми, а потом предлагай. Если формулировка допускает два прочтения — скажи, какие, и спроси, какое верное.
— Думай вместе с ним: предлагай более острую версию идеи, показывай, где она сломается, называй похожее, что уже есть в продукте.
— Не соглашайся из вежливости. Если видишь, что идея решает не ту проблему или уже решена — скажи прямо и объясни.
— Отвечай коротко, 2-5 предложений, как в переписке. Без списков, заголовков и markdown. Один вопрос за раз.
— Не обещай сроков и не решай, будут ли это делать: решает владелец.

КОГДА ЗАКАНЧИВАТЬ. Как только ясно, ЧТО делать, ЗАЧЕМ и КОМУ это нужно, — вызови инструмент finish. Не тяни разговор ради разговора: три-четыре обмена репликами обычно достаточно. Если человек говорит «хватит», «отправляй», «достаточно» — вызывай finish немедленно, с тем, что есть.`;

const FINISH: Anthropic.Tool = {
  name: "finish",
  description: "Идея понятна — собрать постановку и предложить отправить владельцу.",
  input_schema: {
    type: "object",
    properties: {
      say: { type: "string", description: "что сказать человеку перед показом постановки, 1-2 предложения" },
      title: { type: "string", description: "суть одной строкой, 3-8 слов, словами автора" },
      body: { type: "string", description: "что именно сделать: 2-4 предложения, конкретно" },
      problem: { type: "string", description: "какую проблему решает и когда она случается" },
      who: { type: "string", description: "кому это нужно" },
      done_when: { type: "string", description: "как понять, что сделано хорошо — проверяемо" },
    },
    required: ["say", "title", "body"],
  },
};

export type Turn = { reply: string; ready?: Partial<Idea>; msgs: Msg[] };

// Одна реплика разговора. Возвращает ответ агента и, если пора, готовую
// постановку — но НЕ сохраняет её: решение отправлять принимает человек.
export async function converse(userId: string, text: string): Promise<Turn> {
  const d = (await getDraft(userId)) || { msgs: [], at: Date.now() };
  d.msgs.push({ r: "u", t: String(text).slice(0, 3000) });

  if (!process.env.ANTHROPIC_API_KEY) {
    await putDraft(userId, d);
    return { reply: "Расскажи ещё пару слов — и соберу.", msgs: d.msgs };
  }

  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.5,
      system: SYS,
      tools: [FINISH],
      messages: d.msgs.map((x) => ({ role: x.r === "u" ? ("user" as const) : ("assistant" as const), content: x.t })),
    });
    logClaude(userId, "idea-talk", "sonnet", (m as any).usage);

    const tool = m.content.find((b) => b.type === "tool_use");
    const said = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();

    if (tool && tool.type === "tool_use") {
      const i = tool.input as any;
      const reply = String(i.say || said || "Кажется, всё понятно.").slice(0, 600);
      d.msgs.push({ r: "a", t: reply });
      await putDraft(userId, d);
      return {
        reply,
        ready: {
          title: String(i.title || "").slice(0, 120),
          body: String(i.body || "").slice(0, 2000),
          problem: i.problem || null,
          who: i.who || null,
          done_when: i.done_when || null,
        },
        msgs: d.msgs,
      };
    }

    const reply = said || "Расскажи чуть подробнее.";
    d.msgs.push({ r: "a", t: reply.slice(0, 1500) });
    await putDraft(userId, d);
    return { reply, msgs: d.msgs };
  } catch {
    await putDraft(userId, d);
    return { reply: "Что-то пошло не так, скажи ещё раз.", msgs: d.msgs };
  }
}

// Свернуть разговор по требованию человека («хватит, отправляй»), даже если
// агент считает, что стоило бы уточнить ещё.
export async function summarize(userId: string, msgs?: Msg[]): Promise<Partial<Idea> | null> {
  const list = msgs || (await getDraft(userId))?.msgs || [];
  const mine = list.filter((x) => x.r === "u").map((x) => x.t);
  if (!mine.length) return null;
  if (!process.env.ANTHROPIC_API_KEY) return { title: mine[0].slice(0, 60), body: mine.join(" ") };
  try {
    const dialog = list.map((x) => `${x.r === "u" ? "Автор" : "Ты"}: ${x.t}`).join("\n");
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.2,
      system: "Собери из разговора ПОСТАНОВКУ идеи по продукту LIFE OS. Пиши словами автора, не приукрашивай и НЕ ДОДУМЫВАЙ того, чего он не говорил: если чего-то не прозвучало, оставь поле пустым. Формулируй так, чтобы понял человек, который в разговоре не участвовал.",
      tools: [{ ...FINISH, name: "idea", description: "Готовая постановка." }],
      tool_choice: { type: "tool", name: "idea" },
      messages: [{ role: "user", content: dialog }],
    });
    logClaude(userId, "idea-sum", "sonnet", (m as any).usage);
    const b = m.content.find((x) => x.type === "tool_use");
    const i = (b && b.type === "tool_use" ? b.input : {}) as any;
    if (!i?.title) return null;
    return { title: String(i.title).slice(0, 120), body: String(i.body || "").slice(0, 2000), problem: i.problem || null, who: i.who || null, done_when: i.done_when || null };
  } catch {
    return null;
  }
}

// Готовую постановку держим рядом с разговором: кнопка «Отправить» берёт её
// отсюда, а не пересобирает заново — иначе человек подтверждает один текст,
// а уходит другой.
export async function stashIdea(userId: string, ready: Partial<Idea>): Promise<void> {
  try {
    const p = await prefs(userId);
    p.ideaReady = ready;
    await savePrefs(userId, p);
  } catch {
    /* соберём заново при отправке */
  }
}

export async function takeStashed(userId: string): Promise<Partial<Idea> | null> {
  try {
    const p = await prefs(userId);
    const r = p.ideaReady || null;
    if (r) { delete p.ideaReady; await savePrefs(userId, p); }
    return r;
  } catch {
    return null;
  }
}

// Скриншоты, приложенные к разговору. Держим только их идентификаторы в
// Telegram: перекладывать картинки в хранилище ради обсуждения незачем.
export async function noteIdeaShot(userId: string, fileId: string): Promise<void> {
  try {
    const p = await prefs(userId);
    const list: string[] = p.ideaShots || [];
    p.ideaShots = [...list, fileId].slice(-6);
    await savePrefs(userId, p);
  } catch {
    /* без скриншота обсуждение всё равно идёт */
  }
}

export async function ideaShots(userId: string): Promise<string[]> {
  try {
    return (await prefs(userId)).ideaShots || [];
  } catch {
    return [];
  }
}

// ===== Вернуться к идее =====
//
// Через день человек вспоминает подробность или передумывает: «мы остановились
// на том-то, я хочу переделать». Без этого идея замерзает в момент отправки, а
// самое ценное — то, что додумалось потом.

// Найти идею, к которой хотят вернуться: по номеру («идея 7») или по смыслу.
export async function findIdea(userId: string, query: string, owner: boolean): Promise<Idea | null> {
  const q = (query || "").trim();
  const db = supabaseAdmin();
  const num = Number((q.match(/\d{1,5}/) || [])[0]);
  try {
    if (Number.isFinite(num) && num > 0) {
      let byNum: any = db.from("ideas").select("*").eq("num", num);
      if (!owner) byNum = byNum.eq("user_id", userId);
      const { data } = await byNum.maybeSingle();
      if (data) return data as Idea;
    }
    let all: any = db.from("ideas").select("*").order("created_at", { ascending: false }).limit(200);
    if (!owner) all = all.eq("user_id", userId);
    const { data } = await all;
    const norm = (x: string) => (x || "").toLowerCase().replace(/ё/g, "е");
    const st = norm(q).split(/[^a-zа-яіїєґ0-9]+/i).filter((w) => w.length >= 4).map((w) => w.slice(0, 5));
    if (!st.length) return null;
    const scored = ((data as Idea[]) || [])
      .map((i) => ({ i, n: st.filter((x) => norm(`${i.title} ${i.body}`).includes(x)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);
    return scored[0]?.i || null;
  } catch {
    return null;
  }
}

// Продолжить обсуждение существующей идеи: поднимаем прошлый разговор и
// напоминаем, на чём остановились.
export async function resumeIdea(userId: string, idea: Idea): Promise<string> {
  const past: Msg[] = Array.isArray((idea as any).chat) ? ((idea as any).chat as Msg[]) : [];
  const head: Msg = {
    r: "u",
    t: `[Возвращаемся к идее №${idea.num}] Раньше мы сформулировали так: «${idea.title}». ${idea.body}${idea.problem ? ` Зачем: ${idea.problem}` : ""} Сейчас статус: ${STATUS_LABEL[idea.status]}. Я хочу к ней вернуться и доработать.`,
  };
  const msgs = [...past.filter((m) => m && m.t), head].slice(-MAX_MSGS);
  try {
    const p = await prefs(userId);
    p.ideaDraft = { msgs, at: Date.now() };
    p.ideaEditing = idea.id;
    delete p.ideaReady;
    await savePrefs(userId, p);
  } catch {
    /* не сохранилось — разговор начнётся с чистого листа */
  }
  return `Поднял идею №${idea.num}: «${idea.title}» (${STATUS_LABEL[idea.status]}). Что меняем?`;
}

export async function editingIdea(userId: string): Promise<string | null> {
  try {
    return (await prefs(userId)).ideaEditing || null;
  } catch {
    return null;
  }
}

// Обновить существующую идею после доработки. Номер и статус сохраняем —
// человеку важно, что это та же идея, а не новая.
export async function updateIdea(id: string, data: Partial<Idea>, chat: any): Promise<Idea | null> {
  try {
    const { data: row, error } = await supabaseAdmin()
      .from("ideas")
      .update({
        title: String(data.title || "").slice(0, 120),
        body: String(data.body || "").slice(0, 2000),
        problem: data.problem || null,
        who: data.who || null,
        done_when: data.done_when || null,
        chat: chat || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) return null;
    return row as Idea;
  } catch {
    return null;
  }
}

export async function tellOwnerUpdated(idea: Idea, who: { name?: string | null }): Promise<void> {
  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  if (!owner) return;
  const e = (x: any) => String(x || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    await sendMessage(owner, [`✏️ <b>Идея №${idea.num} доработана</b> — ${e(who.name || "автором")}`, "", `<b>${e(idea.title)}</b>`, e(idea.body)].join("\n"));
  } catch {
    /* не дошло — правка всё равно сохранена */
  }
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
