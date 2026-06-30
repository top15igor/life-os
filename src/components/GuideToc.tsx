"use client";

import { useEffect, useState } from "react";

// Плавающая навигация по разделам Инструкции с подсветкой активного (десктоп).
export default function GuideToc({ items }: { items: { id: string; label: string; href?: string }[] }) {
  const [active, setActive] = useState(items[0]?.id || "");

  useEffect(() => {
    const els = items.map((it) => document.getElementById(it.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-12% 0px -75% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  return (
    <nav className="guide-toc-rail" aria-label="Содержание">
      {items.map((it) => (
        // Пункт-ссылка на отдельную страницу (href) — без scroll-spy; обычный якорь — с подсветкой.
        <a key={it.id} href={it.href || `#${it.id}`} className={!it.href && active === it.id ? "active" : ""}>
          <span className="lbl">{it.label}</span>
          <span className="dot" />
        </a>
      ))}
    </nav>
  );
}
