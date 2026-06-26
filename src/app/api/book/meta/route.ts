import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveBookMeta, saveChapterEdit, type BookMeta } from "@/lib/book";

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

  const patch: Partial<BookMeta> = {};
  const fields: (keyof BookMeta)[] = ["dedication", "letter_self", "letter_close", "recipient", "book_type"];
  for (const f of fields) {
    if (typeof body[f] === "string") (patch as any)[f] = String(body[f]).slice(0, 5000);
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false }, { status: 400 });

  const ok = await saveBookMeta(user.id, year, patch);
  return NextResponse.json({ ok });
}
