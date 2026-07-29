import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { moderateReview, deleteReview } from "@/lib/reviews";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Модерация отзывов — только владельцу.
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const action = String(body?.action || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const ok =
    action === "delete"
      ? await deleteReview(id)
      : action === "approved" || action === "rejected"
        ? await moderateReview(id, action)
        : false;

  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
