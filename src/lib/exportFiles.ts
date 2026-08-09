import { supabaseAdmin } from "./supabaseAdmin";
import { parseStorageUrl } from "./fileLink";

// Файлы для выгрузки «унести всё своё».
//
// Раньше в архив клались только ссылки — и после закрытия бакетов они живут
// неделю. Это половинчато: человек должен уносить сами файлы, а не адреса.
// Здесь мы собираем список его файлов, узнаём вес и режем на части, потому
// что архив на 300 МБ один запрос не переживёт.

export type ExportFile = { bucket: string; path: string; name: string; size: number };

// Сколько весит одна часть архива. Ограничение не наше, а хостинга: один
// запрос живёт минуту, и за это время надо успеть скачать файлы из хранилища
// и отдать их человеку. 35 МБ проходят с запасом.
export const MAX_PART_BYTES = 35 * 1024 * 1024;

export function humanSize(bytes: number, locale = "ru"): string {
  const mb = bytes / (1024 * 1024);
  const unit = locale === "ru" || locale === "uk" ? ["КБ", "МБ", "ГБ"] : ["KB", "MB", "GB"];
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ${unit[0]}`;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} ${unit[1]}`;
  return `${(mb / 1024).toFixed(1)} ${unit[2]}`;
}

// Имя внутри архива: папка по смыслу + собственное имя файла.
// Названия латиницей намеренно: кириллицу в именах внутри zip некоторые
// распаковщики (особенно на Windows) показывают кашей. Что где лежит —
// объясняет README внутри архива.
const FOLDER: Record<string, string> = {
  memories: "memory-documents",
  voices: "voice-recordings",
  dreams: "dreams",
  saved: "saved-from-social",
  wishes: "wishlist",
};

function nameFor(bucket: string, path: string): string {
  const base = path.split("/").pop() || "file";
  return `${FOLDER[bucket] || bucket}/${base}`;
}

// Все адреса файлов пользователя, какие есть в его данных.
async function collectUrls(userId: string): Promise<string[]> {
  const db = supabaseAdmin();
  const out: string[] = [];
  const push = (v: any) => {
    if (typeof v === "string" && v) out.push(v);
    else if (Array.isArray(v)) v.forEach(push);
  };

  const jobs: [string, string][] = [
    ["memories", "image_url, file_url"],
    ["entries", "voice_url"],
    ["dreams", "image_url"],
    ["trips", "cover_url, photos"],
    ["saved_items", "image_url, image_urls, video_url"],
  ];
  for (const [table, sel] of jobs) {
    try {
      const { data } = await db.from(table).select(sel).eq("user_id", userId).limit(2000);
      for (const row of (data as any[]) || []) for (const k of Object.keys(row)) push(row[k]);
    } catch {
      // таблицы или колонки может не быть — пропускаем, выгрузка не ломается
    }
  }
  return out;
}

// Список файлов с весом. Вес спрашиваем у хранилища одним запросом на папку,
// а не на каждый файл: иначе сотня файлов — сотня запросов.
export async function listExportFiles(userId: string): Promise<ExportFile[]> {
  const db = supabaseAdmin();
  const refs = new Map<string, { bucket: string; path: string }>();
  for (const url of await collectUrls(userId)) {
    const p = parseStorageUrl(url);
    if (p) refs.set(`${p.bucket}/${p.path}`, p);
  }
  if (!refs.size) return [];

  // Папки, которые надо перечислить.
  const dirs = new Map<string, Set<string>>();
  for (const { bucket, path } of refs.values()) {
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    (dirs.get(bucket) || dirs.set(bucket, new Set()).get(bucket)!).add(dir);
  }

  const sizes = new Map<string, number>();
  for (const [bucket, set] of dirs) {
    for (const dir of set) {
      try {
        const { data } = await db.storage.from(bucket).list(dir, { limit: 1000 });
        for (const f of (data as any[]) || []) {
          const full = dir ? `${dir}/${f.name}` : f.name;
          sizes.set(`${bucket}/${full}`, Number(f?.metadata?.size) || 0);
        }
      } catch {
        // папки нет — файлы из неё просто останутся без веса
      }
    }
  }

  const files = [...refs.entries()]
    .map(([key, { bucket, path }]) => ({ bucket, path, name: nameFor(bucket, path), size: sizes.get(key) || 0 }))
    .filter((f) => f.size > 0) // чего нет в хранилище, того и в архиве не будет
    .sort((a, b) => (a.name < b.name ? -1 : 1));

  // Два разных файла с одинаковым именем молча затёрли бы друг друга в архиве.
  const seen = new Set<string>();
  for (const f of files) {
    if (!seen.has(f.name)) {
      seen.add(f.name);
      continue;
    }
    const dot = f.name.lastIndexOf(".");
    const stem = dot > 0 ? f.name.slice(0, dot) : f.name;
    const ext = dot > 0 ? f.name.slice(dot) : "";
    let n = 2;
    while (seen.has(`${stem}-${n}${ext}`)) n++;
    f.name = `${stem}-${n}${ext}`;
    seen.add(f.name);
  }
  return files;
}

// Режем на части так, чтобы каждая влезла в один запрос. Порядок файлов
// строго определён, поэтому «часть 3» — это всегда одни и те же файлы.
export function splitParts(files: ExportFile[], maxBytes = MAX_PART_BYTES): ExportFile[][] {
  const parts: ExportFile[][] = [];
  let cur: ExportFile[] = [];
  let sum = 0;
  for (const f of files) {
    if (cur.length && sum + f.size > maxBytes) {
      parts.push(cur);
      cur = [];
      sum = 0;
    }
    cur.push(f);
    sum += f.size;
  }
  if (cur.length) parts.push(cur);
  return parts;
}
