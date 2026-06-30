"use client";

import { useState } from "react";
import { loadCalendars, getDefaultCal, setDefaultCal, type Cal } from "@/lib/calendarsClient";

type Kind = "task" | "deed" | "promise";

const STR: Record<string, any> = {
  ru: { add: "В календарь", inCal: "В календаре", save: "Добавить", connect: "Подключи календарь", saving: "…", err: "Ошибка" },
  en: { add: "To calendar", inCal: "In calendar", save: "Add", connect: "Connect calendar", saving: "…", err: "Error" },
  uk: { add: "У календар", inCal: "У календарі", save: "Додати", connect: "Підключи календар", saving: "…", err: "Помилка" },
  fr: { add: "Au calendrier", inCal: "Au calendrier", save: "Ajouter", connect: "Connecter l'agenda", saving: "…", err: "Erreur" },
};

// Default: tomorrow 09:00 local, formatted for <input type="datetime-local">.
function defaultWhen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AddToCalendar({
  kind,
  refId,
  title,
  locale,
  connected,
  link,
}: {
  kind: Kind;
  refId: string;
  title: string;
  locale: string;
  connected: boolean;
  link?: string | null;
}) {
  const s = STR[locale] || STR.ru;
  const [curLink, setCurLink] = useState<string | null>(link === undefined ? null : link);
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(defaultWhen());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [calendars, setCalendars] = useState<Cal[]>([]);
  const [calId, setCalId] = useState("primary");

  function openPicker() {
    setCalId(getDefaultCal());
    loadCalendars().then(setCalendars);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const dueAt = new Date(when).toISOString(); // local -> UTC ISO
      const r = await fetch("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, refId, title, dueAt, calendarId: calId }),
      }).then((x) => x.json());
      if (r.ok) {
        setCurLink(r.link || "");
        setOpen(false);
      } else setErr((r.error || s.err).toString().slice(0, 160));
    } catch {
      setErr(s.err);
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    try {
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, refId, unpush: true }),
      });
      setCurLink(null);
    } catch {}
    setBusy(false);
  }

  const chip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 9px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    color: "var(--text-2)",
    cursor: "pointer",
    flexShrink: 0,
  } as const;

  // Already in calendar.
  if (curLink !== null) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {curLink ? (
          <a href={curLink} target="_blank" rel="noreferrer" style={{ ...chip, color: "var(--positive)", borderColor: "var(--positive)", textDecoration: "none" }}>
            <i className="ti ti-calendar-check" style={{ fontSize: 14 }} />
            {s.inCal}
          </a>
        ) : (
          <span style={{ ...chip, color: "var(--positive)", borderColor: "var(--positive)", cursor: "default" }}>
            <i className="ti ti-calendar-check" style={{ fontSize: 14 }} />
            {s.inCal}
          </span>
        )}
        <i onClick={busy ? undefined : remove} className="ti ti-x" title="" style={{ fontSize: 14, color: "var(--text-3)", cursor: "pointer" }} />
      </span>
    );
  }

  // Not connected: send the user to /reminders where the connect button lives.
  if (!connected) {
    return (
      <a href="/reminders" style={{ ...chip, textDecoration: "none" }}>
        <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} />
        {s.connect}
      </a>
    );
  }

  if (!open) {
    return (
      <button onClick={openPicker} style={{ ...chip, font: "inherit" }}>
        <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} />
        {s.add}
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        style={{ fontSize: 12.5, padding: "5px 7px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
      />
      {calendars.length > 1 && (
        <select
          value={calId}
          onChange={(e) => { setCalId(e.target.value); setDefaultCal(e.target.value); }}
          style={{ fontSize: 12.5, padding: "5px 7px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", maxWidth: 150 }}
        >
          {calendars.map((c) => (
            <option key={c.id} value={c.primary ? "primary" : c.id}>{c.summary}</option>
          ))}
        </select>
      )}
      <button onClick={save} disabled={busy} style={{ ...chip, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>
        {busy ? s.saving : s.save}
      </button>
      <i onClick={() => setOpen(false)} className="ti ti-x" style={{ fontSize: 14, color: "var(--text-3)", cursor: "pointer" }} />
      {err && <span style={{ fontSize: 11, color: "var(--negative)", maxWidth: 240, lineHeight: 1.3 }}>{err}</span>}
    </span>
  );
}
