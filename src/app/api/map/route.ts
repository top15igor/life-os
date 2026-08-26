import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { placeNameAt } from "@/lib/photoGeo";
import { parseStorageUrl } from "@/lib/fileLink";
import { guessFor } from "@/lib/placeGuess";
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

  // «Похоже, это Брюарфосс»: AI узнал место на снимке — превращаем его название
  // в координаты, чтобы человек подтвердил одним нажатием, а не искал сам.
  if (action === "guess") {
    if (kind !== "memories") return NextResponse.json({ ok: true, guess: null });
    const g = await guessFor(user.id, id);
    return NextResponse.json({ ok: true, guess: g });
  }

  // Точка ушла с карты, но сам снимок остаётся в «Памяти» — он просто
  // возвращается в список «Фото без точки». Это не удаление, и путать эти два
  // действия нельзя: одно отменяется одним нажатием, другое — никогда.
  if (action === "unpin") {
    try {
      const patch = kind === "photos" ? { gps_lat: null, gps_lng: null } : { lat: null, lng: null, place_name: null, geo_source: null };
      const { error } = await db.from(kind).update(patch).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  }

  // Удаление насовсем: и карточка, и сам файл в хранилище. Только своё.
  if (action === "delete") {
    if (kind === "photos") {
      // Снимок домашнего архива — это лишь указатель на файл, который лежит
      // дома у человека. Оригинал мы не трогаем никогда, убираем только запись.
      await db.from("photos").delete().eq("id", id).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    }
    try {
      const { data } = await db.from("memories").select("image_url, file_url").eq("id", id).eq("user_id", user.id).maybeSingle();
      const paths = [(data as any)?.image_url, (data as any)?.file_url]
        .map((u: string | null) => (u ? parseStorageUrl(u) : null))
        .filter((p): p is { bucket: string; path: string } => !!p && p.bucket === "memories" && p.path.startsWith(`${user.id}/`))
        .map((p) => p.path);
      await db.from("memories").delete().eq("id", id).eq("user_id", user.id);
      if (paths.length) await db.storage.from("memories").remove(paths).catch(() => {});
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  // Обложка ролика. Кадр снимает сам браузер при загрузке (сервер видео не
  // смотрит) и кладёт картинку в то же хранилище — здесь мы только связываем
  // её с карточкой, чтобы на карте у видео была не серая заглушка, а кадр.
  if (action === "poster") {
    const path = String(body?.path || "");
    if (!path.startsWith(`${user.id}/`)) return NextResponse.json({ ok: false }, { status: 400 });
    try {
      const url = db.storage.from("memories").getPublicUrl(path).data?.publicUrl || null;
      if (!url) throw new Error("no url");
      const { error } = await db.from("memories").update({ image_url: url }).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
