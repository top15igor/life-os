"use client";

// Shared client-side loader for the user's Google calendars. Cached at module
// level so many AddToCalendar chips on one page trigger a single request.

export type Cal = { id: string; summary: string; primary: boolean; color?: string };

let cache: Promise<Cal[]> | null = null;

export function loadCalendars(): Promise<Cal[]> {
  if (!cache) {
    cache = fetch("/api/google-calendar/list")
      .then((r) => r.json())
      .then((j) => (j?.calendars || []) as Cal[])
      .catch(() => []);
  }
  return cache;
}

const KEY = "lifeos_cal_default";

export function getDefaultCal(): string {
  try {
    return localStorage.getItem(KEY) || "primary";
  } catch {
    return "primary";
  }
}

export function setDefaultCal(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}
