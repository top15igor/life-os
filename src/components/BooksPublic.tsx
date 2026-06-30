"use client";

import { useState } from "react";
import type { PublicBook } from "@/lib/books";

const T: Record<string, any> = {
  ru: {
    title: (n: string | null) => (n ? `Книги — ${n}` : "Книги"),
    lead: "Что человек читает и советует — с оценками и короткими ревью.",
    tabs: { all: "Всё", read: "Прочитал", reading: "Читаю" },
    status: { reading: "Читаю", read: "Прочитал" },
    empty: "Пока пусто.",
    cta: "Хочешь вести свою библиотеку? Заведи в LIFE OS",
    fav: "Любимое",
  },
  en: {
    title: (n: string | null) => (n ? `${n}'s books` : "Books"),
    lead: "What they read and recommend — with ratings and short reviews.",
    tabs: { all: "All", read: "Read", reading: "Reading" },
    status: { reading: "Reading", read: "Read" },
    empty: "Empty for now.",
    cta: "Want your own library? Start one in LIFE OS",
    fav: "Favorite",
  },
};

const STATUS_COLOR: Record<string, string> = { reading: "#0ea5e9", read: "#10b981" };

export default function BooksPublic({ locale, ownerName, books }: { locale: string; ownerName: string | null; books: PublicBook[] }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [tab, setTab] = useState<"all" | "read" | "reading">("all");
  const shown = tab === "all" ? books : books.filter((b) => b.status === tab);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 18px 60px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 9 }}>
        <i className="ti ti-books" style={{ fontSize: 26, color: "#8b5cf6" }} />{t.title(ownerName)}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginTop: 8, marginBottom: 18, maxWidth: 600 }}>{t.lead}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "read", "reading"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 13px", borderRadius: 999, border: "1px solid var(--border)", background: tab === k ? "#8b5cf6" : "var(--surface)", color: tab === k ? "#fff" : "var(--text-2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.tabs[k]}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-2)", padding: "30px 20px" }}>{t.empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
          {shown.map((b) => (
            <div key={b.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ aspectRatio: "2 / 3", background: "var(--surface-2)", position: "relative" }}>
                {b.cover_url ? <img src={b.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-book-2" style={{ fontSize: 34, color: "var(--text-3)" }} /></div>}
                {b.favorite && <i className="ti ti-heart-filled" style={{ position: "absolute", top: 7, right: 7, fontSize: 16, color: "#ec4899" }} />}
                <span style={{ position: "absolute", left: 7, bottom: 7, fontSize: 10.5, fontWeight: 600, color: "#fff", background: STATUS_COLOR[b.status] || "#6366f1", borderRadius: 6, padding: "2px 7px" }}>{t.status[b.status] || ""}</span>
              </div>
              <div style={{ padding: "9px 10px 11px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{b.title}</div>
                {b.author && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{b.author}</div>}
                {(b.rating || b.liked != null) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    {b.rating ? <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}><i className="ti ti-star-filled" style={{ fontSize: 12 }} /> {b.rating}</span> : null}
                    {b.liked === true && <i className="ti ti-thumb-up-filled" style={{ fontSize: 13, color: "#10b981" }} />}
                    {b.liked === false && <i className="ti ti-thumb-down-filled" style={{ fontSize: 13, color: "#ef4444" }} />}
                  </div>
                )}
                {b.review && <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45, marginTop: 6, background: "var(--surface-2)", borderRadius: 8, padding: "6px 9px" }}>{b.review}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 36 }}>
        <a href="/" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{t.cta} →</a>
      </div>
    </div>
  );
}
