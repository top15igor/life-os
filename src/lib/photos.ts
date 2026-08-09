import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { embedToVectorString, embedBatch } from "./embeddings";
import { logClaude } from "./usage";

// ===== Фотомодуль: интеллектуальный слой поверх ЧУЖОГО хранилища =====
//
// Оригиналы фотографий живут у человека — на NAS, диске, в выгрузке iCloud.
// Локальный «разведчик» (папка scout/) сканирует их на месте и присылает сюда
// ТОЛЬКО миниатюры, EXIF и хэши. Облако досчитывает смысл: Claude описывает
// миниатюру, описание превращается в вектор — и весь архив становится
// доступен обычному языку: «фото на море летом», «где Эстель на качелях».
//
// Принцип безопасности: у этого кода НЕТ пути к оригиналам вообще. Ломать
// нечего — максимум, что можно испортить, это собственный индекс.

export const THUMB_BUCKET = "photo-thumbs";

export type PhotoSource = { id: string; user_id: string; name: string; kind: string; read_only: boolean; ai_policy: string };

export type IngestItem = {
  path: string;
  file_name?: string;
  ext?: string;
  file_size?: number;
  mime_type?: string;
  captured_at?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  camera_make?: string | null;
  camera_model?: string | null;
  width?: number | null;
  height?: number | null;
  sha256?: string | null;
  phash?: string | null;
  thumb_b64?: string | null; // JPEG-миниатюра, уже сжатая разведчиком
};

// ===== Источники =====

export async function sourceByToken(token: string): Promise<PhotoSource | null> {
  if (!token || token.length < 20) return null;
  try {
    const { data } = await supabaseAdmin()
      .from("photo_sources")
      .select("id, user_id, name, kind, read_only, ai_policy")
      .eq("device_token", token)
      .maybeSingle();
    return (data as PhotoSource) || null;
  } catch {
    return null; // таблиц ещё нет — миграция не применена
  }
}

// Бакет для миниатюр создаём сами при первой надобности — ЗАКРЫТЫМ.
// Миниатюра паспортного фото ничем не публичнее самого паспорта.
let bucketReady = false;
async function ensureThumbBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    const db = supabaseAdmin();
    const { data } = await db.storage.getBucket(THUMB_BUCKET);
    if (!data) await db.storage.createBucket(THUMB_BUCKET, { public: false });
    bucketReady = true;
  } catch {
    bucketReady = true; // уже есть или нет прав — заливка сама покажет
  }
}

// ===== Приём пачки от разведчика =====

// Идемпотентно: ключ (source_id, path). Повторный прогон той же папки просто
// обновит те же строки — разведчик можно прерывать и запускать заново.
export async function ingestBatch(source: PhotoSource, items: IngestItem[]): Promise<{ saved: number; failed: number }> {
  const db = supabaseAdmin();
  await ensureThumbBucket();
  let saved = 0;
  let failed = 0;

  for (const it of items) {
    if (!it?.path) {
      failed++;
      continue;
    }
    try {
      // Миниатюра — по sha256, чтобы точные дубли не плодили копий в хранилище.
      let thumb_url: string | null = null;
      if (it.thumb_b64 && it.sha256) {
        const tpath = `${source.user_id}/${it.sha256}.jpg`;
        const buf = Buffer.from(it.thumb_b64, "base64");
        if (buf.length > 0 && buf.length < 400 * 1024) {
          const { error } = await db.storage.from(THUMB_BUCKET).upload(tpath, buf, { contentType: "image/jpeg", upsert: true });
          if (!error) thumb_url = db.storage.from(THUMB_BUCKET).getPublicUrl(tpath).data?.publicUrl || null;
        }
      }

      const row: any = {
        user_id: source.user_id,
        source_id: source.id,
        path: it.path,
        file_name: it.file_name || it.path.split("/").pop() || null,
        ext: (it.ext || "").toLowerCase() || null,
        file_size: it.file_size ?? null,
        mime_type: it.mime_type || null,
        captured_at: it.captured_at || null,
        gps_lat: it.gps_lat ?? null,
        gps_lng: it.gps_lng ?? null,
        camera_make: it.camera_make || null,
        camera_model: it.camera_model || null,
        width: it.width ?? null,
        height: it.height ?? null,
        sha256: it.sha256 || null,
        phash: it.phash || null,
      };
      if (thumb_url) row.thumb_url = thumb_url;

      const { error } = await db.from("photos").upsert(row, { onConflict: "source_id,path" });
      if (error) throw error;
      saved++;
    } catch {
      failed++;
    }
  }

  try {
    const { count } = await db.from("photos").select("id", { count: "exact", head: true }).eq("source_id", source.id);
    await db.from("photo_sources").update({ photo_count: Number(count) || 0, last_scan_at: new Date().toISOString() }).eq("id", source.id);
  } catch {
    /* счётчик — не повод ронять приём */
  }
  return { saved, failed };
}

// ===== Понимание содержимого (облачный досчёт) =====

// Описание фото из АРХИВА — не то же, что разбор документа в vision.ts.
// Там мы вытаскиваем поля и номера; здесь важны сцена, люди, настроение —
// то, по чему человек будет искать словами. Работает Haiku по миниатюре:
// дёшево, а для «пляж, семья, закат» большего и не нужно.
const PHOTO_TOOL: Anthropic.Tool = {
  name: "describe_photo",
  description: "Описать фотографию из личного архива для смыслового поиска.",
  input_schema: {
    type: "object",
    properties: {
      caption: { type: "string", description: "1 фраза по-человечески: кто/что, где, что происходит. Напр. «Семья на пляже у досок для сёрфинга на закате»." },
      scene: { type: "string", description: "Тип сцены одним-двумя словами: пляж, горы, дом, ресторан, улица, детская площадка, офис, автомобиль..." },
      tags: { type: "array", items: { type: "string" }, description: "До 8 тегов на русском: объекты, активности, время суток, сезон. Напр. [\"море\", \"сёрфинг\", \"закат\", \"семья\", \"лето\"]." },
      is_screenshot: { type: "boolean", description: "true, если это скриншот экрана, а не фотография из жизни." },
      quality: { type: "string", enum: ["low", "medium", "high"], description: "low — смазано/темно/случайный кадр; high — чёткий удачный снимок." },
    },
    required: ["caption", "scene", "tags"],
  },
};

export type PhotoDescription = { caption: string; scene: string; tags: string[]; is_screenshot: boolean; quality: string | null };

export async function describePhoto(thumbB64: string, userId?: string): Promise<PhotoDescription | null> {
  try {
    const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      tools: [PHOTO_TOOL],
      tool_choice: { type: "tool", name: "describe_photo" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: thumbB64 } },
            { type: "text", text: "Опиши фотографию из личного фотоархива для поиска обычным языком. Заполни describe_photo. Не выдумывай имён людей и мест — только то, что видно." },
          ],
        },
      ],
    });
    logClaude(userId, "photo_vision", "haiku", (m as any).usage);
    const block = m.content.find((b) => b.type === "tool_use");
    const d = (block && block.type === "tool_use" ? block.input : null) as any;
    if (!d?.caption) return null;
    return {
      caption: String(d.caption).slice(0, 300),
      scene: String(d.scene || "").slice(0, 60),
      tags: Array.isArray(d.tags) ? d.tags.map((t: any) => String(t).slice(0, 40)).slice(0, 8) : [],
      is_screenshot: !!d.is_screenshot,
      quality: ["low", "medium", "high"].includes(d.quality) ? d.quality : null,
    };
  } catch {
    return null;
  }
}

// Текст, из которого считается вектор фотографии. Как и на других полках —
// кладём то, ЧТО человек будет вспоминать: описание, сцену, теги, время года.
export function photoEmbedText(p: { caption?: string | null; scene?: string | null; tags?: string[] | null; captured_at?: string | null; location_city?: string | null; location_country?: string | null }): string {
  const d = p.captured_at ? new Date(p.captured_at) : null;
  const season = d ? ["зима", "зима", "весна", "весна", "весна", "лето", "лето", "лето", "осень", "осень", "осень", "зима"][d.getMonth()] : "";
  return [
    p.caption,
    p.scene ? `Сцена: ${p.scene}` : "",
    Array.isArray(p.tags) && p.tags.length ? p.tags.join(", ") : "",
    d ? `${d.getFullYear()} год, ${season}` : "",
    [p.location_city, p.location_country].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

// Подметание: берём необработанные фото, описываем и считаем векторы.
// Тот же паттерн, что embed-sweep: страховочный цикл, который можно звать
// хоть кроном, хоть рукой владельца, — каждый вызов делает кусочек работы.
export async function sweepDescribe(limit = 30): Promise<{ done: number; left: number }> {
  const db = supabaseAdmin();
  let done = 0;
  let rows: any[] = [];
  try {
    const { data } = await db
      .from("photos")
      .select("id, user_id, thumb_url, captured_at, location_city, location_country")
      .eq("status", "new")
      .not("thumb_url", "is", null)
      .limit(limit);
    rows = (data as any[]) || [];
  } catch {
    return { done: 0, left: 0 }; // таблиц ещё нет
  }

  // По 5 параллельно: быстрее укладываемся в минуту серверless-функции,
  // не упираясь в лимиты Anthropic.
  for (let i = 0; i < rows.length; i += 5) {
    const chunk = rows.slice(i, i + 5);
    await Promise.all(
      chunk.map(async (r) => {
        try {
          const b64 = await downloadThumbB64(r.thumb_url);
          if (!b64) {
            await db.from("photos").update({ status: "skip" }).eq("id", r.id);
            return;
          }
          const d = await describePhoto(b64, r.user_id);
          if (!d) return; // временный сбой AI — останется new, доберём в следующий раз
          const vec = await embedToVectorString(photoEmbedText({ ...d, captured_at: r.captured_at, location_city: r.location_city, location_country: r.location_country }));
          const patch: any = { caption: d.caption, scene: d.scene, tags: d.tags, is_screenshot: d.is_screenshot, quality: d.quality, status: "ok" };
          if (vec) patch.embedding = vec;
          await db.from("photos").update(patch).eq("id", r.id);
          done++;
        } catch {
          /* одна неудачная фотография не роняет подметание */
        }
      })
    );
  }

  let left = 0;
  try {
    const { count } = await db.from("photos").select("id", { count: "exact", head: true }).eq("status", "new").not("thumb_url", "is", null);
    left = Number(count) || 0;
  } catch {}
  return { done, left };
}

// Миниатюра лежит в закрытом бакете — качаем через сервисный ключ.
async function downloadThumbB64(thumbUrl: string): Promise<string | null> {
  try {
    const m = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/.exec(thumbUrl || "");
    if (!m) return null;
    const { data, error } = await supabaseAdmin().storage.from(m[1]).download(decodeURIComponent(m[2]));
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

// ===== Поиск (основа; страница и инструменты бота придут следующим блоком) =====

export type PhotoHit = {
  id: string;
  thumb_url: string | null;
  caption: string | null;
  captured_at: string | null;
  similarity?: number;
};

export async function searchPhotos(userId: string, opts: { query?: string; from?: string; to?: string; limit?: number }): Promise<PhotoHit[]> {
  const db = supabaseAdmin();
  const limit = Math.min(Math.max(opts.limit || 24, 1), 100);

  // Смысловая часть: вектор запроса против векторов фотографий.
  let simIds: Map<string, number> | null = null;
  if (opts.query?.trim()) {
    const vec = await embedToVectorString(opts.query.trim());
    if (vec) {
      try {
        const { data } = await db.rpc("match_photos", { query_embedding: vec, match_user: userId, match_count: limit * 3 });
        simIds = new Map(((data as any[]) || []).map((r) => [String(r.id), Number(r.similarity) || 0]));
      } catch {
        /* функции ещё нет — останется поиск по датам */
      }
    }
  }

  try {
    let q = db.from("photos").select("id, thumb_url, caption, captured_at").eq("user_id", userId);
    if (simIds && simIds.size) q = q.in("id", [...simIds.keys()]);
    if (opts.from) q = q.gte("captured_at", opts.from);
    if (opts.to) q = q.lte("captured_at", opts.to);
    const { data } = await q.order("captured_at", { ascending: false }).limit(limit);
    const rows = ((data as any[]) || []).map((r) => ({ ...r, similarity: simIds?.get(String(r.id)) }));
    // При смысловом запросе — сначала самое похожее, внутри похожего по времени.
    if (simIds) rows.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return rows;
  } catch {
    return [];
  }
}

// Дозаполнение векторов у уже описанных фото (если embedding не посчитался).
export async function backfillPhotoEmbeddings(limit = 100): Promise<number> {
  const db = supabaseAdmin();
  try {
    const { data } = await db
      .from("photos")
      .select("id, caption, scene, tags, captured_at, location_city, location_country")
      .eq("status", "ok")
      .is("embedding", null)
      .not("caption", "is", null)
      .limit(limit);
    const rows = (data as any[]) || [];
    if (!rows.length) return 0;
    const vecs = await embedBatch(rows.map((r) => photoEmbedText(r)));
    let done = 0;
    await Promise.all(
      rows.map(async (r, i) => {
        if (!vecs[i]) return;
        await db.from("photos").update({ embedding: vecs[i] }).eq("id", r.id);
        done++;
      })
    );
    return done;
  } catch {
    return 0;
  }
}
