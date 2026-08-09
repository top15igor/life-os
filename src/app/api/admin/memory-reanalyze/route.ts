import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { pathFromPublicUrl } from "@/lib/fileLink";
import { analyzeImage, analyzeDocument } from "@/lib/vision";
import { documentExpiry } from "@/lib/docExpiry";

export const runtime = "nodejs";
export const maxDuration = 60;

// Перечитать уже загруженные документы, у которых не распознан срок действия,
// и добавить поле «Действителен до» (обновлённый разбор AI). Только для владельца,
// по его сессии. GET — предпросмотр (сколько кандидатов), POST — выполнить.
export async function GET() { return run(false); }
export async function POST() { return run(true); }

async function run(apply: boolean) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  const db = supabaseAdmin();

  const { data } = await db.from("memories").select("id, category, title, fields, image_url, file_url, mime_type").eq("user_id", user.id).limit(500);
  const rows = (data as any[]) || [];
  // Кандидаты: документы/вещи/инфо без уже распознанного срока и с файлом.
  const candidates = rows.filter((r) => ["document", "thing", "info"].includes(r.category) && !documentExpiry(r.category, r.fields) && (r.file_url || r.image_url));

  if (!apply) return NextResponse.json({ ok: true, candidates: candidates.length });

  let updated = 0;
  for (const r of candidates.slice(0, 25)) {
    try {
      const raw = r.file_url || r.image_url;
      const path = pathFromPublicUrl(raw);
      if (!path) continue;
      const { data: blob, error } = await db.storage.from("memories").download(path);
      if (error || !blob) continue;
      const buf = Buffer.from(await blob.arrayBuffer());
      const isPdf = /\.pdf(\?|$)/i.test(raw) || r.mime_type === "application/pdf";
      const v = isPdf ? await analyzeDocument(buf.toString("base64"), user.id) : await analyzeImage(buf.toString("base64"), r.mime_type || "image/jpeg", user.id);
      // Берём из нового разбора только поле срока, чтобы не затирать остальное.
      const exp = documentExpiry(r.category, v.fields);
      if (!exp) continue;
      const merged = [...(Array.isArray(r.fields) ? r.fields : []), { label: exp.label || "Действителен до", value: exp.date }];
      await db.from("memories").update({ fields: merged }).eq("id", r.id).eq("user_id", user.id);
      updated++;
    } catch { /* пропускаем проблемный документ */ }
  }
  return NextResponse.json({ ok: true, updated, candidates: candidates.length });
}
