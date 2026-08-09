import { NextRequest, NextResponse } from "next/server";
import { sourceByToken, ingestBatch, type IngestItem } from "@/lib/photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Приём пачки фотографий от локального разведчика.
//
// Аутентификация — device_token источника в заголовке. Пачка до 25 штук:
// миниатюры ~50-100 КБ каждая, итого запрос спокойно проходит лимиты хостинга.
// Повторная отправка тех же файлов безвредна (upsert по source_id+path).

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-scout-token") || "";
  const source = await sourceByToken(token);
  if (!source) return NextResponse.json({ ok: false, error: "bad_token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.photos) ? (body.photos as IngestItem[]).slice(0, 25) : [];
  if (!items.length) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const res = await ingestBatch(source, items);
  return NextResponse.json({ ok: true, ...res });
}
