"use client";

import { useState } from "react";

type Reminder = { id: string; text: string; due_at: string; gcal_event_id: string | null; gcal_link: string | null; done: boolean };

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
    upcoming: "Предстоящие",
    past: "Прошедшие",
    empty: "Пока нет напоминаний. Добавь первое выше.",
    inCal: "В календаре",
    notInCal: "Только в LIFE OS",
    del: "Удалить",
    okMsg: "Google Календарь подключён ✓",
    errMsg: "Не удалось подключить календарь. Попробуй ещё раз.",
    norefreshMsg: "Google не выдал доступ. Нажми «Подключить» ещё раз и подтверди разрешение на Календарь.",
    nologinMsg: "Сессия истекла — войди и попробуй снова.",
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
    upcoming: "Upcoming",
    past: "Past",
    empty: "No reminders yet. Add your first one above.",
    inCal: "In calendar",
    notInCal: "LIFE OS only",
    del: "Delete",
    okMsg: "Google Calendar connected ✓",
    errMsg: "Couldn't connect the calendar. Try again.",
    norefreshMsg: "Google didn't grant access. Tap Connect again and approve the Calendar permission.",
    nologinMsg: "Session expired — sign in and try again.",
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
    upcoming: "Майбутні",
    past: "Минулі",
    empty: "Поки немає нагадувань. Додай перше вище.",
    inCal: "У календарі",
    notInCal: "Лише в LIFE OS",
    del: "Видалити",
    okMsg: "Google Календар підключено ✓",
    errMsg: "Не вдалося підключити календар. Спробуй ще раз.",
    norefreshMsg: "Google не надав доступ. Натисни «Підключити» ще раз і підтверди дозвіл на Календар.",
    nologinMsg: "Сесія завершилась — увійди і спробуй знову.",
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
    upcoming: "À venir",
    past: "Passés",
    empty: "Aucun rappel pour l'instant. Ajoute le premier ci-dessus.",
    inCal: "Dans l'agenda",
    notInCal: "LIFE OS seulement",
    del: "Supprimer",
    okMsg: "Google Agenda connecté ✓",
    errMsg: "Échec de la connexion. Réessaie.",
    norefreshMsg: "Google n'a pas accordé l'accès. Appuie de nouveau sur Connecter et approuve l'autorisation Agenda.",
    nologinMsg: "Session expirée — connecte-toi et réessaie.",
  },
};

function defaultWhen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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
  const [text, setText] = useState("");
  const [when, setWhen] = useState(defaultWhen());
  const [busy, setBusy] = useState(false);

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

  async function add() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const dueAt = new Date(when).toISOString();
      const r = await fetch("/api/reminder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", text: t, dueAt }),
      }).then((x) => x.json());
      if (r.ok && r.reminder) {
        setItems((prev) => [...prev, r.reminder].sort((a, b) => a.due_at.localeCompare(b.due_at)));
        setText("");
      }
    } catch {}
    setBusy(false);
  }

  async function del(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    fetch("/api/reminder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    }).catch(() => {});
  }

  function toggle(id: string, done: boolean) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, done } : x)));
    fetch("/api/reminder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "done", id, done }),
    }).catch(() => {});
  }

  function fmt(iso: string): string {
    try {
      return new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  const now = Date.now();
  const upcoming = items.filter((x) => new Date(x.due_at).getTime() >= now && !x.done);
  const past = items.filter((x) => new Date(x.due_at).getTime() < now || x.done);

  const Row = (r: Reminder) => (
    <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8, padding: "12px 14px" }}>
      <i
        onClick={() => toggle(r.id, !r.done)}
        className={`ti ${r.done ? "ti-square-check" : "ti-square"}`}
        style={{ fontSize: 20, color: r.done ? "var(--positive)" : "var(--text-3)", cursor: "pointer", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: r.done ? "var(--text-3)" : "var(--text)", textDecoration: r.done ? "line-through" : "none" }}>{r.text}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-clock" style={{ fontSize: 13 }} />
            {fmt(r.due_at)}
          </span>
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
      <i onClick={() => del(r.id)} className="ti ti-trash" title={s.del} style={{ fontSize: 17, color: "var(--text-3)", cursor: "pointer", flexShrink: 0 }} />
    </div>
  );

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
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>
          {connected ? s.calOnDesc : s.calOffDesc}
        </div>
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
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={s.ph}
          style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", marginBottom: 10 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "var(--text-2)" }}>{s.when}</label>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            style={{ fontSize: 13.5, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button
            onClick={add}
            disabled={busy || !text.trim()}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500, color: "#fff", background: text.trim() ? "var(--accent)" : "var(--text-3)", padding: "9px 18px", borderRadius: 10, border: "none", cursor: text.trim() ? "pointer" : "default" }}
          >
            <i className="ti ti-plus" style={{ fontSize: 16 }} />
            {s.add}
          </button>
        </div>
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
