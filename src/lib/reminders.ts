import { supabaseAdmin } from "./supabaseAdmin";
import { createCalendarEvent, deleteCalendarEvent, type Recurrence } from "./googleCalendar";

export type NewReminder = {
  text: string;
  dueISO: string;
  dateStr?: string; // YYYY-MM-DD (for all-day)
  allDay?: boolean;
  recurrence?: Recurrence | null;
  remindMin?: number | null;
  calendarId?: string;
};

const COLS = "id, text, due_at, gcal_event_id, gcal_link, done, recurrence, all_day, remind_min, gcal_calendar_id";
const COLS_BASIC = "id, text, due_at, gcal_event_id, gcal_link, done";

// Create a reminder row and (if the calendar is connected) a matching Google
// Calendar event. Shared by the web API, the Telegram bot and voice commands.
export async function createReminder(userId: string, r: NewReminder): Promise<{ ok: boolean; reminder?: any; synced: boolean }> {
  const db = supabaseAdmin();
  const due = new Date(r.dueISO);
  if (isNaN(due.getTime())) return { ok: false, synced: false };
  const calendarId = r.calendarId || "primary";
  const recurrence = r.recurrence || null;
  const allDay = !!r.allDay;
  const remindMin = typeof r.remindMin === "number" ? r.remindMin : null;

  let gcalId: string | null = null;
  let gcalLink: string | null = null;
  const ev = await createCalendarEvent(
    userId,
    {
      summary: r.text,
      description: "LIFE OS reminder",
      startISO: due.toISOString(),
      remindMinutes: [typeof remindMin === "number" ? remindMin : 10],
      allDay,
      dateStr: r.dateStr || due.toISOString().slice(0, 10),
      recurrence,
    },
    calendarId
  );
  if (ev.ok) {
    gcalId = ev.id;
    gcalLink = ev.link;
  }

  const full: any = {
    user_id: userId,
    text: r.text,
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
      const basic = { user_id: userId, text: r.text, due_at: due.toISOString(), gcal_event_id: gcalId, gcal_link: gcalLink };
      ins = await db.from("reminders").insert(basic).select(COLS_BASIC).single();
    }
    if (ins.error) throw ins.error;
    return { ok: true, reminder: ins.data, synced: !!gcalId };
  } catch {
    if (gcalId) await deleteCalendarEvent(userId, gcalId, calendarId);
    return { ok: false, synced: false };
  }
}

// Convert a local wall-clock date/time to a UTC ISO string.
// local = UTC + offset  =>  UTC = local - offset.
export function localToISO(dateStr: string, timeStr: string | null, tzOffsetMin: number | null): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const t = timeStr && /^\d{1,2}:\d{2}$/.test(timeStr) ? (timeStr.length === 4 ? "0" + timeStr : timeStr) : "00:00";
  const asUTC = Date.parse(`${dateStr}T${t}:00Z`);
  if (isNaN(asUTC)) return null;
  const off = typeof tzOffsetMin === "number" ? tzOffsetMin : 0;
  return new Date(asUTC - off * 60000).toISOString();
}
