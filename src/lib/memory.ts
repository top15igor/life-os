import { supabaseAdmin } from "./supabaseAdmin";
import { indexRow } from "./vaultIndex";
import { geoTagMemory, placeNameAt, saveGeo, type PhotoPoint } from "./photoGeo";
import { readVideoMetaFromUrl } from "./videoMeta";
import { analyzeImage, analyzeDocument, analyzeText, type VisionResult } from "./vision";
import { extractText } from "./docText";

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
export async function createMemoryFromImage(userId: string, buf: Buffer, mediaType: string, entryId?: string, geoOpts?: { caption?: string; lang?: string }): Promise<{ memory: Memory | null; vision: VisionResult; geo: PhotoPoint | null }> {
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
        folder: vision.folder || null,
        mem_date: vision.date || null,
        image_url,
        status: vision.confidence === "low" ? "review" : "ok",
      })
      .select("id, category, title, summary, fields, folder, mem_date, image_url, status, created_at")
      .single();
    memory = (data as any) || null;
  } catch {
    // Колонки folder ещё нет (миграция не применена) — сохраняем без неё.
    try {
      const { data } = await db
        .from("memories")
        .insert({ user_id: userId, entry_id: entryId ?? null, category: vision.category, title: vision.title, summary: vision.summary, fields: vision.fields, mem_date: vision.date || null, image_url, status: vision.confidence === "low" ? "review" : "ok" })
        .select("id, category, title, summary, fields, mem_date, image_url, status, created_at")
        .single();
      memory = (data as any) || null;
    } catch {}
  }

  // Смысловой указатель: без него документ найдётся только по точному слову.
  if (memory?.id) await indexRow("memories", memory.id, userId);
  // Точка на карте жизни: координаты берём из самого файла (и, если их там нет,
  // из подписи). Снимок без координат просто не встанет на карту — это нормально.
  const geo = memory?.id ? await geoTagMemory(memory.id, userId, buf, { ...geoOpts, mediaType }) : null;
  if (!geo && memory?.id) await rememberGuess(memory.id, userId, vision.place);
  return { memory, vision, geo };
}

// Координат в файле не нашлось, но AI УЗНАЛ место на снимке («Водопад
// Брюарфосс, Исландия»). Запоминаем это название рядом со снимком: точку по
// нему не ставим (AI может ошибиться), но человеку больше не придётся искать
// место на карте руками — приложение предложит, а он подтвердит одним нажатием.
//
// Координаты не храним намеренно: колонок под догадку нет, а название легко
// превратить в точку в момент подтверждения.
async function rememberGuess(memoryId: string, userId: string, place?: string | null): Promise<void> {
  const name = (place || "").trim();
  if (name.length < 3 || name.length > 120) return;
  try {
    await supabaseAdmin()
      .from("memories")
      .update({ place_name: name, geo_source: "guess" })
      .eq("id", memoryId)
      .eq("user_id", userId);
  } catch {}
}

// Загрузить ЛЮБОЙ файл (фото или PDF), распознать его смысл и сохранить в «Визуальную память».
// Для PDF Claude читает документ напрямую; файл кладём в хранилище и ссылаемся через file_url.
// storedPath — файл УЖЕ лежит в хранилище (массовая загрузка кладёт его туда
// напрямую, минуя наш сервер: у хостинга жёсткий предел на размер запроса,
// и десятимегабайтный PDF через него просто не проходит). Тогда не заливаем
// повторно, а ссылаемся на готовое.
export async function createMemoryFromFile(userId: string, buf: Buffer, mediaType: string, fileName?: string, entryId?: string, storedPath?: string, geoOpts?: { caption?: string; lang?: string }): Promise<{ memory: Memory | null; vision: VisionResult; geo: PhotoPoint | null }> {
  const db = supabaseAdmin();
  const isImage = mediaType.startsWith("image/");
  const isVideo = mediaType.startsWith("video/");
  const ext = isImage
    ? (mediaType.includes("png") ? "png" : mediaType.includes("webp") ? "webp" : "jpg")
    : (mediaType === "application/pdf" ? "pdf" : ((fileName || "").match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() || (isVideo ? "mp4" : "bin")));
  const path = storedPath || `${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  let url: string | null = null;
  if (storedPath) {
    url = db.storage.from("memories").getPublicUrl(path).data?.publicUrl || null;
  } else {
    try {
      const { error } = await db.storage.from("memories").upload(path, buf, { contentType: mediaType, upsert: true });
      if (!error) url = db.storage.from("memories").getPublicUrl(path).data?.publicUrl || null;
    } catch {}
  }

  let vision: VisionResult;
  try {
    if (isImage) vision = await analyzeImage(buf.toString("base64"), mediaType, userId);
    // Видео AI-зрение не смотрит: смысл берём из подписи человека и имени файла,
    // а само место в жизни ролику даёт карта — по координатам съёмки.
    else if (isVideo) vision = { category: "moment", title: (geoOpts?.caption || "").slice(0, 80) || fileName || "Видео", summary: geoOpts?.caption || "", fields: [] };
    else if (mediaType === "application/pdf") vision = await analyzeDocument(buf.toString("base64"), userId);
    else {
      // Офисные и текстовые файлы Claude напрямую не читает — достаём текст сами.
      const ex = await extractText(buf, mediaType, fileName);
      vision = ex && ex.text.trim() ? await analyzeText(ex.text, fileName, userId) : { category: "document", title: fileName || "Документ", summary: "", fields: [] };
    }
  } catch {
    vision = { category: isImage ? "other" : isVideo ? "moment" : "document", title: fileName || (isImage ? "Фото" : isVideo ? "Видео" : "Документ"), summary: "", fields: [] };
  }

  const base: any = {
    user_id: userId,
    entry_id: entryId ?? null,
    category: vision.category,
    title: vision.title,
    summary: vision.summary,
    fields: vision.fields,
    folder: vision.folder || null,
    mem_date: vision.date || null,
    image_url: isImage ? url : null,
    status: vision.confidence === "low" ? "review" : "ok",
  };
  const sel = "id, category, title, summary, fields, folder, mem_date, image_url, status, created_at";
  const { folder: _f, ...baseNoFolder } = base; // запас, если колонки folder ещё нет
  const selNoFolder = "id, category, title, summary, fields, mem_date, image_url, status, created_at";

  let memory: Memory | null = null;
  try {
    const { data, error } = await db.from("memories").insert({ ...base, file_url: url, file_name: fileName || null, mime_type: mediaType }).select(sel).single();
    if (error) throw error;
    memory = (data as any) || null;
  } catch {
    // Колонок file_*/folder ещё нет (миграция не применена) — сохраняем хотя бы смысл и метаданные.
    try {
      const { data } = await db.from("memories").insert(baseNoFolder).select(selNoFolder).single();
      memory = (data as any) || null;
    } catch {}
  }

  // Смысловой указатель: без него документ найдётся только по точному слову.
  if (memory?.id) await indexRow("memories", memory.id, userId);
  // Фото, присланное файлом, — единственный путь, где координаты съёмки доходят
  // до нас целыми: Telegram вырезает их из сжатых картинок.
  const geo = memory?.id && (isImage || isVideo) ? await geoTagMemory(memory.id, userId, buf, { ...geoOpts, mediaType }) : null;
  if (!geo && memory?.id && (isImage || isVideo)) await rememberGuess(memory.id, userId, vision.place);
  return { memory, vision, geo };
}

// Ролик уже лежит в хранилище (браузер залил его напрямую) — заводим ему карточку.
//
// Почему отдельным путём, а не через createMemoryFromFile: видео с телефона
// весит сотни мегабайт, и втягивать его в память сервера ради заголовка нельзя.
// Смысл ролику даёт человек (подпись), координаты — метаданные съёмки, которые
// читаются кусочками по краям файла.
export async function createVideoMemory(
  userId: string,
  storedPath: string,
  fileName: string,
  mediaType: string,
  opts?: { caption?: string; lang?: string; size?: number },
): Promise<{ memory: Memory | null; geo: PhotoPoint | null }> {
  const db = supabaseAdmin();
  const url = db.storage.from("memories").getPublicUrl(storedPath).data?.publicUrl || null;
  const title = (opts?.caption || "").trim().slice(0, 80) || fileName || "Видео";

  const base: any = {
    user_id: userId,
    category: "moment",
    title,
    summary: (opts?.caption || "").trim(),
    fields: [],
    mem_date: null,
    image_url: null,
    status: "ok",
  };

  let memory: Memory | null = null;
  try {
    const { data, error } = await db
      .from("memories")
      .insert({ ...base, file_url: url, file_name: fileName || null, mime_type: mediaType })
      .select("id, category, title, summary, fields, mem_date, image_url, status, created_at")
      .single();
    if (error) throw error;
    memory = (data as any) || null;
  } catch {
    return { memory: null, geo: null };
  }

  if (memory?.id) await indexRow("memories", memory.id, userId);

  let geo: PhotoPoint | null = null;
  try {
    const { data: signed } = await db.storage.from("memories").createSignedUrl(storedPath, 300);
    if (signed?.signedUrl && memory?.id) {
      const meta = await readVideoMetaFromUrl(signed.signedUrl, opts?.size);
      if (meta.lat !== null && meta.lng !== null) {
        const place = await placeNameAt(meta.lat, meta.lng, opts?.lang || "ru");
        const point: PhotoPoint = { lat: meta.lat, lng: meta.lng, place, source: "exif", shotAt: meta.shotAt };
        if (await saveGeo(memory.id, userId, point)) geo = point;
      } else if (meta.shotAt) {
        try { await db.from("memories").update({ shot_at: meta.shotAt }).eq("id", memory.id).eq("user_id", userId); } catch {}
      }
    }
  } catch {}

  return { memory, geo };
}
