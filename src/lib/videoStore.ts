import { supabaseAdmin } from "./supabaseAdmin";

// Предел размера сохраняемого видео: 50 МБ — это и лимит выгрузки файла ботом Telegram,
// и разумный потолок для хранилища/памяти serverless-функции. Более тяжёлое видео
// (длинные YouTube-ролики) не качаем — карточка всё равно сохранится по подписи/расшифровке.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type StoredVideo = { url: string; size: number };

// Положить уже скачанный буфер в публичный bucket 'saved' → вернуть публичную ссылку.
// Instagram, например, уже качает видео ради расшифровки звука — переиспользуем буфер.
export async function uploadVideo(userId: string, buf: Buffer): Promise<StoredVideo | null> {
  if (!buf || buf.length < 1024 || buf.length > MAX_VIDEO_BYTES) return null;
  try {
    const db = supabaseAdmin();
    const path = `${userId}/video-${Date.now()}-${Math.round(Math.random() * 1e6)}.mp4`;
    const { error } = await db.storage.from("saved").upload(path, buf, { contentType: "video/mp4", upsert: true });
    if (error) {
      console.error("video upload", error);
      return null;
    }
    const url = db.storage.from("saved").getPublicUrl(path).data?.publicUrl || null;
    return url ? { url, size: buf.length } : null;
  } catch (e) {
    console.error("uploadVideo", e);
    return null;
  }
}

// Скачать видео по прямой ссылке (CDN площадки) и положить в bucket 'saved'.
// Возвращает публичную ссылку на mp4 или null (слишком большое / недоступно / ошибка).
export async function storeVideo(userId: string, videoUrl: string, headers?: Record<string, string>): Promise<StoredVideo | null> {
  try {
    const res = await fetch(videoUrl, { headers, redirect: "follow" });
    if (!res.ok) {
      console.error("video fetch", res.status);
      return null;
    }
    // Ранний отсев по content-length, чтобы не тянуть в память заведомо большой файл.
    const len = Number(res.headers.get("content-length") || "0");
    if (len && len > MAX_VIDEO_BYTES) {
      console.error("video too big", len);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return await uploadVideo(userId, buf);
  } catch (e) {
    console.error("storeVideo", e);
    return null;
  }
}
