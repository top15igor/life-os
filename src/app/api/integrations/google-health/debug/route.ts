import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { googleHealthProbe } from "@/lib/googleHealth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Временный диагностический эндпоинт для отладки Google Health (сон и доступные типы).
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const data = await googleHealthProbe(user.id);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
