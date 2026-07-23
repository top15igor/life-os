"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// ===== Дневник путешествий: хронология поездок с фото и записями =====

type TripEntry = { id: string; date: string; text: string };
type Trip = {
  id: string; title: string; destination: string | null; country: string | null; emoji: string | null;
  date_start: string | null; date_end: string | null; status: string; story: string | null;
  cover_url: string | null; photos: string[]; entries: TripEntry[];
};
type Suggestion = { key: string; name: string; date_start: string; date_end: string; count: number; sample: string };
type MemPhoto = { id: string; url: string; title: string; date: string | null };

const STR: Record<string, any> = {
  ru: {
    stats: (t: number, c: number) => `${t} ${plural(t, ["поездка", "поездки", "поездок"])}${c ? ` · ${c} ${plural(c, ["страна", "страны", "стран"])}` : ""}`,
    suggTitle: "Похоже, это были поездки",
    suggSub: "Нашёл в твоём дневнике. Добавь в один клик — записи и фото тех дней подтянутся сами.",
    add: "Добавить", hide: "Скрыть", adding: "Добавляю…",
    newTrip: "Добавить поездку",
    empty: "Хронология пока пустая. Добавь первую поездку — или расскажи о путешествии в записи («съездил в…»), и я предложу её сюда сам.",
    entriesN: (n: number) => `${n} ${plural(n, ["запись", "записи", "записей"])}`,
    photosN: (n: number) => `${n} ${plural(n, ["фото", "фото", "фото"])}`,
    planned: "запланирована",
    story: "История поездки", storyPh: "Что это была за поездка? Пара строк на память…",
    photos: "Фотографии", addPhoto: "Фото из памяти", noMem: "В «Визуальной памяти» пока нет фото — пришли фото боту, и они появятся здесь.",
    entries: "Записи тех дней", openEntry: "Открыть",
    edit: "Изменить", save: "Сохранить", saving: "Сохраняю…", cancel: "Отмена", close: "Закрыть",
    del: "Удалить поездку", delConfirm: "Точно удалить? Записи дневника останутся, исчезнет только поездка.",
    fTitle: "Название", fTitlePh: "Биарриц", fEmoji: "Эмодзи", fStart: "Начало", fEnd: "Конец", fStory: "История",
    cover: "Сделать обложкой", coverBadge: "обложка", removePhoto: "Убрать",
    pickerTitle: "Выбери фото поездки", pickerSub: "Из «Визуальной памяти»", done: "Готово",
    create: "Создать", creating: "Создаю…",
  },
  en: {
    stats: (t: number, c: number) => `${t} ${t === 1 ? "trip" : "trips"}${c ? ` · ${c} ${c === 1 ? "country" : "countries"}` : ""}`,
    suggTitle: "These look like trips",
    suggSub: "Found in your diary. Add in one click — entries and photos from those days attach automatically.",
    add: "Add", hide: "Hide", adding: "Adding…",
    newTrip: "Add a trip",
    empty: "Your timeline is empty. Add your first trip — or mention a journey in an entry («went to…») and I'll suggest it here.",
    entriesN: (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`,
    photosN: (n: number) => `${n} ${n === 1 ? "photo" : "photos"}`,
    planned: "planned",
    story: "Trip story", storyPh: "What was this trip like? A few lines to remember…",
    photos: "Photos", addPhoto: "Photo from memory", noMem: "No photos in Visual Memory yet — send a photo to the bot and they'll appear here.",
    entries: "Entries from those days", openEntry: "Open",
    edit: "Edit", save: "Save", saving: "Saving…", cancel: "Cancel", close: "Close",
    del: "Delete trip", delConfirm: "Delete this trip? Diary entries stay — only the trip disappears.",
    fTitle: "Title", fTitlePh: "Biarritz", fEmoji: "Emoji", fStart: "Start", fEnd: "End", fStory: "Story",
    cover: "Make cover", coverBadge: "cover", removePhoto: "Remove",
    pickerTitle: "Pick trip photos", pickerSub: "From Visual Memory", done: "Done",
    create: "Create", creating: "Creating…",
  },
};
STR.uk = STR.ru;
STR.fr = STR.en;

function plural(n: number, f: [string, string, string]): string {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return f[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
  return f[2];
}

function fmtRange(locale: string, s?: string | null, e?: string | null): string {
  if (!s) return "";
  const lc = locale === "uk" ? "uk" : locale === "en" ? "en" : locale === "fr" ? "fr" : "ru";
  const d = (x: string) => new Date(x + "T00:00:00Z");
  const day = new Intl.DateTimeFormat(lc, { day: "numeric", month: "short", timeZone: "UTC" });
  const full = new Intl.DateTimeFormat(lc, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  if (!e || e === s) return full.format(d(s));
  const sameYear = s.slice(0, 4) === e.slice(0, 4);
  return sameYear ? `${day.format(d(s))} — ${full.format(d(e))}` : `${full.format(d(s))} — ${full.format(d(e))}`;
}

const btn = (bg: string, fg = "#fff"): any => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", background: bg, color: fg, fontSize: 13, fontWeight: 500, cursor: "pointer" });
const inputSt: any = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: 13.5 };

export default function TravelDiary({ locale, trips: trips0, suggestions: sugg0, memories }: { locale: string; trips: Trip[]; suggestions: Suggestion[]; memories: MemPhoto[] }) {
  const s = STR[locale] || STR.ru;
  const [trips, setTrips] = useState<Trip[]>(trips0);
  const [sugg, setSugg] = useState<Suggestion[]>(sugg0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function api(body: any): Promise<boolean> {
    const r = await fetch("/api/trips", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => null);
    if (r && Array.isArray(r.trips)) { setTrips(r.trips); setSugg(r.suggestions || []); }
    return !!r?.ok;
  }

  const countries = new Set(trips.map((t) => t.country).filter(Boolean)).size;
  const open = trips.find((t) => t.id === openId) || null;

  // Группировка по годам для таймлайна.
  const byYear = new Map<string, Trip[]>();
  for (const t of trips) {
    const y = (t.date_start || "").slice(0, 4) || "—";
    const arr = byYear.get(y);
    if (arr) arr.push(t);
    else byYear.set(y, [t]);
  }
  const years = [...byYear.keys()].sort((a, b) => (a === "—" ? 1 : b === "—" ? -1 : b.localeCompare(a)));

  return (
    <div>
      {/* Шапка: статистика + добавить */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>{trips.length > 0 ? s.stats(trips.length, countries) : ""}</div>
        <button onClick={() => setAddOpen(true)} style={btn("var(--accent)")}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} />{s.newTrip}
        </button>
      </div>

      {/* Автопредложения */}
      {sugg.length > 0 && (
        <div style={{ borderRadius: 15, border: "1.5px dashed var(--accent)", background: "var(--accent-bg)", padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>✨ {s.suggTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11, lineHeight: 1.45 }}>{s.suggSub}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 9 }}>
            {sugg.map((g) => (
              <div key={g.key} style={{ background: "var(--surface)", borderRadius: 12, padding: "11px 13px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>✈️ {g.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", margin: "2px 0 7px" }}>{fmtRange(locale, g.date_start, g.date_end)} · {s.entriesN(g.count)}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4, marginBottom: 9, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{g.sample}</div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button disabled={busyKey === g.key} onClick={async () => { setBusyKey(g.key); await api({ action: "accept", key: g.key }); setBusyKey(null); }} style={{ ...btn("var(--accent)"), padding: "6px 12px", fontSize: 12.5, opacity: busyKey === g.key ? 0.6 : 1 }}>
                    {busyKey === g.key ? s.adding : s.add}
                  </button>
                  <button onClick={() => api({ action: "dismiss", key: g.key })} style={{ ...btn("transparent", "var(--text-3)"), padding: "6px 8px", fontSize: 12.5 }}>{s.hide}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Таймлайн по годам */}
      {trips.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.5 }}>{s.empty}</div>
      ) : (
        years.map((y) => (
          <div key={y} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, margin: "14px 0 10px", display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: "var(--accent)" }}>{y}</span>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
            <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 7, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {byYear.get(y)!.map((t) => (
                <div key={t.id} style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: -24.5, top: 20, width: 11, height: 11, borderRadius: 99, background: "var(--accent)", border: "2.5px solid var(--surface)" }} />
                  <button onClick={() => setOpenId(t.id)} className="card" style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 13, cursor: "pointer", padding: "13px 15px" }}>
                    {t.cover_url ? (
                      <img src={t.cover_url} alt="" style={{ width: 54, height: 54, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 54, height: 54, borderRadius: 11, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, flexShrink: 0 }}>{t.emoji || "✈️"}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}{t.country ? <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 12.5 }}> · {t.country}</span> : null}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
                        {t.status === "planned" ? `🗓 ${s.planned}` : fmtRange(locale, t.date_start, t.date_end)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                        {[t.entries.length ? s.entriesN(t.entries.length) : null, t.photos.length ? s.photosN(t.photos.length) : null].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 17, color: "var(--text-3)", flexShrink: 0 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {mounted && open && createPortal(<TripModal s={s} locale={locale} trip={open} memories={memories} api={api} onClose={() => setOpenId(null)} />, document.body)}
      {mounted && addOpen && createPortal(<AddModal s={s} api={api} onClose={() => setAddOpen(false)} />, document.body)}
    </div>
  );
}

// ===== Модалка поездки: история, фото, записи, редактирование =====
function TripModal({ s, locale, trip, memories, api, onClose }: any) {
  const [story, setStory] = useState(trip.story || "");
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ title: trip.title, emoji: trip.emoji || "", date_start: trip.date_start || "", date_end: trip.date_end || "" });
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function saveStory() { setSaving(true); await api({ action: "update", id: trip.id, fields: { story } }); setSaving(false); }
  async function saveFields() {
    setSaving(true);
    await api({ action: "update", id: trip.id, fields: { title: f.title, emoji: f.emoji || null, date_start: f.date_start || null, date_end: f.date_end || null } });
    setSaving(false); setEdit(false);
  }
  async function setPhotos(photos: string[], cover?: string | null) {
    await api({ action: "update", id: trip.id, fields: { photos, ...(cover !== undefined ? { cover_url: cover } : {}) } });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: "22px 20px", maxWidth: 640, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        {/* Шапка */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 34, lineHeight: 1 }}>{trip.emoji || "✈️"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{trip.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
              {trip.status === "planned" ? `🗓 ${s.planned}` : fmtRange(locale, trip.date_start, trip.date_end)}{trip.country ? ` · ${trip.country}` : ""}
            </div>
          </div>
          <button onClick={() => setEdit((v: boolean) => !v)} style={{ ...btn("var(--surface-2)", "var(--text-2)"), padding: "7px 11px", fontSize: 12.5 }}><i className="ti ti-pencil" style={{ fontSize: 14 }} />{s.edit}</button>
          <button onClick={onClose} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}><i className="ti ti-x" style={{ fontSize: 20 }} /></button>
        </div>

        {/* Редактирование полей */}
        {edit && (
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 14px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-3)" }}>{s.fTitle}
              <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fEmoji}
              <input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value.slice(0, 4) })} style={{ ...inputSt, marginTop: 4 }} />
            </label>
            <span />
            <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fStart}
              <input type="date" value={f.date_start} onChange={(e) => setF({ ...f, date_start: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fEnd}
              <input type="date" value={f.date_end} onChange={(e) => setF({ ...f, date_end: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={async () => { if (confirm(s.delConfirm)) { await api({ action: "delete", id: trip.id }); onClose(); } }} style={{ ...btn("transparent", "#dc2626"), padding: "7px 8px", fontSize: 12.5 }}><i className="ti ti-trash" style={{ fontSize: 14 }} />{s.del}</button>
              <button onClick={saveFields} disabled={saving} style={{ ...btn("var(--accent)"), opacity: saving ? 0.6 : 1 }}>{saving ? s.saving : s.save}</button>
            </div>
          </div>
        )}

        {/* История */}
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>{s.story}</div>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} onBlur={() => story !== (trip.story || "") && saveStory()} rows={3} placeholder={s.storyPh}
          style={{ ...inputSt, resize: "vertical", lineHeight: 1.55, fontFamily: "inherit", marginBottom: 16 }} />

        {/* Фото */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>{s.photos}</span>
          <button onClick={() => setPickerOpen(true)} style={{ ...btn("var(--accent-bg)", "var(--accent-text)"), padding: "6px 11px", fontSize: 12.5 }}><i className="ti ti-photo-plus" style={{ fontSize: 14 }} />{s.addPhoto}</button>
        </div>
        {trip.photos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: 8, marginBottom: 6 }}>
            {trip.photos.map((url: string) => (
              <div key={url} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", border: url === trip.cover_url ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {url === trip.cover_url && <span style={{ position: "absolute", left: 5, top: 5, fontSize: 10, background: "var(--accent)", color: "#fff", borderRadius: 6, padding: "2px 6px" }}>{s.coverBadge}</span>}
                <div style={{ position: "absolute", right: 4, bottom: 4, display: "flex", gap: 4 }}>
                  {url !== trip.cover_url && (
                    <button title={s.cover} onClick={() => setPhotos(trip.photos, url)} style={{ background: "rgba(0,0,0,.55)", border: "none", color: "#fff", borderRadius: 7, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-star" style={{ fontSize: 14 }} /></button>
                  )}
                  <button title={s.removePhoto} onClick={() => { const next = trip.photos.filter((u: string) => u !== url); setPhotos(next, trip.cover_url === url ? next[0] || null : undefined); }} style={{ background: "rgba(0,0,0,.55)", border: "none", color: "#fff", borderRadius: 7, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Записи тех дней */}
        {trip.entries.length > 0 && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", margin: "14px 0 8px" }}>{s.entries}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {trip.entries.map((e: TripEntry) => (
                <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--surface-2)", borderRadius: 10, padding: "9px 12px", textDecoration: "none" }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap", marginTop: 2 }}>{fmtRange(locale, e.date)}</span>
                  <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.text}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {pickerOpen && (
          <PhotoPicker s={s} memories={memories} selected={trip.photos} onClose={() => setPickerOpen(false)}
            onApply={(urls: string[]) => { setPhotos(urls, trip.cover_url && urls.includes(trip.cover_url) ? undefined : urls[0] || null); setPickerOpen(false); }} />
        )}
      </div>
    </div>
  );
}

// ===== Выбор фото из «Визуальной памяти» =====
function PhotoPicker({ s, memories, selected, onApply, onClose }: any) {
  const [sel, setSel] = useState<string[]>(selected || []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: "18px 16px", maxWidth: 560, width: "100%", maxHeight: "84vh", overflowY: "auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{s.pickerTitle}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>{s.pickerSub}</div>
        {memories.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{s.noMem}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: 7 }}>
            {memories.map((m: MemPhoto) => {
              const on = sel.includes(m.url);
              return (
                <button key={m.id} onClick={() => setSel(on ? sel.filter((u) => u !== m.url) : [...sel, m.url])} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", border: on ? "2.5px solid var(--accent)" : "1px solid var(--border)", padding: 0, cursor: "pointer", background: "none" }}>
                  <img src={m.url} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: on ? 1 : 0.85 }} />
                  {on && <span style={{ position: "absolute", right: 4, top: 4, width: 20, height: 20, borderRadius: 99, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-check" style={{ fontSize: 13 }} /></span>}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={{ ...btn("transparent", "var(--text-2)") }}>{s.cancel}</button>
          <button onClick={() => onApply(sel)} style={btn("var(--accent)")}>{s.done}</button>
        </div>
      </div>
    </div>
  );
}

// ===== Ручное создание поездки =====
function AddModal({ s, api, onClose }: any) {
  const [f, setF] = useState({ title: "", emoji: "✈️", date_start: "", date_end: "", story: "" });
  const [busy, setBusy] = useState(false);
  async function create() {
    if (!f.title.trim()) return;
    setBusy(true);
    await api({ action: "create", fields: { title: f.title.trim(), destination: f.title.trim(), emoji: f.emoji || null, date_start: f.date_start || null, date_end: f.date_end || null, story: f.story || null } });
    setBusy(false); onClose();
  }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: "20px 18px", maxWidth: 440, width: "100%" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 13 }}>✈️ {s.newTrip}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 10, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fTitle}
            <input autoFocus value={f.title} placeholder={s.fTitlePh} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fEmoji}
            <input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value.slice(0, 4) })} style={{ ...inputSt, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fStart}
            <input type="date" value={f.date_start} onChange={(e) => setF({ ...f, date_start: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: "var(--text-3)" }}>{s.fEnd}
            <input type="date" value={f.date_end} onChange={(e) => setF({ ...f, date_end: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
          </label>
        </div>
        <label style={{ fontSize: 12, color: "var(--text-3)", display: "block", marginBottom: 14 }}>{s.fStory}
          <textarea value={f.story} rows={3} placeholder={s.storyPh} onChange={(e) => setF({ ...f, story: e.target.value })} style={{ ...inputSt, marginTop: 4, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ ...btn("transparent", "var(--text-2)") }}>{s.cancel}</button>
          <button onClick={create} disabled={busy || !f.title.trim()} style={{ ...btn("var(--accent)"), opacity: busy || !f.title.trim() ? 0.6 : 1 }}>{busy ? s.creating : s.create}</button>
        </div>
      </div>
    </div>
  );
}
