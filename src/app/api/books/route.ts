import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { searchBooks, addBook, addBookByTitle, updateBook, deleteBook, addQuote, deleteQuote, setBookGoal, setBooksPublic, recommendBooks, getBooks, addBookFromImage, importBooksCsv } from "@/lib/books";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "search") {
    const hits = await searchBooks(String(body?.q || ""));
    return NextResponse.json({ ok: true, hits });
  }

  if (action === "add") {
    const book = await addBook(user.id, { title: String(body?.title || ""), author: body?.author, coverUrl: body?.coverUrl, year: body?.year, isbn: body?.isbn, olKey: body?.olKey, genre: body?.genre, status: body?.status });
    if (!book) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true, book });
  }

  if (action === "addByTitle") {
    const book = await addBookByTitle(user.id, String(body?.title || ""), body?.author);
    if (!book) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true, book });
  }

  if (action === "update") {
    const ok = await updateBook(user.id, String(body?.id || ""), body?.fields || {});
    return NextResponse.json({ ok });
  }

  if (action === "delete") {
    const ok = await deleteBook(user.id, String(body?.id || ""));
    return NextResponse.json({ ok });
  }

  if (action === "addQuote") {
    const q = await addQuote(user.id, String(body?.bookId || ""), String(body?.text || ""), body?.page ?? null);
    return NextResponse.json({ ok: !!q, quote: q });
  }

  if (action === "deleteQuote") {
    const ok = await deleteQuote(user.id, String(body?.id || ""));
    return NextResponse.json({ ok });
  }

  if (action === "setGoal") {
    const ok = await setBookGoal(user.id, user.name ?? null, Number(body?.goal) || 0);
    return NextResponse.json({ ok });
  }

  if (action === "setPublic") {
    const res = await setBooksPublic(user.id, user.name ?? null, !!body?.value);
    return NextResponse.json({ ok: true, ...res });
  }

  if (action === "fromPhoto") {
    const image = String(body?.image || "").replace(/^data:[^,]+,/, "");
    if (!image) return NextResponse.json({ ok: false }, { status: 400 });
    const book = await addBookFromImage(user.id, image, body?.mediaType || "image/jpeg");
    if (!book) return NextResponse.json({ ok: false, error: "not_recognized" }, { status: 422 });
    return NextResponse.json({ ok: true, book });
  }

  if (action === "import") {
    const csv = String(body?.csv || "");
    if (!csv) return NextResponse.json({ ok: false }, { status: 400 });
    const count = await importBooksCsv(user.id, csv);
    return NextResponse.json({ ok: true, count });
  }

  if (action === "recommend") {
    const locale = await getLocale();
    const books = await getBooks(user.id);
    const recs = await recommendBooks(user.id, books, locale);
    return NextResponse.json({ ok: true, recs });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
