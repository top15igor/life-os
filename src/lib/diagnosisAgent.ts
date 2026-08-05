import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { sendMessage } from "./telegram";
import { logClaude } from "./usage";
import { errorDigest, type ErrorGroup } from "./errorLog";
import { addAdminTask, getAdminTasks } from "./adminTasks";

// Агент-диагност.
//
// Раз в сутки читает три источника — падения самопроверки, журнал сбоев и жалобы
// людей из «Сообщить о проблеме» — и выдаёт не «где-то есть ошибки», а разбор:
// что чинить первым, скольких людей задело, где искать причину.
//
// Важное про приоритет: сортируем по ЛЮДЯМ, а не по количеству строк в логе.
// Одна ошибка у двенадцати человек важнее сотни повторов у одного.
//
// Результат уходит владельцу в Telegram, а серьёзные пункты автоматически
// становятся задачами в его же бэклоге /admin/tasks — чтобы не потерялись.

const OWNER_ID = "00000000-0000-0000-0000-000000000000";

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

// Где что живёт: подсказка модели, чтобы «где искать» было конкретным путём к
// файлу, а не общими словами. Ключ — префикс scope из журнала сбоев.
const SCOPE_MAP: Record<string, string> = {
  "bot:uncaught": "src/app/api/telegram/route.ts (необработанный сбой вебхука)",
  "bot:voice": "src/app/api/telegram/route.ts — расшифровка голосовых",
  "bot:analyze": "src/lib/ai.ts — разбор записи (analyze)",
  "bot:acquaint": "src/lib/acquaint.ts — режим знакомства",
  "bot:daycapture": "src/lib/dayCapture.ts — разбор дня",
  "bot:daycapture-cb": "src/lib/dayCapture.ts + обработка кнопок в route.ts",
  "bot:problem-cb": "src/lib/problemReport.ts — сообщения о проблемах",
  "bot:companion": "src/lib/companion.ts — режим беседы с AI-другом",
  "bot:photo": "src/lib/knowledge.ts / route.ts — фото и воспоминания",
  "bot:book-photo": "src/lib/books.ts — книга по обложке",
  "bot:document": "route.ts — приём файлов",
  "bot:notes-import": "src/lib/notes.ts — импорт заметок",
  "bot:import-link": "src/lib/instagram.ts — импорт по ссылке",
  "bot:wishlist": "src/lib/wishlist.ts — вишлист",
  "bot:money": "src/lib/financeCoach.ts — финансовый разбор",
  "bot:finance-quick": "src/lib/finance.ts — быстрая запись трат",
  "bot:backfill": "src/lib/acquaint.ts — восстановление записей знакомства",
  "bot:pushmenu": "src/lib/morningPrefs.ts — настройки пушей",
  "cron": "src/app/api/cron/route.ts — расписания и рассылки",
};

export type Issue = {
  title: string;
  severity: 1 | 2 | 3;   // 1 — люди теряют данные или бот молчит; 3 — косметика
  impact: string;        // кого и как задевает, человеческим языком
  where: string;         // где искать причину
  hypothesis: string;    // наиболее вероятная причина
  fix: string;           // что конкретно сделать
};

export type Diagnosis = { issues: Issue[]; sources: { selftest: number; errors: number; complaints: number } };

// ===== Сбор фактов =====

type Complaint = { text: string; created_at: string };
type SelftestFail = { name: string; why: string; at: string };

async function recentSelftestFailures(hours: number): Promise<SelftestFail[]> {
  try {
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data } = await supabaseAdmin()
      .from("selftest_runs").select("started_at, failures")
      .gte("started_at", since).gt("failed", 0).order("started_at", { ascending: false }).limit(50);
    const out: SelftestFail[] = [];
    for (const r of ((data as any[]) || [])) {
      for (const f of ((r.failures as any[]) || [])) out.push({ name: f.name, why: f.why, at: r.started_at });
    }
    return out;
  } catch {
    return [];
  }
}

async function recentComplaints(hours: number): Promise<Complaint[]> {
  try {
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data } = await supabaseAdmin()
      .from("feedback").select("text, created_at")
      .eq("kind", "bug").gte("created_at", since).order("created_at", { ascending: false }).limit(30);
    return ((data as any[]) || []).map((r) => ({ text: String(r.text || "").slice(0, 600), created_at: r.created_at }));
  } catch {
    return [];
  }
}

// Повторяющиеся падения самопроверки схлопываем: «упало 20 раз подряд» — это
// один баг, а не двадцать.
function groupFailures(fails: SelftestFail[]): { name: string; why: string; n: number; since: string }[] {
  const map = new Map<string, { name: string; why: string; n: number; since: string }>();
  for (const f of fails) {
    const g = map.get(f.name);
    if (g) { g.n++; if (f.at < g.since) g.since = f.at; }
    else map.set(f.name, { name: f.name, why: f.why, n: 1, since: f.at });
  }
  return [...map.values()].sort((a, b) => b.n - a.n);
}

function whereHint(scope: string): string {
  for (const [k, v] of Object.entries(SCOPE_MAP)) if (scope.startsWith(k)) return v;
  return "точное место неизвестно — смотри по названию области";
}

// ===== Разбор моделью =====

const SYS = `Ты — инженер, который каждое утро разбирает, что сломалось в продукте за сутки, и говорит владельцу коротко и по делу.

Владелец НЕ программист. Пиши так, чтобы он понял, что происходит с его сервисом и насколько это срочно, но пути к файлам указывай точно — по ним будет работать другой агент.

ПРАВИЛА:
— Приоритет по ЛЮДЯМ, а не по числу строк в логе. Одна ошибка у двенадцати человек важнее сотни повторов у одного.
— severity 1 — люди теряют данные или бот молчит; 2 — заметно мешает, но обходится; 3 — косметика.
— Не выдумывай причин. Если данных мало, так и скажи в hypothesis и предложи, что посмотреть, чтобы понять.
— Схожие симптомы из разных источников (падение самопроверки + жалоба человека + ошибка в журнале) объединяй в ОДИН пункт: скорее всего это один баг.
— Максимум 6 пунктов. Если всё спокойно — верни пустой список.
— fix: одно-два предложения, что конкретно сделать. Без кода.

Верни ТОЛЬКО JSON: {"issues":[{"title":"","severity":1,"impact":"","where":"","hypothesis":"","fix":""}]}`;

async function ask(prompt: string): Promise<Issue[]> {
  const models = ["claude-sonnet-5", "claude-sonnet-4-6"]; // если новой модели нет — работаем на текущей
  for (const model of models) {
    try {
      const m = await client().messages.create({
        model, max_tokens: 2000, temperature: 0.2,
        system: SYS,
        messages: [{ role: "user", content: prompt }],
      });
      logClaude(OWNER_ID, "diagnosis", "sonnet", (m as any).usage);
      const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join(" ").trim();
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(json);
      const issues: Issue[] = Array.isArray(parsed.issues) ? parsed.issues : [];
      return issues
        .filter((i) => i && typeof i.title === "string" && i.title.trim())
        .map((i) => ({
          title: String(i.title).slice(0, 200),
          severity: ([1, 2, 3].includes(Number(i.severity)) ? Number(i.severity) : 2) as 1 | 2 | 3,
          impact: String(i.impact || "").slice(0, 500),
          where: String(i.where || "").slice(0, 300),
          hypothesis: String(i.hypothesis || "").slice(0, 700),
          fix: String(i.fix || "").slice(0, 700),
        }))
        .slice(0, 6);
    } catch (e) {
      if (model === models[models.length - 1]) throw e;
    }
  }
  return [];
}

export async function diagnose(hours = 24): Promise<Diagnosis> {
  const [fails, errors, complaints] = await Promise.all([
    recentSelftestFailures(hours),
    errorDigest(hours),
    recentComplaints(hours),
  ]);

  const grouped = groupFailures(fails);
  const sources = { selftest: grouped.length, errors: errors.length, complaints: complaints.length };
  if (!grouped.length && !errors.length && !complaints.length) return { issues: [], sources };

  const parts: string[] = [];
  if (grouped.length) {
    parts.push(`ПАДЕНИЯ САМОПРОВЕРКИ (бот проверяет себя каждые 15 минут):\n${grouped
      .map((g) => `— «${g.name}»: ${g.why}. Падало ${g.n} раз(а), с ${g.since.slice(0, 16).replace("T", " ")}`).join("\n")}`);
  }
  if (errors.length) {
    parts.push(`ЖУРНАЛ СБОЕВ (сгруппировано, отсортировано по числу задетых людей):\n${errors.slice(0, 20)
      .map((e: ErrorGroup) => `— [${e.scope}] ${e.message}\n  людей: ${e.users}, случаев: ${e.n}, с ${e.first.slice(0, 16).replace("T", " ")} по ${e.last.slice(0, 16).replace("T", " ")}\n  где искать: ${whereHint(e.scope)}`).join("\n")}`);
  }
  if (complaints.length) {
    parts.push(`ЖАЛОБЫ ЖИВЫХ ЛЮДЕЙ (из команды /problem в боте):\n${complaints
      .map((c) => `— ${c.text.replace(/\s+/g, " ")}`).join("\n")}`);
  }

  const issues = await ask(`Вот что случилось за последние ${hours} часов.\n\n${parts.join("\n\n")}`);
  return { issues, sources };
}

// ===== Доставка =====

const SEV = { 1: "🔴", 2: "🟠", 3: "🟡" } as const;

function render(d: Diagnosis, hours: number): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (!d.issues.length) {
    return `🩺 <b>Разбор за ${hours} ч</b>\n\nВсё спокойно: самопроверка проходит, сбоев и жалоб нет.`;
  }
  const body = d.issues.map((i) => [
    `${SEV[i.severity]} <b>${esc(i.title)}</b>`,
    `Кого задевает: ${esc(i.impact)}`,
    `Скорее всего: ${esc(i.hypothesis)}`,
    `Где искать: <code>${esc(i.where)}</code>`,
    `Что сделать: ${esc(i.fix)}`,
  ].join("\n")).join("\n\n");
  return `🩺 <b>Разбор за ${hours} ч</b>\n<i>падений самопроверки: ${d.sources.selftest} · групп сбоев: ${d.sources.errors} · жалоб: ${d.sources.complaints}</i>\n\n${body}`;
}

// Серьёзные пункты кладём в бэклог владельца, чтобы они не растворились в чате.
// Дубли отсекаем по названию: разбор идёт каждый день, а баг может жить неделю.
async function toBacklog(issues: Issue[]): Promise<number> {
  const open = await getAdminTasks().catch(() => []);
  const seen = new Set(open.filter((t) => !t.done).map((t) => t.title.toLowerCase().slice(0, 80)));
  let added = 0;
  for (const i of issues) {
    if (i.severity > 2) continue;
    const title = `${SEV[i.severity]} ${i.title}`.slice(0, 300);
    if (seen.has(title.toLowerCase().slice(0, 80))) continue;
    const note = `Кого задевает: ${i.impact}\n\nСкорее всего: ${i.hypothesis}\n\nГде искать: ${i.where}\n\nЧто сделать: ${i.fix}\n\n— автоматический разбор`;
    const ok = await addAdminTask(title, note).catch(() => null);
    if (ok) { added++; seen.add(title.toLowerCase().slice(0, 80)); }
  }
  return added;
}

export async function runDiagnosis(hours = 24): Promise<{ issues: number; tasks: number; sent: boolean }> {
  const d = await diagnose(hours);
  const tasks = d.issues.length ? await toBacklog(d.issues).catch(() => 0) : 0;

  const owner = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID || 0);
  let sent = false;
  // Когда всё спокойно и разбирать нечего — не пишем вообще: ежедневное «всё ок»
  // быстро превращается в шум, который перестают читать.
  if (owner && d.issues.length) {
    const tail = tasks ? `\n\n📋 Добавлено в «Отложенные задачи»: ${tasks}` : "";
    await sendMessage(owner, render(d, hours) + tail);
    sent = true;
  }
  return { issues: d.issues.length, tasks, sent };
}
