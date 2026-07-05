import { supabaseAdmin } from "./supabaseAdmin";

// Вставка карточки в saved_items с грациозной деградацией: если файловые колонки
// (video_url/video_size из миграции saved_video.sql) ещё не созданы — повторяем вставку
// без них, чтобы сохранение не падало на не-обновлённой базе.
export async function insertSavedItem(row: Record<string, any>): Promise<string | null> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("saved_items").insert(row).select("id").single();
  if (!error) return (data as any)?.id || null;

  if ("video_url" in row || "video_size" in row) {
    const { video_url, video_size, ...rest } = row;
    const retry = await db.from("saved_items").insert(rest).select("id").single();
    if (!retry.error) return (retry.data as any)?.id || null;
    console.error("saved insert retry", retry.error);
    return null;
  }
  console.error("saved insert", error);
  return null;
}
