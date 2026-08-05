import Anthropic from "@anthropic-ai/sdk";
import { logClaude } from "./usage";

// Агент, который готовит фикс и открывает pull request.
//
// Осознанная граница: агент НИКОГДА не пишет в main. Он создаёт отдельную ветку,
// кладёт туда правку и открывает PR. Дальше GitHub Actions собирает эту ветку
// (см. .github/workflows/pr-build.yml), и владелец видит зелёную сборку до того,
// как что-то попадёт к живым людям. Неверная правка в худшем случае остаётся
// непринятым PR — прод не трогается.
//
// Ограничения намеренно жёсткие: не больше трёх файлов за раз, только src/ и
// supabase/, никаких настроек сборки, зависимостей и расписаний. Агент чинит
// поведение продукта, а не то, как продукт собирается и деплоится.

const OWNER_ID = "00000000-0000-0000-0000-000000000000";
const REPO = process.env.GITHUB_REPO || "top15igor/life-os";
const API = "https://api.github.com";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 120_000;

let _client: Anthropic | null = null;
const client = () => (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));

export type FixResult =
  | { ok: true; url: string; branch: string; files: string[]; summary: string }
  | { ok: false; error: string };

// Что агенту трогать нельзя. Правка расписаний, зависимостей или конфигов
// деплоя — не «починка бага», а изменение того, как всё работает.
function allowedPath(p: string): boolean {
  if (p.includes("..") || p.startsWith("/")) return false;
  if (!/^(src|supabase)\//.test(p)) return false;
  if (/^\.github\//.test(p)) return false;
  if (/(package(-lock)?\.json|next\.config\.mjs|tsconfig\.json|middleware\.ts)$/.test(p)) return false;
  return true;
}

// ===== GitHub =====

function gh(token: string) {
  const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json" };
  return {
    async get(path: string) {
      const r = await fetch(`${API}${path}`, { headers });
      if (!r.ok) throw new Error(`GitHub GET ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
      return r.json();
    },
    async post(path: string, body: any) {
      const r = await fetch(`${API}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`GitHub POST ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
      return r.json();
    },
    async put(path: string, body: any) {
      const r = await fetch(`${API}${path}`, { method: "PUT", headers, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`GitHub PUT ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
      return r.json();
    },
  };
}

async function readFile(token: string, path: string, ref: string): Promise<{ text: string; sha: string } | null> {
  try {
    const j: any = await gh(token).get(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`);
    if (!j?.content) return null;
    const text = Buffer.from(j.content, "base64").toString("utf8");
    if (text.length > MAX_FILE_BYTES) return null;
    return { text, sha: j.sha };
  } catch {
    return null;
  }
}

// ===== Модель =====

const PICK_SYS = `Ты — инженер, который по описанию бага решает, какие файлы нужно прочитать, чтобы его починить.

Тебе дают описание проблемы и список файлов проекта. Верни ТОЛЬКО JSON:
{"files":["src/lib/xxx.ts"],"why":"одно предложение"}

Правила: максимум 3 файла, только те, что реально нужны. Пути бери ТОЧНО из списка — выдуманный путь сломает работу.`;

const FIX_SYS = `Ты — аккуратный инженер, который чинит один конкретный баг в работающем продукте. Продуктом пользуются живые люди прямо сейчас.

ПРАВИЛА:
— Минимальная правка. Чинишь ТОЛЬКО описанный баг, ничего не рефакторишь и не улучшаешь по дороге.
— Если из данных не видно причины — НЕ выдумывай правку. Верни пустой files и объясни в summary, чего не хватает.
— Сохраняй стиль файла: те же отступы, тот же язык комментариев, та же манера именования.
— Комментарий пиши только там, где объясняет ПОЧЕМУ, а не что делает строка.
— Не ломай публичные сигнатуры функций, если это не суть правки.
— Для каждого изменённого файла верни его ПОЛНОЕ новое содержимое.

Верни ТОЛЬКО JSON:
{"summary":"что и почему изменено, 1-3 предложения","risk":"чем это может аукнуться и как проверить","files":[{"path":"src/...","content":"полное новое содержимое"}]}`;

async function askModel(system: string, prompt: string, maxTokens: number): Promise<any> {
  const models = ["claude-sonnet-5", "claude-sonnet-4-6"];
  for (const model of models) {
    try {
      const m = await client().messages.create({ model, max_tokens: maxTokens, temperature: 0.1, system, messages: [{ role: "user", content: prompt }] });
      logClaude(OWNER_ID, "fix-agent", "sonnet", (m as any).usage);
      const raw = m.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim();
      return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch (e) {
      if (model === models[models.length - 1]) throw e;
    }
  }
  return null;
}

// ===== Основной путь =====

export async function prepareFix(issue: { title: string; note?: string | null }): Promise<FixResult> {
  const token = process.env.GITHUB_FIX_TOKEN;
  if (!token) return { ok: false, error: "нет GITHUB_FIX_TOKEN — агент не может открыть pull request" };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "нет ANTHROPIC_API_KEY" };

  const g = gh(token);
  const description = `${issue.title}\n\n${issue.note || ""}`.trim();

  try {
    // 1. Какая ветка основная и на чём стоит.
    const repo: any = await g.get(`/repos/${REPO}`);
    const base = repo.default_branch || "main";
    const baseRef: any = await g.get(`/repos/${REPO}/git/ref/heads/${base}`);
    const baseSha = baseRef.object.sha;

    // 2. Какие файлы вообще есть (дерево целиком, только пути кода).
    const tree: any = await g.get(`/repos/${REPO}/git/trees/${baseSha}?recursive=1`);
    const paths: string[] = (tree.tree || [])
      .filter((t: any) => t.type === "blob" && allowedPath(t.path))
      .map((t: any) => t.path);
    if (!paths.length) return { ok: false, error: "не удалось прочитать дерево репозитория" };

    // 3. Модель выбирает, что читать.
    const pick = await askModel(PICK_SYS, `ПРОБЛЕМА:\n${description}\n\nФАЙЛЫ ПРОЕКТА:\n${paths.join("\n")}`, 500);
    const wanted: string[] = (Array.isArray(pick?.files) ? pick.files : []).filter((p: any) => typeof p === "string" && paths.includes(p)).slice(0, MAX_FILES);
    if (!wanted.length) return { ok: false, error: "агент не смог определить, какие файлы смотреть — опиши проблему конкретнее" };

    // 4. Читаем их и просим правку.
    const files: { path: string; text: string; sha: string }[] = [];
    for (const p of wanted) {
      const f = await readFile(token, p, base);
      if (f) files.push({ path: p, text: f.text, sha: f.sha });
    }
    if (!files.length) return { ok: false, error: "файлы не читаются (слишком большие или их нет)" };

    const body = files.map((f) => `=== ${f.path} ===\n${f.text}`).join("\n\n");
    const fix = await askModel(FIX_SYS, `ПРОБЛЕМА:\n${description}\n\nФАЙЛЫ:\n\n${body}`, 16000);
    const changed: { path: string; content: string }[] = (Array.isArray(fix?.files) ? fix.files : [])
      .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string" && allowedPath(f.path))
      .slice(0, MAX_FILES);

    const summary = String(fix?.summary || "").slice(0, 1000);
    if (!changed.length) return { ok: false, error: `агент не стал менять код: ${summary || "причина не установлена по имеющимся данным"}` };

    // Подозрительно пустой результат — верный признак, что модель «съела» файл.
    for (const c of changed) {
      const before = files.find((f) => f.path === c.path);
      if (before && c.content.length < before.text.length * 0.5) {
        return { ok: false, error: `правка выглядит как потеря содержимого файла ${c.path} — не создаю PR` };
      }
    }

    // 5. Ветка, коммиты, PR.
    const slug = issue.title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "issue";
    const branch = `fix/${slug}-${baseSha.slice(0, 6)}`;
    try {
      await g.post(`/repos/${REPO}/git/refs`, { ref: `refs/heads/${branch}`, sha: baseSha });
    } catch (e: any) {
      if (!/already exists/i.test(String(e?.message))) throw e; // ветка с прошлой попытки — дописываем в неё
    }

    for (const c of changed) {
      const before = files.find((f) => f.path === c.path);
      await g.put(`/repos/${REPO}/contents/${encodeURI(c.path)}`, {
        message: `fix: ${issue.title}`.slice(0, 100),
        content: Buffer.from(c.content, "utf8").toString("base64"),
        branch,
        ...(before ? { sha: before.sha } : {}),
      });
    }

    const prBody = [
      `**Проблема**\n${description}`,
      `**Что сделал агент**\n${summary}`,
      fix?.risk ? `**Чем рискуем и как проверить**\n${String(fix.risk).slice(0, 1000)}` : "",
      `---\nPR подготовлен автоматически по разбору сбоев. Код НЕ проверялся вживую: сборку прогонит CI, поведение проверь сам перед слиянием.`,
    ].filter(Boolean).join("\n\n");

    const pr: any = await g.post(`/repos/${REPO}/pulls`, {
      title: `fix: ${issue.title}`.slice(0, 120), head: branch, base, body: prBody,
    });

    return { ok: true, url: pr.html_url, branch, files: changed.map((c) => c.path), summary };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 300) };
  }
}
