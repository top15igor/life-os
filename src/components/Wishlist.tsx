"use client";

import { useState } from "react";
import { formatPrice, type Wish } from "@/lib/wishlist";

const T: Record<string, any> = {
  ru: {
    lead: "Вставь ссылку на товар — подтянем фото, название и цену. Поделись списком с друзьями: они увидят, что тебе подарить.",
    ph: "Ссылка на товар (Wildberries, Ozon, Amazon, AliExpress…)",
    add: "Добавить",
    adding: "Тянем карточку…",
    manual: "Добавить вручную",
    mTitle: "Название",
    mPrice: "Цена (необязательно)",
    mNote: "Заметка: размер, цвет, почему хочешь",
    save: "Сохранить",
    cancel: "Отмена",
    empty: "Пока пусто. Вставь первую ссылку на то, что хочешь 🎁",
    open: "Открыть в магазине",
    bought: "Куплено",
    markBought: "Отметить купленным",
    restore: "Вернуть в список",
    del: "Удалить",
    noteEdit: "Заметка",
    notePh: "Размер M, чёрный, на ДР…",
    shareOn: "Поделиться вишлистом",
    shareOff: "Вишлист открыт по ссылке",
    copy: "Скопировать ссылку",
    copied: "Скопировано ✓",
    openPub: "Открыть как друг",
    shareHint: "Друзья откроют по ссылке и смогут тайно «забронировать» подарок — ты не увидишь, что занято, сюрприз сохранится.",
    failUrl: "Не удалось открыть ссылку. Добавь вручную.",
  },
  en: {
    lead: "Paste a product link — we'll pull the photo, title and price. Share the list with friends so they know what to gift you.",
    ph: "Product link (Amazon, eBay, AliExpress…)",
    add: "Add",
    adding: "Fetching…",
    manual: "Add manually",
    mTitle: "Title",
    mPrice: "Price (optional)",
    mNote: "Note: size, color, why you want it",
    save: "Save",
    cancel: "Cancel",
    empty: "Empty for now. Paste the first link to something you want 🎁",
    open: "Open in store",
    bought: "Bought",
    markBought: "Mark as bought",
    restore: "Back to list",
    del: "Delete",
    noteEdit: "Note",
    notePh: "Size M, black, for birthday…",
    shareOn: "Share wishlist",
    shareOff: "Wishlist is public by link",
    copy: "Copy link",
    copied: "Copied ✓",
    openPub: "Open as a friend",
    shareHint: "Friends open it by link and can secretly reserve a gift — you won't see what's taken, the surprise stays.",
    failUrl: "Couldn't open the link. Add it manually.",
  },
};

export default function Wishlist({ locale, initial, share }: { locale: string; initial: Wish[]; share: { slug: string | null; isPublic: boolean } }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [wishes, setWishes] = useState<Wish[]>(initial);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mPrice, setMPrice] = useState("");
  const [mNote, setMNote] = useState("");
  const [isPublic, setIsPublic] = useState(share.isPublic);
  const [slug, setSlug] = useState(share.slug);
  const [copied, setCopied] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pubUrl = slug ? `${origin}/w/${slug}` : "";

  async function api(payload: any) {
    const r = await fetch("/api/wishlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    return r.json().catch(() => ({ ok: false }));
  }

  async function addUrl() {
    const link = url.trim();
    if (!link || adding) return;
    setAdding(true);
    const r = await api({ action: "addUrl", url: link });
    setAdding(false);
    if (r?.ok && r.wish) {
      setWishes((w) => [r.wish, ...w]);
      setUrl("");
    } else {
      alert(t.failUrl);
    }
  }

  async function addManual() {
    if (!mTitle.trim()) return;
    const r = await api({ action: "addManual", title: mTitle, price: mPrice, note: mNote });
    if (r?.ok && r.wish) {
      setWishes((w) => [r.wish, ...w]);
      setMTitle(""); setMPrice(""); setMNote(""); setShowManual(false);
    }
  }

  async function del(id: string) {
    setWishes((w) => w.filter((x) => x.id !== id));
    await api({ action: "delete", id });
  }

  async function setStatus(id: string, status: string) {
    setWishes((w) => w.map((x) => (x.id === id ? { ...x, status } : x)));
    await api({ action: "update", id, status });
  }

  async function saveNote(id: string) {
    setWishes((w) => w.map((x) => (x.id === id ? { ...x, note: editNote } : x)));
    setEditId(null);
    await api({ action: "update", id, note: editNote });
  }

  async function toggleShare() {
    const next = !isPublic;
    setIsPublic(next);
    const r = await api({ action: "setPublic", value: next });
    if (r?.ok) setSlug(r.slug);
  }

  function copy() {
    navigator.clipboard?.writeText(pubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 14, maxWidth: 620 }}>{t.lead}</div>

      {/* Добавление по ссылке */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addUrl(); }}
          placeholder={t.ph}
          style={{ flex: 1, minWidth: 220, padding: "11px 14px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, color: "var(--text)" }}
        />
        <button onClick={addUrl} disabled={adding || !url.trim()} className="btn-accent" style={{ padding: "11px 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: adding || !url.trim() ? 0.6 : 1 }}>
          {adding ? t.adding : t.add}
        </button>
      </div>

      <div style={{ marginBottom: 22 }}>
        {!showManual ? (
          <button onClick={() => setShowManual(true)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", padding: 0 }}>
            <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-1px" }} /> {t.manual}
          </button>
        ) : (
          <div className="card" style={{ display: "grid", gap: 8, maxWidth: 480 }}>
            <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder={t.mTitle} style={inp} />
            <input value={mPrice} onChange={(e) => setMPrice(e.target.value)} placeholder={t.mPrice} style={inp} />
            <input value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder={t.mNote} style={inp} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addManual} disabled={!mTitle.trim()} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>{t.save}</button>
              <button onClick={() => setShowManual(false)} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer" }}>{t.cancel}</button>
            </div>
          </div>
        )}
      </div>

      {/* Поделиться */}
      <div className="card" style={{ marginBottom: 22, background: isPublic ? "var(--accent-bg)" : "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={toggleShare} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: "none", background: isPublic ? "var(--accent)" : "var(--surface-2)", color: isPublic ? "#fff" : "var(--text)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <i className={`ti ${isPublic ? "ti-check" : "ti-share-2"}`} style={{ fontSize: 16 }} />{isPublic ? t.shareOff : t.shareOn}
          </button>
          {isPublic && pubUrl && (
            <>
              <code style={{ fontSize: 12.5, color: "var(--text-2)", background: "var(--surface-2)", padding: "6px 10px", borderRadius: 8, wordBreak: "break-all" }}>{pubUrl.replace(/^https?:\/\//, "")}</code>
              <button onClick={copy} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--accent)", fontSize: 12.5, cursor: "pointer" }}>{copied ? t.copied : t.copy}</button>
              <a href={pubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--text-3)" }}>{t.openPub} →</a>
            </>
          )}
        </div>
        {isPublic && <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 9 }}>{t.shareHint}</div>}
      </div>

      {/* Карточки */}
      {wishes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-2)", padding: "30px 20px" }}>{t.empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {wishes.map((w) => {
            const done = w.status === "bought";
            return (
              <div key={w.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", opacity: done ? 0.55 : 1 }}>
                {w.image_url ? (
                  <a href={w.url || "#"} target="_blank" rel="noreferrer" style={{ display: "block", aspectRatio: "1 / 1", background: "var(--surface-2)" }}>
                    <img src={w.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ) : (
                  <div style={{ aspectRatio: "1 / 1", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-gift" style={{ fontSize: 38, color: "var(--text-3)" }} />
                  </div>
                )}
                <div style={{ padding: "11px 12px 13px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, textDecoration: done ? "line-through" : "none" }}>{w.title}</div>
                  {formatPrice(w.price, w.currency) && <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{formatPrice(w.price, w.currency)}</div>}
                  {w.source && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{w.source}</div>}

                  {editId === w.id ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <input value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder={t.notePh} autoFocus style={{ ...inp, padding: "7px 9px", fontSize: 12.5 }} onKeyDown={(e) => { if (e.key === "Enter") saveNote(w.id); }} />
                      <button onClick={() => saveNote(w.id)} style={{ border: "none", background: "var(--accent)", color: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" }}><i className="ti ti-check" /></button>
                    </div>
                  ) : w.note ? (
                    <div onClick={() => { setEditId(w.id); setEditNote(w.note || ""); }} style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, cursor: "pointer", background: "var(--surface-2)", borderRadius: 8, padding: "6px 9px" }}>{w.note}</div>
                  ) : (
                    <button onClick={() => { setEditId(w.id); setEditNote(""); }} style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-3)", fontSize: 12, cursor: "pointer", padding: 0 }}>
                      <i className="ti ti-pencil" style={{ fontSize: 12, verticalAlign: "-1px" }} /> {t.noteEdit}
                    </button>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {w.url && <a href={w.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{t.open} →</a>}
                    <button onClick={() => setStatus(w.id, done ? "active" : "bought")} title={done ? t.restore : t.markBought} style={iconBtn}><i className={`ti ${done ? "ti-arrow-back-up" : "ti-check"}`} /></button>
                    <button onClick={() => del(w.id)} title={t.del} style={iconBtn}><i className="ti ti-trash" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, color: "var(--text)", width: "100%" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--text-3)", fontSize: 15, cursor: "pointer", padding: 0, marginLeft: "auto" };
