import { supabaseAdmin } from "./supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";
import { getFinanceSummary } from "./finance";

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

function buildSystem(name: string | null, context: string): string {
  const who = name ? name : "собеседника";
  return `Ты — близкий тёплый друг и личный AI-компаньон ${who} в приложении LIFE OS. Ты знаешь о нём почти всё — из его дневника, заметок и финансов (они ниже). Веди живую беседу, как лучший друг, который всегда рядом: слушай, поддерживай, размышляй вместе, давай честный совет, по-доброму напоминай о важном и подмечай закономерности в его жизни.

КАК СЕБЯ ВЕСТИ:
- Говори по-человечески, тепло и по делу, на языке собеседника. Без канцелярита и без фраз вроде «как ИИ я не могу».
- Опирайся на то, что знаешь о нём (раздел «ЧТО Я ЗНАЮ О ТЕБЕ» ниже): называй конкретику, вспоминай прошлое, связывай события — это и делает тебя «своим».
- Это БЕСЕДА. Помни предыдущие реплики и держи нить разговора.
- Когда нужен свежий факт из открытого мира (новости, цены, погода, «как сделать…», проверить информацию) — у тебя есть веб-поиск, пользуйся им и приводи актуальные данные. НИКОГДА не отвечай «у меня нет доступа к интернету».
- Будь другом, а не справочником: можно пошутить, посочувствовать, мягко подтолкнуть. Но честность важнее лести — если он не прав, скажи бережно, но прямо.
- Отвечай живо и не слишком длинно — как в переписке, а не как в реферате.
- НЕ выдумывай факты о его жизни. Чего не знаешь — спроси.

ЧТО Я ЗНАЮ О ТЕБЕ:
${context}`;
}

// Главная функция: принимает новое сообщение пользователя, ведёт беседу с памятью,
// возвращает ответ компаньона. Сохраняет обе реплики в историю.
export async function talkToCompanion(userId: string, name: string | null, userText: string): Promise<string> {
  // 1) Запоминаем реплику пользователя (до ответа — чтобы не потерять при сбое).
  await appendMessage(userId, "user", userText);

  // 2) Собираем контекст и историю диалога.
  const [context, history] = await Promise.all([gatherContext(userId), getHistory(userId, 20)]);
  const system = buildSystem(name, context);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tools: any = [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }];
  const messages: any[] = history.map((t) => ({ role: t.role, content: t.content }));

  // 3) Запрос с веб-поиском. Серверный инструмент может вернуть stop_reason
  //    "pause_turn" (исчерпан лимит итераций) — тогда дослыаем ответ обратно.
  let resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    tools,
    messages,
  } as any);
  logClaude(userId, "companion", "sonnet", (resp as any).usage);

  let guard = 0;
  while ((resp as any).stop_reason === "pause_turn" && guard < 3) {
    messages.push({ role: "assistant", content: (resp as any).content });
    resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      tools,
      messages,
    } as any);
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
