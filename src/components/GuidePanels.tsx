"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Extras, Feature, ChangeItem } from "@/lib/guideExtras";
import GuideSections from "@/components/GuideSections";

const BADGE_STYLE: Record<string, { bg: string; col: string }> = {
  new: { bg: "var(--accent-bg)", col: "var(--accent-text)" },
  improved: { bg: "#dcfce7", col: "#166534" },
  soon: { bg: "var(--surface-2)", col: "var(--text-2)" },
};

function Badge({ tag, label }: { tag: string; label: string }) {
  const st = BADGE_STYLE[tag] || BADGE_STYLE.soon;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, background: st.bg, color: st.col, flexShrink: 0 }}>{label}</span>;
}

function SectionTitle({ children }: { children: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, marginTop: 6 }}>
      <span style={{ width: 4, height: 19, borderRadius: 2, background: "var(--accent)" }} />
      <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{children}</span>
    </div>
  );
}

// Список доработок: показываем 5 последних, остальное под кнопкой «Показать все».
function ChangeList({ items, ex, soon }: { items: ChangeItem[]; ex: Extras; soon?: boolean }) {
  const [open, setOpen] = useState(false);
  const LIMIT = 5;
  const shown = open ? items : items.slice(0, LIMIT);
  return (
    <>
      {shown.map((c, i) => {
        const tag = soon ? "soon" : c.tag;
        return (
          <div key={i} style={{ padding: "9px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
              <Badge tag={tag} label={ex.badges[tag]} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{c.t}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{c.d}</div>
          </div>
        );
      })}
      {items.length > LIMIT && (
        <button onClick={() => setOpen((o) => !o)} style={{ marginTop: 11, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "1px solid var(--border)", borderRadius: 9, padding: "8px", color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          {open ? ex.collapse : `${ex.showAll} (${items.length})`}<i className={`ti ti-chevron-${open ? "up" : "down"}`} style={{ fontSize: 15 }} />
        </button>
      )}
    </>
  );
}

export default function GuidePanels({ ex, upcoming }: { ex: Extras; upcoming: ChangeItem[] }) {
  const [active, setActive] = useState<Feature | null>(null);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Deep-link: /guide?card=<key> сразу открывает нужную карточку (напр. сравнение AI-помощников).
  useEffect(() => {
    try {
      const key = new URLSearchParams(window.location.search).get("card");
      if (key) { const f = ex.features.find((x) => x.key === key); if (f) setActive(f); }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const FEAT_LIMIT = 6;
  // «Три AI-помощника» — наверх, чтобы карточка была видна без «Показать все».
  const ordered = [...ex.features].sort((a, b) => (a.key === "ai-compare" ? -1 : b.key === "ai-compare" ? 1 : 0));
  const shownFeatures = featuresOpen ? ordered : ordered.slice(0, FEAT_LIMIT);

  useEffect(() => {
    if (!active) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = prev; };
  }, [active]);

  return (
    <div>
      {/* ===== Что нового ===== */}
      <SectionTitle>{ex.whatsNew}</SectionTitle>
      <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 13, maxWidth: 620 }}>{ex.whatsNewLead}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 12, marginBottom: 26 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            <i className="ti ti-rocket" style={{ fontSize: 18, color: "var(--positive)" }} />{ex.thisMonth}
          </div>
          <ChangeList items={ex.changelog} ex={ex} />
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            <i className="ti ti-clock-hour-4" style={{ fontSize: 18, color: "var(--accent)" }} />{ex.upcoming}
          </div>
          <ChangeList items={upcoming} ex={ex} soon />
        </div>
      </div>

      {/* ===== Возможности (активные карточки) ===== */}
      <SectionTitle>{ex.featuresTitle}</SectionTitle>
      <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 13, maxWidth: 620 }}>{ex.featuresLead}</div>

      <div className="guide-feature-grid" style={{ marginBottom: 12 }}>
        {shownFeatures.map((f) => {
          const cardStyle = { textAlign: "left" as const, cursor: "pointer", display: "flex", gap: 11, alignItems: "flex-start", border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none", color: "var(--text)" };
          const inner = (
            <>
              <i className={`ti ${f.icon}`} style={{ fontSize: 22, color: f.color, flexShrink: 0, marginTop: 1 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{f.title}</span>
                  <span style={{ fontSize: 12, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0 }}>{ex.open}<i className="ti ti-chevron-right" style={{ fontSize: 14 }} /></span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 4 }}>{f.short}</div>
              </div>
            </>
          );
          // «Три AI-помощника» — отдельная страница, остальные карточки открываются модалкой.
          return f.key === "ai-compare"
            ? <Link key={f.key} href="/guide/ai-helpers" className="card" style={cardStyle}>{inner}</Link>
            : <button key={f.key} onClick={() => setActive(f)} className="card" style={cardStyle}>{inner}</button>;
        })}
      </div>
      {ex.features.length > FEAT_LIMIT && (
        <button onClick={() => setFeaturesOpen((o) => !o)} style={{ marginBottom: 26, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "1px solid var(--border)", borderRadius: 9, padding: "9px", color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          {featuresOpen ? ex.collapse : `${ex.showAll} (${ex.features.length})`}<i className={`ti ti-chevron-${featuresOpen ? "up" : "down"}`} style={{ fontSize: 15 }} />
        </button>
      )}

      {/* ===== Модалка ===== */}
      {active && mounted && createPortal(
        <div onClick={() => setActive(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ background: "var(--bg)", width: "min(560px, 100%)", maxHeight: "92vh", overflowY: "auto", borderRadius: "20px 20px 0 0", boxShadow: "0 -10px 50px rgba(0,0,0,0.25)", margin: "auto auto 0", padding: 0 }}>
            {/* шапка */}
            <div style={{ position: "sticky", top: 0, background: "var(--bg)", padding: "18px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12, zIndex: 1 }}>
              <i className={`ti ${active.icon}`} style={{ fontSize: 26, color: active.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{active.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.45, marginTop: 2 }}>{active.short}</div>
              </div>
              <button onClick={() => setActive(null)} aria-label="close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, flexShrink: 0 }}><i className="ti ti-x" style={{ fontSize: 22 }} /></button>
            </div>

            {/* тело */}
            <div style={{ padding: "16px 20px 28px" }}>
              <GuideSections sections={active.sections} />
              <button onClick={() => setActive(null)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "var(--accent)", color: "#fff", border: "none", fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>{ex.close}</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}
