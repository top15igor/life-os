import { supabaseAdmin } from "./supabaseAdmin";

// Убираем символы, которые PostgreSQL отказывается писать в text/jsonb: нулевой байт
// и прочие управляющие C0-символы (кроме \t \n \r). Такое иногда попадает в расшифровку
// Whisper или подпись поста и роняет весь insert. Чистим рекурсивно строки на любом
// уровне (в т.ч. в массивах key_points/tags/image_urls).
function sanitize(v: any): any {
  if (typeof v === "string") return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === "object") {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) out[k] = sanitize(val);
    return out;
  }
  return v;
}

// Вставка карточки в saved_items с грациозной деградацией: если файловые колонки
// (video_url/video_size из миграции saved_video.sql, image_urls из saved_images.sql)
// ещё не созданы — повторяем вставку без них, чтобы сохранение не падало на
// не-обновлённой базе. onError (опц.) получает текст реальной ошибки БД для диагностики.
export async function insertSavedItem(row: Record<string, any>, onError?: (msg: string) => void): Promise<string | null> {
  const db = supabaseAdmin();
  const clean = sanitize(row);
  const { data, error } = await db.from("saved_items").insert(clean).select("id").single();
  if (!error) return (data as any)?.id || null;

  if ("video_url" in clean || "video_size" in clean || "image_urls" in clean) {
    const { video_url, video_size, image_urls, ...rest } = clean;
    const retry = await db.from("saved_items").insert(rest).select("id").single();
    if (!retry.error) return (retry.data as any)?.id || null;
    console.error("saved insert retry", retry.error);
    onError?.(String(retry.error?.message || retry.error?.code || retry.error));
    return null;
  }
  console.error("saved insert", error);
  onError?.(String(error?.message || error?.code || error));
  return null;
}
