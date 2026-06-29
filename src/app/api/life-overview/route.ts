import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildLifeOverview } from "@/lib/lifeIntelligence";
import { isPro } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // «Что заметил AI» — фича тарифа Pro.
  if (!(await isPro(user.id))) return NextResponse.json({ ok: false, error: "pro" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const fresh = !!body?.fresh;
  try {
    const data = await buildLifeOverview(user.id, fresh);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
