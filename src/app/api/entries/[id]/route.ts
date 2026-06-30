import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEntry } from "@/lib/queries";

export const runtime = "nodejs";

// Full detail of one entry (with the AI breakdown) for the native entry screen.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const { id } = await params;
  const entry = await getEntry(id, user.id);
  if (!entry) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, entry });
}
