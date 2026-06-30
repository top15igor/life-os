import { NextRequest, NextResponse } from "next/server";
import { reserveWish, unreserveWish } from "@/lib/wishlist";

export const runtime = "nodejs";

// Публичный эндпоинт: гость (не авторизован) бронирует/снимает бронь подарка.
// Личность гостя — случайный токен из его localStorage, владелец брони не видит.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const action = body?.action;
  const wishId = String(body?.wishId || "");
  const token = String(body?.token || "").slice(0, 80);
  if (!wishId || !token || token.length < 8) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "reserve") {
    const res = await reserveWish(wishId, token, body?.name ? String(body.name) : null);
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  }
  if (action === "unreserve") {
    const res = await unreserveWish(wishId, token);
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
