import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildLifeOverview } from "@/lib/lifeIntelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const data = await buildLifeOverview(user.id);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
