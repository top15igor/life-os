import { supabaseAdmin } from "./supabaseAdmin";
import { analyzeImage, analyzeDocument, type VisionResult } from "./vision";

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

// Загрузить ЛЮБОЙ файл (фото или PDF), распознать его смысл и сохранить в «Визуальную память».
// Для PDF Claude читает документ напрямую; файл кладём в хранилище и ссылаемся через file_url.
export async function createMemoryFromFile(userId: string, buf: Buffer, mediaType: string, fileName?: string, entryId?: string): Promise<{ memory: Memory | null; vision: VisionResult }> {
  const db = supabaseAdmin();
  const isImage = mediaType.startsWith("image/");
  const ext = isImage
    ? (mediaType.includes("png") ? "png" : mediaType.includes("webp") ? "webp" : "jpg")
    : (mediaType === "application/pdf" ? "pdf" : ((fileName || "").match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() || "bin"));
  const path = `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  let url: string | null = null;
  try {
    const { error } = await db.storage.from("memories").upload(path, buf, { contentType: mediaType, upsert: true });
    if (!error) url = db.storage.from("memories").getPublicUrl(path).data?.publicUrl || null;
  } catch {}

  let vision: VisionResult;
  try {
    vision = isImage ? await analyzeImage(buf.toString("base64"), mediaType, userId) : await analyzeDocument(buf.toString("base64"), userId);
  } catch {
    vision = { category: isImage ? "other" : "document", title: fileName || (isImage ? "Фото" : "Документ"), summary: "", fields: [] };
  }

  const base: any = {
    user_id: userId,
    entry_id: entryId ?? null,
    category: vision.category,
    title: vision.title,
    summary: vision.summary,
    fields: vision.fields,
    mem_date: vision.date || null,
    image_url: isImage ? url : null,
    status: vision.confidence === "low" ? "review" : "ok",
  };
  const sel = "id, category, title, summary, fields, mem_date, image_url, status, created_at";

  let memory: Memory | null = null;
  try {
    const { data, error } = await db.from("memories").insert({ ...base, file_url: url, file_name: fileName || null, mime_type: mediaType }).select(sel).single();
    if (error) throw error;
    memory = (data as any) || null;
  } catch {
    // Колонок file_* ещё нет (миграция не применена) — сохраняем хотя бы смысл и метаданные.
    try {
      const { data } = await db.from("memories").insert(base).select(sel).single();
      memory = (data as any) || null;
    } catch {}
  }

  return { memory, vision };
}
