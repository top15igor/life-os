import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.action !== "delete") return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const uid = user.id;

  try {
    const { data: ents } = await db.from("entries").select("id").eq("user_id", uid);
    const ids = (ents || []).map((e) => e.id);
    if (ids.length) {
      for (const tbl of ["entry_categories", "entry_tags", "entry_people", "entry_projects", "entry_places"]) {
        await db.from(tbl).delete().in("entry_id", ids);
      }
    }
    for (const tbl of ["tasks", "insights", "gratitude", "entries", "goals", "projects", "tags", "people", "places", "experiments", "biographer_chats", "life_overview"]) {
      await db.from(tbl).delete().eq("user_id", uid);
    }
    // Владельца не удаляем как пользователя (иначе сломается админка) — только его данные.
    if (uid !== OWNER) await db.from("users").delete().eq("id", uid);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
