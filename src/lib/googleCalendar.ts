import { supabaseAdmin } from "./supabaseAdmin";

// One-way LIFE OS -> Google Calendar integration.
// We store a per-user offline refresh_token (users.google_refresh_token) and
// exchange it for a short-lived access token whenever we need to write events.

// calendar.events = write events; calendar.calendarlist.readonly = list the
// user's calendars (work / family / ...) so they can pick a target.
export const GCAL_SCOPE =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly";

// Exchange the stored refresh token for a fresh access token.
async function accessTokenFromRefresh(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }).then((x) => x.json());
    return r?.access_token || null;
  } catch {
    return null;
  }
}

// Read the user's stored refresh token (null = not connected / column missing).
export async function getRefreshToken(userId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("google_refresh_token")
      .eq("id", userId)
      .maybeSingle();
    return (data as any)?.google_refresh_token || null;
  } catch {
    return null;
  }
}

export async function isCalendarConnected(userId: string): Promise<boolean> {
  return !!(await getRefreshToken(userId));
}

// Map of ref_id -> html_link for items of the given kind(s) already in the
// calendar. Used to render "in calendar" state next to tasks/deeds/promises.
export async function getCalendarLinkMap(
  userId: string,
  kinds: string[]
): Promise<Record<string, string>> {
  try {
    const { data } = await supabaseAdmin()
      .from("calendar_links")
      .select("kind, ref_id, html_link")
      .eq("user_id", userId)
      .in("kind", kinds);
    const map: Record<string, string> = {};
    for (const row of (data as any[]) || []) map[`${row.kind}:${row.ref_id}`] = row.html_link || "";
    return map;
  } catch {
    return {};
  }
}

export async function setRefreshToken(userId: string, token: string | null): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin()
      .from("users")
      .update({ google_refresh_token: token })
      .eq("id", userId);
    return !error;
  } catch {
    return false;
  }
}

export type CalEvent = {
  summary: string;
  description?: string;
  startISO: string; // ISO 8601 with offset, e.g. 2026-07-01T15:00:00+03:00
  durationMin?: number; // default 30
  remindMinutes?: number[]; // popup reminders before start; default [10, 0]
};

export type CalResult = { ok: true; id: string; link: string } | { ok: false; error: string };

export type CalendarInfo = { id: string; summary: string; primary: boolean; color?: string };

// List the user's writable calendars (owner/writer) so they can choose a
// target (work / family / personal). Primary is sorted first.
export async function listCalendars(userId: string): Promise<CalendarInfo[]> {
  const refresh = await getRefreshToken(userId);
  if (!refresh) return [];
  const access = await accessTokenFromRefresh(refresh);
  if (!access) return [];
  try {
    const r = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer&fields=items(id,summary,primary,backgroundColor,accessRole)",
      { headers: { Authorization: `Bearer ${access}` } }
    ).then((x) => x.json());
    const items: any[] = r?.items || [];
    return items
      .filter((c) => c.accessRole === "owner" || c.accessRole === "writer")
      .map((c) => ({ id: c.id as string, summary: (c.summary as string) || c.id, primary: !!c.primary, color: c.backgroundColor }))
      .sort((a, b) => (a.primary === b.primary ? a.summary.localeCompare(b.summary) : a.primary ? -1 : 1));
  } catch {
    return [];
  }
}

// Create an event in the given calendar (default: primary). Returns id + link.
export async function createCalendarEvent(userId: string, ev: CalEvent, calendarId = "primary"): Promise<CalResult> {
  const refresh = await getRefreshToken(userId);
  if (!refresh) return { ok: false, error: "not_connected" };
  const access = await accessTokenFromRefresh(refresh);
  if (!access) return { ok: false, error: "token_failed" };

  const start = new Date(ev.startISO);
  if (isNaN(start.getTime())) return { ok: false, error: "bad_date" };
  const end = new Date(start.getTime() + (ev.durationMin ?? 30) * 60000);
  const mins = ev.remindMinutes ?? [10, 0];

  const body = {
    summary: ev.summary.slice(0, 200),
    description: ev.description?.slice(0, 1000),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: mins.map((m) => ({ method: "popup", minutes: Math.max(0, m) })),
    },
    source: { title: "LIFE OS", url: "https://mylifebookai.vercel.app" },
  };

  try {
    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    ).then((x) => x.json());
    if (r?.id) return { ok: true, id: r.id as string, link: (r.htmlLink as string) || "" };
    return { ok: false, error: r?.error?.message || "create_failed" };
  } catch {
    return { ok: false, error: "create_failed" };
  }
}

// Delete an event from the given calendar (best effort; missing = success).
export async function deleteCalendarEvent(userId: string, eventId: string, calendarId = "primary"): Promise<boolean> {
  const refresh = await getRefreshToken(userId);
  if (!refresh) return false;
  const access = await accessTokenFromRefresh(refresh);
  if (!access) return false;
  try {
    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${access}` } }
    );
    return r.status === 204 || r.status === 200 || r.status === 404 || r.status === 410;
  } catch {
    return false;
  }
}
