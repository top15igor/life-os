import { supabaseAdmin } from "./supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { getFinanceSummary } from "./finance";
import { ACTION_TOOLS, runAction, type Lang } from "./botActions";

// Действия, которые компаньон может ВЫПОЛНЯТЬ прямо в беседе (как Джарвис).
// Берём из общего набора бота, исключая роутер-заглушки и опасное удаление.
const AGENT_NAMES = ["set_reminder", "add_task", "add_goal", "log_weight", "add_dream", "complete_task", "complete_dream", "add_deed"];
const AGENT_TOOLS = ACTION_TOOLS.filter((t) => AGENT_NAMES.includes(t.name));

// AI-компаньон («идеальный друг под боком»): живая беседа с памятью диалога,
// знанием всей базы пользователя (дневник/заметки/финансы) и доступом к открытому
// интернету через серверный веб-поиск Claude. В отличие от askLife (один вопрос →
// один ответ) — помнит предыдущие реплики и держит нить разговора.

type Turn = { role: "user" | "assistant"; content: any };

// ===== Режим беседы (флаг на пользователе) =====
// Деградирует мягко: если колонки chat_mode ещё нет (миграция не запущена),
// режим просто не включается, а бот продолжает работать как раньше.
export async function getChatMode(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin().from("users").select("chat_mode").eq("id", userId).maybeSingle();
    return Boolean((data as any)?.chat_mode);
  } catch {
    return false;
  }
}

export async function setChatMode(userId: string, on: boolean): Promise<void> {
  try {
    await supabaseAdmin().from("users").update({ chat_mode: on }).eq("id", userId);
  } catch {
    // нет колонки — тихо игнорируем
  }
}

// ===== История диалога =====
async function getHistory(userId: string, limit = 20): Promise<Turn[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("companion_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || [])
      .reverse()
      .map((r: any) => ({ role: r.role === "assistant" ? "assistant" : "user", content: r.content }));
  } catch {
    return [];
  }
}

async function appendMessage(userId: string, role: "user" | "assistant", content: string): Promise<void> {
  try {
    await supabaseAdmin().from("companion_messages").insert({ user_id: userId, role, content });
  } catch {
    // нет таблицы — беседа просто не запоминается между сообщениями
  }
}

// Начать новую беседу «с чистого листа» (стереть историю диалога).
export async function clearHistory(userId: string): Promise<void> {
  try {
    await supabaseAdmin().from("companion_messages").delete().eq("user_id", userId);
  } catch {
    // ignore
  }
}

// История диалога для веб-чата (та же таблица, что и в боте — сквозная беседа).
export async function getCompanionHistory(userId: string, limit = 40): Promise<{ role: "user" | "assistant"; content: string }[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("companion_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || [])
      .reverse()
      .map((r: any) => ({ role: r.role === "assistant" ? "assistant" : "user", content: String(r.content || "") }));
  } catch {
    return [];
  }
}

// ===== Контекст «что я знаю о тебе» (дневник + база знаний + финансы) =====
async function gatherContext(userId: string): Promise<string> {
  const db = supabaseAdmin();
  const [{ data: entries }, finance] = await Promise.all([
    db
      .from("entries")
      .select("entry_date, summary, raw_text")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .limit(200),
    getFinanceSummary(userId).catch(() => ""),
  ]);

  const diary =
    (entries || []).map((e: any) => `${e.entry_date}: ${(e.raw_text || e.summary || "").slice(0, 700)}`).join("\n") ||
    "(записей пока нет)";

  let saved = "(пусто)";
  try {
    const { data: items } = await db
      .from("saved_items")
      .select("title, topic, summary, key_points")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(150);
    if (items?.length) {
      saved = items
        .map((it: any) => {
          const pts = Array.isArray(it.key_points) && it.key_points.length ? "; " + it.key_points.join("; ") : "";
          return `• ${it.title || "—"}${it.topic ? ` [${it.topic}]` : ""}: ${(it.summary || "").slice(0, 400)}${pts}`.slice(0, 800);
        })
        .join("\n");
    }
  } catch {
    // таблицы может не быть
  }

  return `ДНЕВНИК (дата: что происходило):
${diary}

БАЗА ЗНАНИЙ (сохранённое из Instagram/YouTube — рецепты, тренировки, советы):
${saved}

${finance || "ФИНАНСЫ: операций пока нет."}`;
}

function nowLocal(off?: number | null): string {
  const ms = Date.now() + (typeof off === "number" ? off : 0) * 60000;
  const d = new Date(ms);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `${d.toISOString().slice(0, 16).replace("T", " ")} (${dow})`;
}

function buildSystem(name: string | null, context: string, off?: number | null): string {
  const who = name ? name : "собеседника";
  return `Местное время собеседника сейчас: ${nowLocal(off)}. Используй его для дат «сегодня/завтра/через час/в 9».

Ты — близкий тёплый друг и личный AI-компаньон ${who} в приложении LIFE OS. Ты знаешь о нём почти всё — из его дневника, заметок и финансов (они ниже). Веди живую беседу, как лучший друг, который всегда рядом: слушай, поддерживай, размышляй вместе, давай честный совет, по-доброму напоминай о важном и подмечай закономерности в его жизни.

КАК СЕБЯ ВЕСТИ:
- Говори по-человечески, тепло и по делу, на языке собеседника. Без канцелярита и без фраз вроде «как ИИ я не могу».
- Опирайся на то, что знаешь о нём (раздел «ЧТО Я ЗНАЮ О ТЕБЕ» ниже): называй конкретику, вспоминай прошлое, связывай события — это и делает тебя «своим».
- Это БЕСЕДА. Помни предыдущие реплики и держи нить разговора.
- Когда нужен свежий факт из открытого мира (новости, цены, погода, «как сделать…», проверить информацию) — у тебя есть веб-поиск, пользуйся им и приводи актуальные данные. НИКОГДА не отвечай «у меня нет доступа к интернету».
- Будь другом, а не справочником: можно пошутить, посочувствовать, мягко подтолкнуть. Но честность важнее лести — если он не прав, скажи бережно, но прямо.
- Отвечай живо и не слишком длинно — как в переписке, а не как в реферате.
- НЕ выдумывай факты о его жизни. Чего не знаешь — спроси.

ТЫ УМЕЕШЬ ДЕЙСТВОВАТЬ (как Джарвис): у тебя есть инструменты — поставить напоминание (set_reminder), добавить задачу (add_task), цель (add_goal), мечту (add_dream), записать вес (log_weight), отметить задачу/мечту выполненной (complete_task/complete_dream), записать доброе дело (add_deed). Если собеседник просит сделать что-то из этого («напомни…», «добавь задачу…», «запиши вес…», «поставь цель…») — ВЫЗОВИ нужный инструмент и затем подтверди живой фразой. Не пиши «я не могу» и не делай вид, что выполнил — именно вызывай инструмент. Для напоминаний разбирай дату/время по местному времени собеседника (оно указано ниже).

ЧТО Я ЗНАЮ О ТЕБЕ:
${context}`;
}

// Главная функция: принимает новое сообщение пользователя, ведёт беседу с памятью,
// возвращает ответ компаньона. Сохраняет обе реплики в историю.
export async function talkToCompanion(
  userId: string,
  name: string | null,
  userText: string,
  lang: Lang = "ru",
  tzOffset?: number | null
): Promise<string> {
  // 1) Запоминаем реплику пользователя (до ответа — чтобы не потерять при сбое).
  await appendMessage(userId, "user", userText);

  // 2) Собираем контекст и историю диалога.
  const [context, history] = await Promise.all([gatherContext(userId), getHistory(userId, 20)]);
  const system = buildSystem(name, context, tzOffset);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // Веб-поиск (серверный) + действия-инструменты (исполняем сами через runAction).
  const tools: any = [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }, ...AGENT_TOOLS];
  const messages: any[] = history.map((t) => ({ role: t.role, content: t.content }));
  const didActions: string[] = [];

  // 3) Цикл: модель может вызвать веб-поиск (pause_turn) или действие (tool_use).
  //    На действие — выполняем через runAction и возвращаем результат как tool_result.
  let resp = await client.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1024, system, tools, messages } as any);
  logClaude(userId, "companion", "sonnet", (resp as any).usage);

  let guard = 0;
  while (guard < 6) {
    const sr = (resp as any).stop_reason;
    if (sr === "tool_use") {
      const blocks: any[] = (resp as any).content || [];
      const calls = blocks.filter((b: any) => b.type === "tool_use");
      messages.push({ role: "assistant", content: blocks });
      const results: any[] = [];
      for (const c of calls) {
        try {
          const r = await runAction(userId, c.name, c.input || {}, lang, tzOffset);
          didActions.push(c.name);
          results.push({ type: "tool_result", tool_use_id: c.id, content: r.text });
        } catch {
          results.push({ type: "tool_result", tool_use_id: c.id, content: "Не удалось выполнить", is_error: true });
        }
      }
      if (!results.length) break;
      messages.push({ role: "user", content: results });
    } else if (sr === "pause_turn") {
      messages.push({ role: "assistant", content: (resp as any).content });
    } else {
      break;
    }
    resp = await client.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1024, system, tools, messages } as any);
    logClaude(userId, "companion", "sonnet", (resp as any).usage);
    guard++;
  }

  const answer =
    (resp as any).content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim() || "…";

  // 4) Запоминаем ответ.
  await appendMessage(userId, "assistant", answer);
  return answer;
}
