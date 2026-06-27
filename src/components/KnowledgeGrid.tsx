"use client";

import { useState } from "react";
import type { SavedItem } from "@/lib/queries";

const STR: Record<string, { points: string; open: string; reel: string; post: string }> = {
  ru: { points: "Главное", open: "Открыть в Instagram", reel: "Reels", post: "Instagram" },
  en: { points: "Key points", open: "Open in Instagram", reel: "Reels", post: "Instagram" },
  uk: { points: "Головне", open: "Відкрити в Instagram", reel: "Reels", post: "Instagram" },
  fr: { points: "Points clés", open: "Ouvrir dans Instagram", reel: "Reels", post: "Instagram" },
};

const clamp = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

function groupByTopic(items: SavedItem[]): [string, SavedItem[]][] {
  const map = new Map<string, SavedItem[]>();
  for (const it of items) {
    const k = (it.topic || "—").trim() || "—";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default function KnowledgeGrid({ items, locale }: { items: SavedItem[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [open, setOpen] = useState<SavedItem | null>(null);
  const groups = groupByTopic(items);

  const Thumb = ({ it, h }: { it: SavedItem; h: number }) =>
    it.image_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={it.image_url} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
    ) : (
      <div style={{ width: "100%", height: h, background: "linear-gradient(135deg,#7c6cff,#b39cff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="ti ti-bookmark" style={{ fontSize: 28, color: "rgba(255,255,255,.9)" }} />
      </div>
    );

  return (
    <>
      {groups.map(([topic, list]) => (
        <section key={topic} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 11px", display: "flex", alignItems: "center", gap: 7 }}>
            <i className="ti ti-folder" style={{ color: "#6d5efc" }} /> {topic}
            <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {list.length}</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {list.map((it) => (
              <article
                key={it.id}
                onClick={() => setOpen(it)}
                style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--card)", overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
              >
                <div style={{ position: "relative" }}>
                  <Thumb it={it} h={132} />
                  {it.kind === "reel" && (
                    <span style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,.6)", color: "#fff", borderRadius: 999, padding: "2px 7px", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <i className="ti ti-player-play-filled" style={{ fontSize: 10 }} />{s.reel}
                    </span>
                  )}
                </div>
                <div style={{ padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3, ...clamp(2) }}>{it.title}</div>
                  {it.summary ? <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45, ...clamp(2) }}>{it.summary}</div> : null}
                  {it.tags?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 1 }}>
                      {it.tags.slice(0, 2).map((tg, i) => (
                        <span key={i} style={{ fontSize: 10.5, color: "#6d5efc", background: "rgba(109,94,252,.1)", borderRadius: 7, padding: "1px 7px" }}>#{tg.replace(/\s+/g, "_")}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--card)", borderRadius: 18, maxWidth: 560, width: "100%", margin: "auto", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}
          >
            <div style={{ position: "relative" }}>
              <Thumb it={open} h={240} />
              <button
                onClick={() => setOpen(null)}
                aria-label="close"
                style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 999, border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: "pointer", fontSize: 17, lineHeight: 1 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div style={{ padding: "16px 18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                <i className={`ti ${open.kind === "reel" ? "ti-video" : "ti-photo"}`} />
                <span>{open.kind === "reel" ? s.reel : s.post}</span>
                {open.author ? <span>· {open.author}</span> : null}
                {open.topic ? <span style={{ marginLeft: "auto", color: "#6d5efc" }}><i className="ti ti-folder" /> {open.topic}</span> : null}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>{open.title}</div>
              {open.summary ? <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, marginTop: 8 }}>{open.summary}</div> : null}
              {open.key_points?.length ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{s.points}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                    {open.key_points.map((p, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{p}</li>)}
                  </ul>
                </div>
              ) : null}
              {open.tags?.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                  {open.tags.map((tg, i) => (
                    <span key={i} style={{ fontSize: 11.5, color: "#6d5efc", background: "rgba(109,94,252,.1)", borderRadius: 8, padding: "2px 9px" }}>#{tg.replace(/\s+/g, "_")}</span>
                  ))}
                </div>
              ) : null}
              {open.url ? (
                <a href={open.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6d5efc", textDecoration: "none", fontWeight: 600 }}>
                  <i className="ti ti-brand-instagram" style={{ fontSize: 16 }} /> {s.open}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
