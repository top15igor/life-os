"use client";

import { useState, useEffect } from "react";
import { loadCalendars, getDefaultCal, setDefaultCal, type Cal } from "@/lib/calendarsClient";

type Reminder = {
  id: string;
  text: string;
  due_at: string;
  gcal_event_id: string | null;
  gcal_link: string | null;
  done: boolean;
  recurrence?: string | null;
  all_day?: boolean;
  remind_min?: number | null;
};

const STR: Record<string, any> = {
  ru: {
    calTitle: "Google Календарь",
    calOnDesc: "Напоминания и дела уходят в твой Google Календарь как реальные события с уведомлениями.",
    calOffDesc: "Подключи Google Календарь — и напоминания будут приходить уведомлением на телефон в нужное время.",
    connect: "Подключить Google Календарь",
    connected: "Подключён",
    disconnect: "Отключить",
    addTitle: "Новое напоминание",
    ph: "Что напомнить? Напр. «Позвонить врачу»",
    when: "Когда",
    add: "Добавить",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Изменить",
    upcoming: "Предстоящие",
    past: "Прошедшие",
    empty: "Пока нет напоминаний. Добавь первое выше.",
    inCal: "В календаре",
    notInCal: "Только в LIFE OS",
    del: "Удалить",
    allDay: "Весь день",
    repeat: "Повтор",
    remind: "Напомнить",
    okMsg: "Google Календарь подключён ✓",
    errMsg: "Не удалось подключить календарь. Попробуй ещё раз.",
    norefreshMsg: "Google не выдал доступ. Нажми «Подключить» ещё раз и подтверди разрешение на Календарь.",
    nologinMsg: "Сессия истекла — войди и попробуй снова.",
    repeatOpts: { none: "Не повторять", daily: "Каждый день", weekly: "Каждую неделю", monthly: "Каждый месяц", yearly: "Каждый год" },
    repeatBadge: { daily: "каждый день", weekly: "каждую неделю", monthly: "каждый месяц", yearly: "каждый год" },
    remindOpts: { 0: "В момент", 10: "За 10 мин", 30: "За 30 мин", 60: "За 1 час", 1440: "За 1 день" },
  },
  en: {
    calTitle: "Google Calendar",
    calOnDesc: "Reminders and to-dos go to your Google Calendar as real events with notifications.",
    calOffDesc: "Connect Google Calendar and reminders will pop up on your phone at the right time.",
    connect: "Connect Google Calendar",
    connected: "Connected",
    disconnect: "Disconnect",
    addTitle: "New reminder",
    ph: "Remind me to… e.g. “Call the doctor”",
    when: "When",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    upcoming: "Upcoming",
    past: "Past",
    empty: "No reminders yet. Add your first one above.",
    inCal: "In calendar",
    notInCal: "LIFE OS only",
    del: "Delete",
    allDay: "All day",
    repeat: "Repeat",
    remind: "Remind",
    okMsg: "Google Calendar connected ✓",
    errMsg: "Couldn't connect the calendar. Try again.",
    norefreshMsg: "Google didn't grant access. Tap Connect again and approve the Calendar permission.",
    nologinMsg: "Session expired — sign in and try again.",
    repeatOpts: { none: "Don't repeat", daily: "Every day", weekly: "Every week", monthly: "Every month", yearly: "Every year" },
    repeatBadge: { daily: "every day", weekly: "every week", monthly: "every month", yearly: "every year" },
    remindOpts: { 0: "At time", 10: "10 min before", 30: "30 min before", 60: "1 hour before", 1440: "1 day before" },
  },
  uk: {
    calTitle: "Google Календар",
    calOnDesc: "Нагадування і справи потрапляють у твій Google Календар як реальні події з сповіщеннями.",
    calOffDesc: "Підключи Google Календар — і нагадування приходитимуть сповіщенням на телефон вчасно.",
    connect: "Підключити Google Календар",
    connected: "Підключено",
    disconnect: "Відключити",
    addTitle: "Нове нагадування",
    ph: "Що нагадати? Напр. «Зателефонувати лікарю»",
    when: "Коли",
    add: "Додати",
    save: "Зберегти",
    cancel: "Скасувати",
    edit: "Змінити",
    upcoming: "Майбутні",
    past: "Минулі",
    empty: "Поки немає нагадувань. Додай перше вище.",
    inCal: "У календарі",
    notInCal: "Лише в LIFE OS",
    del: "Видалити",
    allDay: "Весь день",
    repeat: "Повтор",
    remind: "Нагадати",
    okMsg: "Google Календар підключено ✓",
    errMsg: "Не вдалося підключити календар. Спробуй ще раз.",
    norefreshMsg: "Google не надав доступ. Натисни «Підключити» ще раз і підтверди дозвіл на Календар.",
    nologinMsg: "Сесія завершилась — увійди і спробуй знову.",
    repeatOpts: { none: "Не повторювати", daily: "Щодня", weekly: "Щотижня", monthly: "Щомісяця", yearly: "Щороку" },
    repeatBadge: { daily: "щодня", weekly: "щотижня", monthly: "щомісяця", yearly: "щороку" },
    remindOpts: { 0: "У момент", 10: "За 10 хв", 30: "За 30 хв", 60: "За 1 год", 1440: "За 1 день" },
  },
  fr: {
    calTitle: "Google Agenda",
    calOnDesc: "Les rappels et tâches vont dans ton Google Agenda comme de vrais événements avec notifications.",
    calOffDesc: "Connecte Google Agenda et les rappels arriveront sur ton téléphone au bon moment.",
    connect: "Connecter Google Agenda",
    connected: "Connecté",
    disconnect: "Déconnecter",
    addTitle: "Nouveau rappel",
    ph: "Me rappeler de… ex. « Appeler le médecin »",
    when: "Quand",
    add: "Ajouter",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    upcoming: "À venir",
    past: "Passés",
    empty: "Aucun rappel pour l'instant. Ajoute le premier ci-dessus.",
    inCal: "Dans l'agenda",
    notInCal: "LIFE OS seulement",
    del: "Supprimer",
    allDay: "Toute la journée",
    repeat: "Répéter",
    remind: "Rappeler",
    okMsg: "Google Agenda connecté ✓",
    errMsg: "Échec de la connexion. Réessaie.",
    norefreshMsg: "Google n'a pas accordé l'accès. Appuie de nouveau sur Connecter et approuve l'autorisation Agenda.",
    nologinMsg: "Session expirée — connecte-toi et réessaie.",
    repeatOpts: { none: "Ne pas répéter", daily: "Chaque jour", weekly: "Chaque semaine", monthly: "Chaque mois", yearly: "Chaque année" },
    repeatBadge: { daily: "chaque jour", weekly: "chaque semaine", monthly: "chaque mois", yearly: "chaque année" },
    remindOpts: { 0: "À l'heure", 10: "10 min avant", 30: "30 min avant", 60: "1 h avant", 1440: "1 jour avant" },
  },
};

const REMIND_VALUES = [0, 10, 30, 60, 1440];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function tomorrow9() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

const inputStyle = { fontSize: 13.5, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" } as const;

// Reusable form for creating and editing a reminder.
function ReminderForm({
  s,
  connected,
  calendars,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  s: any;
  connected: boolean;
  calendars: Cal[];
  initial?: Reminder;
  submitLabel: string;
  onSubmit: (payload: any) => Promise<void>;
  onCancel?: () => void;
}) {
  const init = initial ? new Date(initial.due_at) : tomorrow9();
  const [text, setText] = useState(initial?.text || "");
  const [date, setDate] = useState(`${init.getFullYear()}-${pad(init.getMonth() + 1)}-${pad(init.getDate())}`);
  const [time, setTime] = useState(`${pad(init.getHours())}:${pad(init.getMinutes())}`);
  const [allDay, setAllDay] = useState(!!initial?.all_day);
  const [repeat, setRepeat] = useState(initial?.recurrence || "none");
  const [remindMin, setRemindMin] = useState<number>(typeof initial?.remind_min === "number" ? initial!.remind_min! : 10);
  const [calId, setCalId] = useState(initial ? "primary" : connected ? getDefaultCal() : "primary");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const due = allDay ? new Date(`${date}T00:00:00`) : new Date(`${date}T${time}`);
    const payload: any = {
      text: t,
      dueAt: due.toISOString(),
      dateStr: date,
      allDay,
      recurrence: repeat === "none" ? null : repeat,
      remindMin,
    };
    if (!initial) {
      payload.calendarId = calId;
      if (connected) setDefaultCal(calId);
    }
    await onSubmit(payload);
    setBusy(false);
    if (!initial) {
      setText("");
    }
  }

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={s.ph}
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontSize: 14, marginBottom: 10 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          {s.allDay}
        </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        {!allDay && <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-repeat" style={{ fontSize: 15, color: "var(--text-3)" }} />
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)} style={inputStyle}>
            {["none", "daily", "weekly", "monthly", "yearly"].map((k) => (
              <option key={k} value={k}>{s.repeatOpts[k]}</option>
            ))}
          </select>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-bell" style={{ fontSize: 15, color: "var(--text-3)" }} />
          <select value={remindMin} onChange={(e) => setRemindMin(Number(e.target.value))} style={inputStyle}>
            {REMIND_VALUES.map((v) => (
              <option key={v} value={v}>{s.remindOpts[v]}</option>
            ))}
          </select>
        </span>
        {!initial && connected && calendars.length > 1 && (
          <select value={calId} onChange={(e) => setCalId(e.target.value)} style={{ ...inputStyle, maxWidth: 170 }}>
            {calendars.map((c) => (
              <option key={c.id} value={c.primary ? "primary" : c.id}>{c.summary}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500, color: "#fff", background: text.trim() ? "var(--accent)" : "var(--text-3)", padding: "9px 18px", borderRadius: 10, border: "none", cursor: text.trim() ? "pointer" : "default" }}
        >
          <i className={`ti ${initial ? "ti-check" : "ti-plus"}`} style={{ fontSize: 16 }} />
          {submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ fontSize: 13.5, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>
            {s.cancel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RemindersView({
  locale,
  initial,
  connected,
  calStatus,
}: {
  locale: string;
  initial: Reminder[];
  connected: boolean;
  calStatus?: string;
}) {
  const s = STR[locale] || STR.ru;
  const [items, setItems] = useState<Reminder[]>(initial);
  const [calendars, setCalendars] = useState<Cal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) return;
    loadCalendars().then(setCalendars);
  }, [connected]);

  const banner =
    calStatus === "ok"
      ? { msg: s.okMsg, ok: true }
      : calStatus === "norefresh"
      ? { msg: s.norefreshMsg, ok: false }
      : calStatus === "nologin"
      ? { msg: s.nologinMsg, ok: false }
      : calStatus && calStatus !== "ok"
      ? { msg: s.errMsg, ok: false }
      : null;

  async function create(payload: any) {
    try {
      const r = await fetch("/api/reminder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", ...payload }),
      }).then((x) => x.json());
      if (r.ok && r.reminder) setItems((prev) => [...prev, r.reminder].sort((a, b) => a.due_at.localeCompare(b.due_at)));
    } catch {}
  }

  async function saveEdit(id: string, payload: any) {
    try {
      const r = await fetch("/api/reminder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "edit", id, ...payload }),
      }).then((x) => x.json());
      if (r.ok && r.reminder) {
        setItems((prev) => prev.map((x) => (x.id === id ? r.reminder : x)).sort((a, b) => a.due_at.localeCompare(b.due_at)));
        setEditingId(null);
      }
    } catch {}
  }

  async function del(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    fetch("/api/reminder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }).catch(() => {});
  }

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, done } : x)));
    fetch("/api/reminder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "done", id, done }) }).catch(() => {});
  }

  function fmt(r: Reminder): string {
    const loc = locale === "uk" ? "uk-UA" : locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "ru-RU";
    try {
      const d = new Date(r.due_at);
      if (r.all_day) return d.toLocaleDateString(loc, { day: "numeric", month: "short" });
      return d.toLocaleString(loc, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return r.due_at;
    }
  }

  const now = Date.now();
  const upcoming = items.filter((x) => new Date(x.due_at).getTime() >= now && !x.done);
  const past = items.filter((x) => new Date(x.due_at).getTime() < now || x.done);

  const Row = (r: Reminder) => {
    if (editingId === r.id) {
      return (
        <div key={r.id} className="card" style={{ marginBottom: 8, padding: "14px 16px" }}>
          <ReminderForm s={s} connected={connected} calendars={calendars} initial={r} submitLabel={s.save} onSubmit={(p) => saveEdit(r.id, p)} onCancel={() => setEditingId(null)} />
        </div>
      );
    }
    return (
      <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8, padding: "12px 14px" }}>
        <i
          onClick={() => toggle(r.id, !r.done)}
          className={`ti ${r.done ? "ti-square-check" : "ti-square"}`}
          style={{ fontSize: 20, color: r.done ? "var(--positive)" : "var(--text-3)", cursor: "pointer", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: r.done ? "var(--text-3)" : "var(--text)", textDecoration: r.done ? "line-through" : "none" }}>{r.text}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12, color: "var(--text-3)", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-clock" style={{ fontSize: 13 }} />
              {fmt(r)}
            </span>
            {r.recurrence && s.repeatBadge[r.recurrence] && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--accent)" }}>
                <i className="ti ti-repeat" style={{ fontSize: 13 }} />
                {s.repeatBadge[r.recurrence]}
              </span>
            )}
            {r.gcal_link ? (
              <a href={r.gcal_link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--positive)", textDecoration: "none" }}>
                <i className="ti ti-calendar-check" style={{ fontSize: 13 }} />
                {s.inCal}
              </a>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <i className="ti ti-device-mobile" style={{ fontSize: 13 }} />
                {s.notInCal}
              </span>
            )}
          </div>
        </div>
        <i onClick={() => setEditingId(r.id)} className="ti ti-pencil" title={s.edit} style={{ fontSize: 16, color: "var(--text-3)", cursor: "pointer", flexShrink: 0 }} />
        <i onClick={() => del(r.id)} className="ti ti-trash" title={s.del} style={{ fontSize: 17, color: "var(--text-3)", cursor: "pointer", flexShrink: 0 }} />
      </div>
    );
  };

  return (
    <div>
      {banner && (
        <div className="card" style={{ marginBottom: 14, padding: "11px 14px", fontSize: 13.5, color: banner.ok ? "var(--positive)" : "var(--negative)", borderColor: banner.ok ? "var(--positive)" : "var(--negative)" }}>
          {banner.msg}
        </div>
      )}

      {/* Google Calendar connection */}
      <div className="card" style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="ti ti-calendar" style={{ fontSize: 20, color: "var(--accent)" }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>{s.calTitle}</div>
          {connected && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--positive)", fontWeight: 500 }}>
              <i className="ti ti-circle-check" style={{ fontSize: 15 }} />
              {s.connected}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>{connected ? s.calOnDesc : s.calOffDesc}</div>
        {connected ? (
          <button
            onClick={async () => {
              await fetch("/api/google-calendar/disconnect", { method: "POST" });
              location.reload();
            }}
            style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "8px 14px", borderRadius: 10, cursor: "pointer" }}
          >
            {s.disconnect}
          </button>
        ) : (
          <a
            href="/api/google-calendar/connect?back=/reminders"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 500, color: "#fff", background: "var(--accent)", padding: "9px 16px", borderRadius: 10, textDecoration: "none" }}
          >
            <i className="ti ti-brand-google" style={{ fontSize: 16 }} />
            {s.connect}
          </a>
        )}
      </div>

      {/* Add reminder */}
      <div className="card" style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{s.addTitle}</div>
        <ReminderForm s={s} connected={connected} calendars={calendars} submitLabel={s.add} onSubmit={create} />
      </div>

      {/* Lists */}
      {items.length === 0 ? (
        <div className="card" style={{ padding: "18px 16px", textAlign: "center", fontSize: 13.5, color: "var(--text-3)" }}>{s.empty}</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 9 }}>{s.upcoming} · {upcoming.length}</div>
              {upcoming.map(Row)}
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 9 }}>{s.past} · {past.length}</div>
              {past.map(Row)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
