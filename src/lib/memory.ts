import { supabaseAdmin } from "./supabaseAdmin";
import { analyzeImage, type VisionResult } from "./vision";

export type Memory = {
  id: string;
  category: string;
  title: string;
  summary: string;
  fields: { label: string; value: string }[];
  mem_date: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
};

// Загрузить картинку в хранилище, прогнать через AI-зрение и сохранить «память».
export async function createMemoryFromImage(userId: string, buf: Buffer, mediaType: string, entryId?: string): Promise<{ memory: Memory | null; vision: VisionResult }> {
  const db = supabaseAdmin();
  const ext = mediaType.includes("png") ? "png" : mediaType.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  let image_url: string | null = null;
  try {
    const { error } = await db.storage.from("memories").upload(path, buf, { contentType: mediaType, upsert: true });
    if (!error) image_url = db.storage.from("memories").getPublicUrl(path).data?.publicUrl || null;
  } catch {}

  let vision: VisionResult;
  try {
    vision = await analyzeImage(buf.toString("base64"), mediaType, userId);
  } catch {
    vision = { category: "other", title: "Фото", summary: "", fields: [] };
  }

  let memory: Memory | null = null;
  try {
    const { data } = await db
      .from("memories")
      .insert({
        user_id: userId,
        entry_id: entryId ?? null,
        category: vision.category,
        title: vision.title,
        summary: vision.summary,
        fields: vision.fields,
        mem_date: vision.date || null,
        image_url,
        status: vision.confidence === "low" ? "review" : "ok",
      })
      .select("id, category, title, summary, fields, mem_date, image_url, status, created_at")
      .single();
    memory = (data as any) || null;
  } catch {}

  return { memory, vision };
}
