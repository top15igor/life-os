import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEntityMeta } from "@/lib/queries";
import { getTrips, getTripSuggestions, acceptSuggestion, dismissSuggestion, createTrip, updateTrip, deleteTrip } from "@/lib/trips";

export const runtime = "nodejs";

// Свежие данные для клиента после любой мутации.
async function payload(userId: string) {
  let hidden = new Set<string>();
  try {
    const metas = await getEntityMeta(userId, "places");
    hidden = new Set(Object.keys(metas).filter((n) => (metas as any)[n]?.hidden));
  } catch {}
  const [trips, suggestions] = await Promise.all([getTrips(userId), getTripSuggestions(userId, hidden)]);
  return { trips, suggestions };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await payload(user.id)) });
}

// Действия дневника путешествий: accept | dismiss | create | update | delete.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");

  let ok = false;
  if (action === "accept") ok = await acceptSuggestion(user.id, String(body?.key || ""));
  else if (action === "dismiss") ok = await dismissSuggestion(user.id, String(body?.key || ""));
  else if (action === "create") ok = await createTrip(user.id, body?.fields || {});
  else if (action === "update") ok = await updateTrip(user.id, String(body?.id || ""), body?.fields || {});
  else if (action === "delete") ok = await deleteTrip(user.id, String(body?.id || ""));
  else return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });

  return NextResponse.json({ ok, ...(await payload(user.id)) });
}
