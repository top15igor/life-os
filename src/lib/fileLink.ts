import { supabaseAdmin } from "./supabaseAdmin";

// Ссылки на файлы в хранилище Supabase.
//
// Личные файлы — сканы паспортов, договоры, оригиналы голосовых, картинки
// мечт — лежат в Storage, и в базе записан ПУБЛИЧНЫЙ адрес. Публичный значит
// «открывается у любого, кто знает ссылку», без всякого входа. Для паспорта
// и для голоса из дневника это недопустимо.
//
// Поэтому бакеты закрываются, а мы выписываем ВРЕМЕННУЮ подписанную ссылку в
// момент показа. Старые публичные адреса в базе трогать не нужно: из них
// вынимается путь, а по пути подписывается новая ссылка.

// Закрытые бакеты: ссылки в них подписываются. Остальное отдаётся как есть.
const PRIVATE_BUCKETS = new Set(["memories", "voices", "dreams", "saved", "photo-thumbs"]);

const TTL_TELEGRAM = 180; // файл скачивается сразу
const TTL_WEB = 3600; // страница может быть открыта долго

// Из адреса достаём бакет и путь внутри него. Понимаем и публичный вид, и уже
// подписанный — чтобы не подписывать дважды.
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  const m = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/.exec(url || "");
  if (!m) return null;
  let path = m[2];
  try {
    path = decodeURIComponent(path);
  } catch {
    /* оставляем как есть */
  }
  return { bucket: m[1], path };
}

// Старое имя: код Telegram-ветки ждёт путь именно для «Памяти».
export function pathFromPublicUrl(url: string): string | null {
  const p = parseStorageUrl(url);
  return p && p.bucket === "memories" ? p.path : null;
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url || "");
}

// Общая подписалка. Если подписать не вышло (чужой адрес, открытый бакет) —
// возвращаем исходную ссылку: лучше показать файл, чем пустое место.
async function sign(publicUrl: string | null | undefined, ttl: number): Promise<string | null> {
  const url = (publicUrl || "").trim();
  if (!url) return null;
  const p = parseStorageUrl(url);
  if (!p || !PRIVATE_BUCKETS.has(p.bucket)) return url;
  try {
    const { data, error } = await supabaseAdmin().storage.from(p.bucket).createSignedUrl(p.path, ttl);
    if (error || !data?.signedUrl) return url;
    return data.signedUrl;
  } catch {
    return url;
  }
}

// Для отправки в Telegram.
export async function tempFileUrl(publicUrl: string): Promise<string | null> {
  return sign(publicUrl, TTL_TELEGRAM);
}

// Для показа на странице.
export async function signForWeb(publicUrl: string | null | undefined): Promise<string | null> {
  return sign(publicUrl, TTL_WEB);
}

// Для выгрузки «унести всё своё»: ссылка должна пережить скачивание архива
// и спокойный разбор дома. Неделя.
export async function signForExport(publicUrl: string | null | undefined): Promise<string | null> {
  return sign(publicUrl, 7 * 24 * 3600);
}

// Списки ссылок (у сохранённого поста может быть карусель картинок).
export async function signListForWeb(urls: string[] | null | undefined): Promise<string[] | null> {
  if (!Array.isArray(urls) || !urls.length) return urls ?? null;
  return (await Promise.all(urls.map((u) => signForWeb(u)))).filter(Boolean) as string[];
}

// Подписать МНОГО ссылок одним махом.
//
// Раньше каждая картинка подписывалась отдельным запросом к хранилищу. На
// странице с тремя сотнями снимков это триста запросов разом: часть из них
// хранилище отбрасывает, и вместо миниатюры человек видит битую картинку.
// Хранилище умеет подписывать пачками — этим и пользуемся.
const SIGN_CHUNK = 100;

export async function signBatchForWeb(urls: (string | null | undefined)[], ttl = TTL_WEB): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const byBucket = new Map<string, Map<string, string>>(); // бакет → путь → исходная ссылка

  for (const u of urls || []) {
    const url = (u || "").trim();
    if (!url || out.has(url)) continue;
    const p = parseStorageUrl(url);
    if (!p || !PRIVATE_BUCKETS.has(p.bucket)) { out.set(url, url); continue; }
    let m = byBucket.get(p.bucket);
    if (!m) { m = new Map(); byBucket.set(p.bucket, m); }
    m.set(p.path, url);
  }

  const db = supabaseAdmin();
  for (const [bucket, paths] of byBucket) {
    const all = [...paths.keys()];
    for (let i = 0; i < all.length; i += SIGN_CHUNK) {
      const chunk = all.slice(i, i + SIGN_CHUNK);
      try {
        const { data, error } = await db.storage.from(bucket).createSignedUrls(chunk, ttl);
        if (error || !data) throw error;
        for (const row of data as any[]) {
          const orig = paths.get(String(row?.path || ""));
          if (orig && row?.signedUrl) out.set(orig, row.signedUrl);
        }
      } catch {
        // Не подписалось — лучше показать исходную ссылку, чем пустое место.
        for (const path of chunk) {
          const orig = paths.get(path);
          if (orig) out.set(orig, orig);
        }
      }
    }
  }
  return out;
}

// Подписать список записей разом.
export async function signManyForWeb<T extends Record<string, any>>(rows: T[], fields: string[] = ["image_url"]): Promise<T[]> {
  const urls: string[] = [];
  for (const r of rows || []) for (const f of fields) if (r?.[f]) urls.push(r[f]);
  const signed = await signBatchForWeb(urls);
  return (rows || []).map((r) => {
    if (!r) return r;
    const patch: Record<string, any> = {};
    for (const f of fields) if (r[f] && signed.has(r[f])) patch[f] = signed.get(r[f]);
    return Object.keys(patch).length ? { ...r, ...patch } : r;
  });
}
