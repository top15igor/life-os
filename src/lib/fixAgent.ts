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
// Читать можно и большие файлы: главный файл бота — 175 КБ, и именно в нём живёт
// большинство багов. А вот ПЕРЕПИСЫВАТЬ такой файл целиком нельзя — ответ модели
// оборвётся на середине и превратит рабочий код в мусор. Поэтому агент возвращает
// не файл, а точечные замены «этот кусок → на этот».
const MAX_FILE_BYTES = 400_000;
const MIN_ANCHOR = 20; // слишком короткий кусок найдётся в файле десять раз

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

// Имя ветки — только латиницей: кириллица в ref формально работает, но GitHub
// ругается на «скрытые символы», а часть инструментов такие ветки не тянет.
// Просто выбросить кириллицу нельзя — от русского заголовка не останется ничего,
// и все ветки станут называться одинаково. Поэтому транслитерируем.
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g",
};

export function branchSlug(title: string): string {
  const latin = [...title.toLowerCase()].map((c) => (c in TRANSLIT ? TRANSLIT[c] : c)).join("");
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "") || "issue";
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

// Без объединения типов: в проекте нестрогий TypeScript, и сужение по
// discriminated union здесь не работает — компилятор не поймёт, какая половина.
type ReadResult = { ok: boolean; text: string; sha: string; why: string };

const readFail = (why: string): ReadResult => ({ ok: false, text: "", sha: "", why });

async function readFile(token: string, path: string, ref: string): Promise<ReadResult> {
  try {
    const j: any = await gh(token).get(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(ref)}`);
    if (!j?.content) return readFail(`${path}: файл пустой или недоступен`);
    const text = Buffer.from(j.content, "base64").toString("utf8");
    if (text.length > MAX_FILE_BYTES) {
      return readFail(`${path}: слишком большой (${Math.round(text.length / 1024)} КБ, предел ${Math.round(MAX_FILE_BYTES / 1024)} КБ)`);
    }
    return { ok: true, text, sha: j.sha, why: "" };
  } catch (e: any) {
    return readFail(`${path}: ${String(e?.message || e).slice(0, 120)}`);
  }
}

// ===== Модель =====

const PICK_SYS = `Ты — инженер, который по описанию бага решает, какие файлы нужно прочитать, чтобы его починить.

Тебе дают описание проблемы и список файлов проекта. Верни ТОЛЬКО JSON:
{"files":["src/lib/xxx.ts"],"why":"одно предложение"}

Правила: максимум 3 файла, только те, что реально нужны. Пути бери ТОЧНО из списка — выдуманный путь сломает работу.`;

const FIX_SYS = `Ты — аккуратный инженер, который чинит один конкретный баг в работающем продукте. Продуктом пользуются живые люди прямо сейчас.

Ты НЕ переписываешь файлы целиком. Ты возвращаешь точечные замены: кусок кода, который надо заменить, и то, на что его заменить.

ПРАВИЛА ЗАМЕН:
— В поле "old" — точная копия куска из файла, СИМВОЛ В СИМВОЛ, вместе с отступами и переносами строк. Любое расхождение — и замена не применится.
— Кусок в "old" должен встречаться в файле РОВНО ОДИН РАЗ. Если строка не уникальна, захвати вокруг неё побольше контекста.
— Кусок должен быть не короче 20 символов.
— Меняй как можно меньше: не трогай строки, которые не относятся к багу.
— Чтобы создать НОВЫЙ файл, верни замену с "old": "" и полным содержимым в "new".

ПРАВИЛА ПРАВКИ:
— Чинишь ТОЛЬКО описанный баг, ничего не рефакторишь и не улучшаешь по дороге.
— Если из данных не видно причины — НЕ выдумывай правку. Верни пустой edits и объясни в summary, чего именно не хватает.
— Сохраняй стиль файла: те же отступы, тот же язык комментариев, та же манера именования.
— Комментарий пиши только там, где объясняет ПОЧЕМУ, а не что делает строка.
— Не ломай публичные сигнатуры функций, если это не суть правки.

Верни ТОЛЬКО JSON:
{"summary":"что и почему изменено, 1-3 предложения","risk":"чем это может аукнуться и как проверить","edits":[{"path":"src/...","old":"точный кусок из файла","new":"чем заменить"}]}`;

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
    const skipped: string[] = [];
    for (const p of wanted) {
      const f = await readFile(token, p, base);
      if (f.ok) files.push({ path: p, text: f.text, sha: f.sha });
      else skipped.push(f.why);
    }
    if (!files.length) return { ok: false, error: `не удалось прочитать файлы — ${skipped.join("; ")}` };

    const body = files.map((f) => `=== ${f.path} ===\n${f.text}`).join("\n\n");
    const fix = await askModel(FIX_SYS, `ПРОБЛЕМА:\n${description}\n\nФАЙЛЫ:\n\n${body}`, 8000);

    const edits: { path: string; old: string; new: string }[] = (Array.isArray(fix?.edits) ? fix.edits : [])
      .filter((e: any) => e && typeof e.path === "string" && typeof e.old === "string" && typeof e.new === "string" && allowedPath(e.path));

    const summary = String(fix?.summary || "").slice(0, 1000);
    if (!edits.length) return { ok: false, error: `агент не стал менять код: ${summary || "причина не установлена по имеющимся данным"}` };

    // Применяем замены к тексту файлов. Каждый кусок обязан найтись ровно один
    // раз: не нашёлся — модель придумала код, которого нет; нашёлся дважды —
    // непонятно, какое из мест чинить. И то и другое лучше отклонить, чем
    // угадывать и молча испортить рабочий файл.
    const edited = new Map<string, string>();
    for (const e of edits) {
      if (e.old === "") {
        // Создание нового файла — только если такого ещё нет.
        if (files.some((f) => f.path === e.path) || edited.has(e.path)) {
          return { ok: false, error: `агент пытается создать файл ${e.path}, который уже существует` };
        }
        if (!e.new.trim()) return { ok: false, error: `пустое содержимое нового файла ${e.path}` };
        edited.set(e.path, e.new);
        continue;
      }
      if (e.old.length < MIN_ANCHOR) {
        return { ok: false, error: `слишком короткий кусок для замены в ${e.path} — по нему нельзя понять место однозначно` };
      }
      const current = edited.get(e.path) ?? files.find((f) => f.path === e.path)?.text;
      if (current === undefined) return { ok: false, error: `агент правит файл ${e.path}, которого не читал` };
      const first = current.indexOf(e.old);
      if (first === -1) {
        return { ok: false, error: `в файле ${e.path} нет куска, который агент собрался заменить — правка отклонена` };
      }
      if (current.indexOf(e.old, first + 1) !== -1) {
        return { ok: false, error: `кусок для замены встречается в ${e.path} несколько раз — непонятно, какое место чинить` };
      }
      edited.set(e.path, current.slice(0, first) + e.new + current.slice(first + e.old.length));
    }

    const changed = [...edited.entries()].map(([path, content]) => ({ path, content })).slice(0, MAX_FILES);

    // Страховка от потери содержимого: точечные замены не могут вдвое укоротить файл.
    for (const c of changed) {
      const before = files.find((f) => f.path === c.path);
      if (before && c.content.length < before.text.length * 0.5) {
        return { ok: false, error: `правка выглядит как потеря содержимого файла ${c.path} — не создаю PR` };
      }
    }

    // 5. Ветка, коммиты, PR.
    const slug = branchSlug(issue.title);
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
