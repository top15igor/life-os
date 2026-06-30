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
      // tasks has a direct user_id (entry_id may be null for bot-added tasks).
      const { data } = await db.from("tasks").select("user_id, entry_id").eq("id", refId).maybeSingle();
      if (!data) return false;
      if ((data as any).user_id) return (data as any).user_id === userId;
      // Legacy rows without user_id: fall back to the linked entry's owner.
      const entryId = (data as any).entry_id;
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
      let evId: string | null = null;
      let calId = "primary";
      try {
        const { data } = await db.from("calendar_links").select("event_id, calendar_id").eq("user_id", user.id).eq("kind", kind).eq("ref_id", refId).maybeSingle();
        evId = (data as any)?.event_id || null;
        calId = (data as any)?.calendar_id || "primary";
      } catch {
        const { data } = await db.from("calendar_links").select("event_id").eq("user_id", user.id).eq("kind", kind).eq("ref_id", refId).maybeSingle();
        evId = (data as any)?.event_id || null;
      }
      if (evId) await deleteCalendarEvent(user.id, evId, calId);
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
  const calendarId = (body.calendarId || "primary").toString();

  const labelByKind: Record<Kind, string> = { task: "Task", deed: "Good deed", promise: "Promise" };
  const r = await createCalendarEvent(
    user.id,
    { summary: title, description: `LIFE OS ${labelByKind[kind]}`, startISO: due.toISOString(), remindMinutes: [60, 0] },
    calendarId
  );
  if (!r.ok) return NextResponse.json({ ok: false, error: (r as any).error }, { status: 500 });

  try {
    const row: any = { user_id: user.id, kind, ref_id: refId, event_id: r.id, html_link: r.link, due_at: due.toISOString(), calendar_id: calendarId };
    let up = await db.from("calendar_links").upsert(row, { onConflict: "user_id,kind,ref_id" });
    // If calendar_id column is missing (migration not run), retry without it.
    if (up.error) {
      delete row.calendar_id;
      up = await db.from("calendar_links").upsert(row, { onConflict: "user_id,kind,ref_id" });
    }
    if (up.error) throw up.error;
    return NextResponse.json({ ok: true, link: r.link, due_at: due.toISOString() });
  } catch {
    await deleteCalendarEvent(user.id, r.id, calendarId);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
