import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createCalendarEvent, deleteCalendarEvent, isCalendarConnected } from "@/lib/googleCalendar";

export const runtime = "nodejs";

type Kind = "task" | "deed" | "promise";

// Verify the referenced item belongs to the current user.
async function ownsRef(userId: string, kind: Kind, refId: string): Promise<boolean> {
  const db = supabaseAdmin();
  try {
    if (kind === "task") {
      const { data } = await db.from("tasks").select("entry_id").eq("id", refId).maybeSingle();
      const entryId = (data as any)?.entry_id;
      if (!entryId) return false;
      const { data: e } = await db.from("entries").select("user_id").eq("id", entryId).maybeSingle();
      return (e as any)?.user_id === userId;
    }
    const table = kind === "deed" ? "good_deeds" : "promises";
    const { data } = await db.from(table).select("user_id").eq("id", refId).maybeSingle();
    return (data as any)?.user_id === userId;
  } catch {
    return false;
  }
}

// GET: which (kind, ref) pairs are already in the calendar — for showing state.
export async function GET() {
  const user = await requireUser();
  try {
    const { data } = await supabaseAdmin()
      .from("calendar_links")
      .select("kind, ref_id, html_link, due_at")
      .eq("user_id", user.id);
    return NextResponse.json({ ok: true, links: data || [], connected: await isCalendarConnected(user.id) });
  } catch {
    return NextResponse.json({ ok: true, links: [], connected: false });
  }
}

// POST: { kind, refId, title, dueAt }  OR  { kind, refId, unpush: true }
export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const kind = body.kind as Kind;
  const refId = (body.refId || "").toString();
  if (!["task", "deed", "promise"].includes(kind) || !refId)
    return NextResponse.json({ ok: false, error: "bad_args" }, { status: 400 });
  if (!(await ownsRef(user.id, kind, refId)))
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const db = supabaseAdmin();

  // Remove from calendar.
  if (body.unpush) {
    try {
      const { data } = await db
        .from("calendar_links")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("kind", kind)
        .eq("ref_id", refId)
        .maybeSingle();
      const evId = (data as any)?.event_id;
      if (evId) await deleteCalendarEvent(user.id, evId);
      await db.from("calendar_links").delete().eq("user_id", user.id).eq("kind", kind).eq("ref_id", refId);
      return NextResponse.json({ ok: true, removed: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  // Add to calendar.
  if (!(await isCalendarConnected(user.id)))
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 400 });

  const title = (body.title || "").toString().trim().slice(0, 200) || "LIFE OS";
  const due = new Date((body.dueAt || "").toString());
  if (isNaN(due.getTime())) return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });

  const labelByKind: Record<Kind, string> = { task: "Task", deed: "Good deed", promise: "Promise" };
  const r = await createCalendarEvent(user.id, {
    summary: title,
    description: `LIFE OS ${labelByKind[kind]}`,
    startISO: due.toISOString(),
    remindMinutes: [60, 0],
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: (r as any).error }, { status: 500 });

  try {
    await db
      .from("calendar_links")
      .upsert(
        {
          user_id: user.id,
          kind,
          ref_id: refId,
          event_id: r.id,
          html_link: r.link,
          due_at: due.toISOString(),
        },
        { onConflict: "user_id,kind,ref_id" }
      );
    return NextResponse.json({ ok: true, link: r.link, due_at: due.toISOString() });
  } catch {
    await deleteCalendarEvent(user.id, r.id);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
