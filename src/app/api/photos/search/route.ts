import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchPhotos } from "@/lib/photos";
import { signManyForWeb } from "@/lib/fileLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Поиск по фотоархиву обычным языком: «фото на море», «скриншоты», «закат».
// Смысловая часть — вектор запроса против векторов описаний; плюс рамки дат.
// Миниатюры лежат в закрытом бакете, наружу уходят подписанные ссылки.

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const hits = await searchPhotos(user.id, {
    query: sp.get("q") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : undefined,
  });
  return NextResponse.json({ ok: true, count: hits.length, photos: await signManyForWeb(hits, ["thumb_url"]) });
}
