import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createCalendarEvent, deleteCalendarEvent, isCalendarConnected, type Recurrence } from "@/lib/googleCalendar";

export const runtime = "nodejs";

const COLS = "id, text, due_at, gcal_event_id, gcal_link, done, recurrence, all_day, remind_min, gcal_calendar_id";
const COLS_BASIC = "id, text, due_at, gcal_event_id, gcal_link, done";
const RECUR: Recurrence[] = ["daily", "weekly", "monthly", "yearly"];

function normRecur(v: any): Recurrence | null {
  return RECUR.includes(v) ? v : null;
}

// Build the Google Calendar event payload from reminder inputs.
function buildEvent(text: string, due: Date, allDay: boolean, dateStr: string, recurrence: Recurrence | null, remindMin: number | null) {
  return {
    summary: text,
    description: "LIFE OS reminder",
    startISO: due.toISOString(),
    remindMinutes: [typeof remindMin === "number" ? remindMin : 10],
    allDay,
    dateStr: dateStr || due.toISOString().slice(0, 10),
    recurrence,
  };
}

// GET: upcoming + recent reminders for the current user.
export async function GET() {
  const user = await requireUser();
  const db = supabaseAdmin();
  try {
    let q: any = await db.from("reminders").select(COLS).eq("user_id", user.id).order("due_at", { ascending: true }).limit(200);
    if (q.error) q = await db.from("reminders").select(COLS_BASIC).eq("user_id", user.id).order("due_at", { ascending: true }).limit(200);
    return NextResponse.json({ ok: true, reminders: q.data || [], connected: await isCalendarConnected(user.id) });
  } catch {
    return NextResponse.json({ ok: true, reminders: [], connected: false });
  }
}

// POST: { action: 'create' | 'edit' | 'delete' | 'done', ... }
export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const action = body.action || "create";
  const db = supabaseAdmin();

  if (action === "create") {
    const text = (body.text || "").toString().trim();
    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    const due = new Date((body.dueAt || "").toString());
    if (isNaN(due.getTime())) return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });
    const calendarId = (body.calendarId || "primary").toString();
    const allDay = !!body.allDay;
    const recurrence = normRecur(body.recurrence);
    const remindMin = typeof body.remindMin === "number" ? body.remindMin : null;
    const dateStr = (body.dateStr || "").toString();

    // Push to Google Calendar first (if connected) so we can store the event id.
    let gcalId: string | null = null;
    let gcalLink: string | null = null;
    const r = await createCalendarEvent(user.id, buildEvent(text, due, allDay, dateStr, recurrence, remindMin), calendarId);
    if (r.ok) {
      gcalId = r.id;
      gcalLink = r.link;
    }

    const full: any = {
      user_id: user.id,
      text,
      due_at: due.toISOString(),
      gcal_event_id: gcalId,
      gcal_link: gcalLink,
      recurrence,
      all_day: allDay,
      remind_min: remindMin,
    };
    if (gcalId) full.gcal_calendar_id = calendarId;

    try {
      let ins = await db.from("reminders").insert(full).select(COLS).single();
      if (ins.error) {
        // Optional columns may be missing (migrations not run) — retry with basics.
        const basic = { user_id: user.id, text, due_at: due.toISOString(), gcal_event_id: gcalId, gcal_link: gcalLink };
        ins = await db.from("reminders").insert(basic).select(COLS_BASIC).single();
      }
      if (ins.error) throw ins.error;
      return NextResponse.json({ ok: true, reminder: ins.data, synced: !!gcalId });
    } catch {
      if (gcalId) await deleteCalendarEvent(user.id, gcalId, calendarId);
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
  }

  if (action === "edit") {
    const id = (body.id || "").toString();
    const text = (body.text || "").toString().trim();
    if (!id || !text) return NextResponse.json({ ok: false, error: "bad_args" }, { status: 400 });
    const due = new Date((body.dueAt || "").toString());
    if (isNaN(due.getTime())) return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });
    const allDay = !!body.allDay;
    const recurrence = normRecur(body.recurrence);
    const remindMin = typeof body.remindMin === "number" ? body.remindMin : null;
    const dateStr = (body.dateStr || "").toString();

    // Load existing event so we can replace it on the calendar.
    let oldEv: string | null = null;
    let oldCal = "primary";
    try {
      const { data } = await db.from("reminders").select("gcal_event_id, gcal_calendar_id").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      oldEv = (data as any).gcal_event_id || null;
      oldCal = (data as any).gcal_calendar_id || "primary";
    } catch {
      const { data } = await db.from("reminders").select("gcal_event_id").eq("id", id).eq("user_id", user.id).maybeSingle();
      if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      oldEv = (data as any).gcal_event_id || null;
    }
    // Keep the same calendar as before (no calendar switch on edit).
    const calendarId = oldCal;

    // Replace the calendar event (delete old + create new) if connected.
    let gcalId: string | null = null;
    let gcalLink: string | null = null;
    if (await isCalendarConnected(user.id)) {
      if (oldEv) await deleteCalendarEvent(user.id, oldEv, calendarId);
      const r = await createCalendarEvent(user.id, buildEvent(text, due, allDay, dateStr, recurrence, remindMin), calendarId);
      if (r.ok) {
        gcalId = r.id;
        gcalLink = r.link;
      }
    }

    const full: any = {
      text,
      due_at: due.toISOString(),
      gcal_event_id: gcalId,
      gcal_link: gcalLink,
      recurrence,
      all_day: allDay,
      remind_min: remindMin,
    };
    if (gcalId) full.gcal_calendar_id = calendarId;

    try {
      let up = await db.from("reminders").update(full).eq("id", id).eq("user_id", user.id).select(COLS).single();
      if (up.error) {
        const basic = { text, due_at: due.toISOString(), gcal_event_id: gcalId, gcal_link: gcalLink };
        up = await db.from("reminders").update(basic).eq("id", id).eq("user_id", user.id).select(COLS_BASIC).single();
      }
      if (up.error) throw up.error;
      return NextResponse.json({ ok: true, reminder: up.data });
    } catch {
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
