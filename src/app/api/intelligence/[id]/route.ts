import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildIntelligence } from "@/lib/intelligence";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  try {
    const intel = await buildIntelligence(user.id, id);
    return NextResponse.json({ ok: true, intel });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
