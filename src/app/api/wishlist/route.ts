import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addWishFromUrl, addWishManual, updateWish, deleteWish, setWishPublic, extractAnyUrl } from "@/lib/wishlist";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "addUrl") {
    const url = extractAnyUrl(String(body?.url || ""));
    if (!url) return NextResponse.json({ ok: false, error: "no_url" }, { status: 400 });
    const wish = await addWishFromUrl(user.id, url);
    if (!wish) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.json({ ok: true, wish });
  }

  if (action === "addManual") {
    const wish = await addWishManual(user.id, {
      title: String(body?.title || ""),
      url: body?.url ? String(body.url) : undefined,
      price: body?.price ? String(body.price) : undefined,
      note: body?.note ? String(body.note) : undefined,
    });
    if (!wish) return NextResponse.json({ ok: false, error: "no_title" }, { status: 400 });
    return NextResponse.json({ ok: true, wish });
  }

  if (action === "update") {
    const ok = await updateWish(user.id, String(body?.id || ""), {
      title: body?.title,
      note: body?.note,
      price: body?.price,
      status: body?.status,
      priority: body?.priority,
    });
    return NextResponse.json({ ok });
  }

  if (action === "delete") {
    const ok = await deleteWish(user.id, String(body?.id || ""));
    return NextResponse.json({ ok });
  }

  if (action === "setPublic") {
    const res = await setWishPublic(user.id, user.name ?? null, !!body?.value);
    return NextResponse.json({ ok: true, ...res });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
