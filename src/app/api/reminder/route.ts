import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createCalendarEvent, deleteCalendarEvent, isCalendarConnected } from "@/lib/googleCalendar";

export const runtime = "nodejs";

// GET: upcoming + recent reminders for the current user.
export async function GET() {
  const user = await requireUser();
  try {
    const { data } = await supabaseAdmin()
      .from("reminders")
      .select("id, text, due_at, gcal_event_id, gcal_link, done")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true })
      .limit(200);
    return NextResponse.json({ ok: true, reminders: data || [], connected: await isCalendarConnected(user.id) });
  } catch {
    return NextResponse.json({ ok: true, reminders: [], connected: false });
  }
}

// POST: { action: 'create' | 'delete' | 'done', ... }
export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const action = body.action || "create";
  const db = supabaseAdmin();

  if (action === "create") {
    const text = (body.text || "").toString().trim();
    const dueAt = (body.dueAt || "").toString();
    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    const due = new Date(dueAt);
    if (isNaN(due.getTime())) return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });
    const calendarId = (body.calendarId || "primary").toString();

    // Push to Google Calendar first (if connected) so we can store the event id.
    let gcalId: string | null = null;
    let gcalLink: string | null = null;
    const r = await createCalendarEvent(
      user.id,
      { summary: text, description: "LIFE OS reminder", startISO: due.toISOString(), remindMinutes: [10, 0] },
      calendarId
    );
    if (r.ok) {
      gcalId = r.id;
      gcalLink = r.link;
    }

    try {
      const row: any = { user_id: user.id, text, due_at: due.toISOString(), gcal_event_id: gcalId, gcal_link: gcalLink };
      if (gcalId) row.gcal_calendar_id = calendarId;
      let ins = await db.from("reminders").insert(row).select("id, text, due_at, gcal_event_id, gcal_link, done").single();
      // If gcal_calendar_id column is missing (migration not run), retry without it.
      if (ins.error && row.gcal_calendar_id) {
        delete row.gcal_calendar_id;
        ins = await db.from("reminders").insert(row).select("id, text, due_at, gcal_event_id, gcal_link, done").single();
      }
      if (ins.error) throw ins.error;
      return NextResponse.json({ ok: true, reminder: ins.data, synced: !!gcalId });
    } catch {
      // Roll back the calendar event if the DB insert failed.
      if (gcalId) await deleteCalendarEvent(user.id, gcalId, calendarId);
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
  }

  if (action === "delete") {
    const id = (body.id || "").toString();
    if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });
    try {
      let evId: string | null = null;
      let calId = "primary";
      try {
        const { data } = await db.from("reminders").select("gcal_event_id, gcal_calendar_id").eq("id", id).eq("user_id", user.id).maybeSingle();
        evId = (data as any)?.gcal_event_id || null;
        calId = (data as any)?.gcal_calendar_id || "primary";
      } catch {
        const { data } = await db.from("reminders").select("gcal_event_id").eq("id", id).eq("user_id", user.id).maybeSingle();
        evId = (data as any)?.gcal_event_id || null;
      }
      if (evId) await deleteCalendarEvent(user.id, evId, calId);
      await db.from("reminders").delete().eq("id", id).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  if (action === "done") {
    const id = (body.id || "").toString();
    const done = body.done !== false;
    if (!id) return NextResponse.json({ ok: false, error: "no_id" }, { status: 400 });
    try {
      await db.from("reminders").update({ done }).eq("id", id).eq("user_id", user.id);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
