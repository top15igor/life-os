import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveBookMeta, saveChapterEdit, saveChapterPhotos, saveChapterData, type BookMeta } from "@/lib/book";

export const runtime = "nodejs";

// Сохранение мета книги: посвящение, письма, получатель, тип, правка главы. Только свои данные.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const year = Number(body.year || 0);

  // Правка/дописывание главы пользователем (отдельно от мета-полей).
  if (typeof body.editKey === "string" && body.editKey) {
    const ok = await saveChapterEdit(user.id, year, body.editKey, String(body.editBody || ""));
    return NextResponse.json({ ok });
  }

  // Ручная правка списка-данных главы (люди/проекты/места).
  if (typeof body.dataKey === "string" && body.dataKey) {
    const list = Array.isArray(body.dataList)
      ? body.dataList.map((it: any) => ({ name: String(it?.name || ""), count: Number(it?.count) || 0 }))
      : null;
    const ok = await saveChapterData(user.id, year, body.dataKey, list);
    return NextResponse.json({ ok });
  }

  // Фото главы (urls из «Визуальной памяти»).
  if (typeof body.photoKey === "string" && body.photoKey) {
    const ok = await saveChapterPhotos(user.id, year, body.photoKey, Array.isArray(body.photos) ? body.photos : []);
    return NextResponse.json({ ok });
  }

  // Состав книги: какие главы скрыты и их порядок.
  if (body.layout && typeof body.layout === "object") {
    const hidden = Array.isArray(body.layout.hidden) ? body.layout.hidden.filter((x: any) => typeof x === "string").slice(0, 40) : [];
    const order = Array.isArray(body.layout.order) ? body.layout.order.filter((x: any) => typeof x === "string").slice(0, 40) : [];
    const ok = await saveBookMeta(user.id, year, { layout: { hidden, order } } as any);
    return NextResponse.json({ ok });
  }

  const patch: Partial<BookMeta> = {};
  const fields: (keyof BookMeta)[] = ["dedication", "letter_self", "letter_close", "recipient", "book_type"];
  for (const f of fields) {
    if (typeof body[f] === "string") (patch as any)[f] = String(body[f]).slice(0, 5000);
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false }, { status: 400 });

  const ok = await saveBookMeta(user.id, year, patch);
  return NextResponse.json({ ok });
}
