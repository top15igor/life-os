import { supabaseAdmin } from "./supabaseAdmin";

// Задачи Клоду, поставленные голосом или текстом через LIFE OS.
//
// Осознанная граница: сказанная фраза НИКОГДА ничего не запускает сама. Она
// только попадает сюда со статусом «новая». Дальше владелец жмёт кнопку в
// Telegram — и только после этого задача уходит в GitHub. Микрофон у кулона
// включён всегда, а спусковой крючок — нет.
//
// Это и есть причина не подключать кулон к агенту напрямую: случайная фраза
// рядом (твоя, собеседника, из телевизора) иначе стала бы командой.

const API = "https://api.github.com";
const DEFAULT_REPO = process.env.GITHUB_REPO || "top15igor/life-os";

export type ClaudeTask = {
  id: string;
  user_id: string;
  text: string;
  repo: string | null;
  status: string;
  source: string | null;
  issue_url: string | null;
  issue_number: number | null;
  error: string | null;
  created_at: string | null;
};

// Обращение к Клоду в начале фразы. Распознавание речи пишет имя по-разному,
// поэтому принимаем варианты. Срабатывает только В НАЧАЛЕ: «поговорили про
// Клода» задачей не станет.
const ADDRESS = /^\s*(кл[оа]вд|кл[оа]уд|клод|claude|клауд)\s*[,:!.\-—]*\s+/i;

export function detectClaudeTask(text: string): string | null {
  const t = (text || "").trim();
  if (!t) return null;
  const m = ADDRESS.exec(t);
  if (!m) return null;
  const task = t.slice(m[0].length).trim();
  // «Клод» сам по себе — не задача, а обрывок.
  if (task.split(/\s+/).filter(Boolean).length < 3) return null;
  return task;
}

export async function createTask(userId: string, text: string, source: string): Promise<ClaudeTask | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("claude_tasks")
      .insert({ user_id: userId, text: text.slice(0, 4000), source })
      .select()
      .single();
    if (error) return null;
    return data as ClaudeTask;
  } catch {
    return null; // миграции ещё нет
  }
}

export async function getTask(userId: string, id: string): Promise<ClaudeTask | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("claude_tasks").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    return (data as ClaudeTask | null) || null;
  } catch {
    return null;
  }
}

export async function listTasks(userId: string, limit = 30): Promise<ClaudeTask[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("claude_tasks").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(limit);
    return (data as ClaudeTask[]) || [];
  } catch {
    return [];
  }
}

export async function cancelTask(userId: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin()
      .from("claude_tasks").update({ status: "cancelled" }).eq("id", id).eq("user_id", userId).eq("status", "new");
    return !error;
  } catch {
    return false;
  }
}

// Короткий заголовок для задачи в GitHub: первая мысль целиком, без обрезки на
// полуслове — в списке задач это единственное, что видно.
function titleOf(text: string): string {
  const first = text.split(/[.!?\n]/)[0].trim() || text;
  if (first.length <= 70) return first;
  const cut = first.slice(0, 70);
  const sp = cut.lastIndexOf(" ");
  return (sp > 30 ? cut.slice(0, sp) : cut) + "…";
}

export type SendResult = { ok: boolean; url?: string; number?: number; error?: string };

// Отправка в GitHub. Задача становится issue с обращением к Клоду — дальше
// работает штатное действие Claude в репозитории: берёт задачу, делает правку,
// выкладывает ветку и отчитывается прямо в обсуждении.
export async function sendTask(userId: string, id: string): Promise<SendResult> {
  const token = process.env.GITHUB_FIX_TOKEN;
  if (!token) return { ok: false, error: "не настроен доступ к GitHub (GITHUB_FIX_TOKEN)" };

  const task = await getTask(userId, id);
  if (!task) return { ok: false, error: "задача не найдена" };
  if (task.status === "sent") {
    return task.issue_url
      ? { ok: true, url: task.issue_url, number: task.issue_number || 0 }
      : { ok: false, error: "задача уже отправлена" };
  }
  if (task.status === "cancelled") return { ok: false, error: "задача отменена" };

  const repo = task.repo || DEFAULT_REPO;
  const body = [
    `@claude ${task.text}`,
    "",
    "---",
    "_Задача поставлена голосом через LIFE OS._",
  ].join("\n");

  try {
    const r = await fetch(`${API}/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ title: titleOf(task.text), body }),
    });
    if (!r.ok) {
      const why = `GitHub ответил ${r.status}`;
      await supabaseAdmin().from("claude_tasks").update({ status: "failed", error: why }).eq("id", id);
      return { ok: false, error: why };
    }
    const issue: any = await r.json();
    await supabaseAdmin().from("claude_tasks").update({
      status: "sent", issue_url: issue.html_url, issue_number: issue.number,
      repo, sent_at: new Date().toISOString(), error: null,
    }).eq("id", id);
    return { ok: true, url: issue.html_url, number: issue.number };
  } catch (e: any) {
    const why = String(e?.message || e).slice(0, 300);
    try { await supabaseAdmin().from("claude_tasks").update({ status: "failed", error: why }).eq("id", id); } catch {}
    return { ok: false, error: why };
  }
}

// ===== Карточка в Telegram =====
// Текст задачи показываем целиком: подтверждать вслепую то, что распознал
// микрофон, нельзя — именно здесь ловятся ослышки.

export function taskCard(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `🤖 <b>Задача Клоду</b>\n\n${esc(text)}\n\nЗапустить?`;
}

export function taskKeyboard(id: string) {
  return {
    reply_markup: {
      inline_keyboard: [[
        { text: "▶️ Запустить", callback_data: `clt:run:${id}` },
        { text: "✖️ Удалить", callback_data: `clt:del:${id}` },
      ]],
    },
  };
}
