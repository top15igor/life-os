import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listToSort, keepAsIs, fixCategory, listRules, forgetRule } from "@/lib/sortShelf";
import { MEM_CATEGORIES } from "@/lib/vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Полка «Разобрать»: что ждёт решения и как это решение принять.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const [items, rules] = await Promise.all([listToSort(user.id), listRules(user.id)]);
  return NextResponse.json({ ok: true, items, rules });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "keep") return NextResponse.json({ ok: await keepAsIs(user.id, id) });

  if (action === "category") {
    const category = String(body?.category || "");
    if (!MEM_CATEGORIES.includes(category)) return NextResponse.json({ ok: false, error: "category" }, { status: 400 });
    return NextResponse.json({ ok: await fixCategory(user.id, id, category) });
  }

  if (action === "forgetRule") return NextResponse.json({ ok: await forgetRule(user.id, id) });

  return NextResponse.json({ ok: false, error: "action" }, { status: 400 });
}
