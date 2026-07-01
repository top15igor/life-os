"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

export type AccItem = {
  id: string;
  icon: string;
  color: string;
  title: string;
  subtitle?: string;
  href?: string;      // если задан — пункт-ссылка (открывает отдельную страницу), не раскрывается
  content?: ReactNode; // иначе — раскрывается на месте
};

export default function GuideAccordion({ items, tocLabel }: { items: AccItem[]; tocLabel: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="guide-acc">
      <style>{`
        .guide-acc { display: flex; flex-direction: column; gap: 10px; }
        .guide-acc-head {
          display: flex; align-items: center; gap: 13px; width: 100%; text-align: left;
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          padding: 15px 16px; cursor: pointer; color: var(--text); text-decoration: none;
          transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
        }
        .guide-acc-item.is-open > .guide-acc-head { border-color: color-mix(in srgb, var(--accent) 45%, transparent); box-shadow: 0 2px 10px color-mix(in srgb, var(--accent) 12%, transparent); }
        .guide-acc-head:hover { border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
        .guide-acc-num {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          background: var(--surface-2); font-size: 19px;
        }
        .guide-acc-t { flex: 1; min-width: 0; }
        .guide-acc-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
        .guide-acc-sub { font-size: 12.5px; color: var(--text-3); margin-top: 2px; line-height: 1.4; }
        .guide-acc-chev { flex-shrink: 0; color: var(--text-3); transition: transform .25s ease; font-size: 20px; display: inline-flex; }
        .guide-acc-item.is-open .guide-acc-chev { transform: rotate(180deg); color: var(--accent); }
        /* Плавное раскрытие по высоте */
        .guide-acc-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .28s ease; }
        .guide-acc-body.is-open { grid-template-rows: 1fr; }
        .guide-acc-body > .guide-acc-inner { overflow: hidden; min-height: 0; }
        .guide-acc-pad { padding: 4px 4px 18px; }
      `}</style>

      {/* Оглавление-подсказка */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontSize: 12.5, padding: "0 2px 2px" }}>
        <i className="ti ti-list-details" style={{ fontSize: 15, color: "var(--accent)" }} />
        <span>{tocLabel}</span>
      </div>

      {items.map((it, i) => {
        const isOpen = open.has(it.id);
        const num = String(i + 1).padStart(2, "0");
        const head = (
          <>
            <span className="guide-acc-num" style={{ color: it.color }}>
              <i className={`ti ${it.icon}`} />
            </span>
            <span className="guide-acc-t">
              <span className="guide-acc-title">{num} · {it.title}</span>
              {it.subtitle && <span className="guide-acc-sub">{it.subtitle}</span>}
            </span>
            <i className={`ti ${it.href ? "ti-arrow-up-right" : "ti-chevron-down"} guide-acc-chev`} />
          </>
        );

        if (it.href) {
          return (
            <div key={it.id} className="guide-acc-item">
              <Link href={it.href} className="guide-acc-head">{head}</Link>
            </div>
          );
        }

        return (
          <div key={it.id} className={`guide-acc-item${isOpen ? " is-open" : ""}`}>
            <button className="guide-acc-head" aria-expanded={isOpen} onClick={() => toggle(it.id)}>{head}</button>
            <div className={`guide-acc-body${isOpen ? " is-open" : ""}`}>
              <div className="guide-acc-inner">
                <div className="guide-acc-pad">{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
