import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEntries } from "@/lib/queries";

export const runtime = "nodejs";

// Recent entries feed for the native app. Auth via the same session cookie
// (`lifeos_token`) the app sends as a header; getCurrentUser reads it unchanged.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

  const entries = await getEntries(user.id, limit);
  return NextResponse.json({ ok: true, entries });
}
