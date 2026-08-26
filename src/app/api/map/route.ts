import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { placeNameAt } from "@/lib/photoGeo";
import { getLocale } from "@/lib/locale";

export const runtime = "nodejs";

// Точка на карте жизни: личный комментарий к снимку и ручная правка места.
//
// Комментарий пишет только сам хозяин точки — поэтому здесь нет ни одного
// действия, которое умеет тронуть чужую строку: у каждого запроса стоит
// eq("user_id", …), а kind выбирает лишь между своим фото в «Памяти» и своим
// снимком в подключённом фотоархиве.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const id = String(body?.id || "");
  const kind = body?.kind === "photo" ? "photos" : "memories";
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();

  if (action === "note") {
    const note = String(body?.note || "").slice(0, 2000);
    try {
      const { error } = await db.from(kind).update({ note }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false, error: "no note column? apply photo_map.sql" }, { status: 400 });
    }
  }

  // Точка встала не туда (или её вовсе нет) — человек ставит её сам,
  // перетащив по карте.
  if (action === "move") {
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Подпись места берём обратным геокодированием — человек ткнул в карту,
    // а под точкой должно быть написано «Биарриц, Франция», а не два числа.
    const locale = await getLocale().catch(() => "ru");
    const place = await placeNameAt(lat, lng, locale as string);
    try {
      const patch: Record<string, any> =
        kind === "photos"
          ? { gps_lat: lat, gps_lng: lng }
          : { lat, lng, geo_source: "manual", place_name: place };
      const { error } = await db.from(kind).update(patch).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, place });
    } catch {
      return NextResponse.json({ ok: false, error: "apply photo_map.sql" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
