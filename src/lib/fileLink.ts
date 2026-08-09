import { supabaseAdmin } from "./supabaseAdmin";

// Ссылка на файл для отправки в Telegram.
//
// Файлы «Памяти» (сканы паспортов, договоры, чеки) лежат в хранилище Supabase,
// и в базе записан ПУБЛИЧНЫЙ адрес. Это значит, что скан паспорта доступен
// любому, кто знает ссылку, — для документов такого рода это плохо.
//
// Поэтому перед отправкой мы выписываем ВРЕМЕННУЮ подписанную ссылку: живёт
// пару минут, Telegram успевает скачать файл, дальше она мертва. Заодно это
// позволяет сделать бакет закрытым, ничего не меняя в коде: подписанные ссылки
// работают и там, а публичные — нет.

const BUCKET = "memories";
const TTL_SEC = 180;

// Из публичного адреса достаём путь внутри бакета.
export function pathFromPublicUrl(url: string): string | null {
  const m = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(url || "");
  if (!m) return null;
  if (m[1] !== BUCKET) return null;
  try {
    return decodeURIComponent(m[2]);
  } catch {
    return m[2];
  }
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url || "");
}

// Временная ссылка. Если подписать не вышло (старый бакет, другой путь) —
// возвращаем исходную: лучше отдать файл человеку, чем промолчать.
export async function tempFileUrl(publicUrl: string): Promise<string | null> {
  const url = (publicUrl || "").trim();
  if (!url) return null;
  const path = pathFromPublicUrl(url);
  if (!path) return url;
  try {
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUrl(path, TTL_SEC);
    if (error || !data?.signedUrl) return url;
    return data.signedUrl;
  } catch {
    return url;
  }
}
