"use client";

// Интерактивная часть шапки лендинга (дизайн A):
// - scroll-spy: подсветка активного пункта навигации при прокрутке;
// - бургер-меню на мобильном (выезжающая панель с якорями);
// - липкая CTA «Начать сохраняться» внизу экрана на мобильном после прокрутки.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NavLink = { href: string; label: string };

export default function LandingNav({ links, ctaLabel, ctaHref }: { links: NavLink[]; ctaLabel: string; ctaHref: string }) {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [showCta, setShowCta] = useState(false);
  // Портал доступен только после маунта (SSR не знает про document).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Scroll-spy: секция в верхней трети экрана — активный пункт.
  useEffect(() => {
    const ids = links.map((l) => l.href.replace("#", ""));
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive("#" + e.target.id);
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [links]);

  // Мобильная CTA — после первого экрана.
  useEffect(() => {
    const onScroll = () => setShowCta(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Открытое меню не даёт странице скроллиться под ним.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Десктоп-навигация */}
      <nav className="lp-nav">
        {links.map((l) => (
          <a key={l.href} href={l.href} className={active === l.href ? "active" : undefined}>{l.label}</a>
        ))}
      </nav>

      {/* Бургер (виден только на мобильном) */}
      <button className="lp-burger" aria-label="menu" onClick={() => setOpen((v) => !v)}>
        <i className={`ti ${open ? "ti-x" : "ti-menu-2"}`} style={{ fontSize: 22 }} />
      </button>

      {/* Панель меню и липкая CTA — порталом в body: fixed внутри липкой шапки
          с backdrop-filter позиционировался бы относительно шапки, а не окна */}
      {mounted && createPortal(
        <>
          {open && (
            <div className="lp-drawer" onClick={() => setOpen(false)}>
              <div className="lp-drawer-panel" onClick={(e) => e.stopPropagation()}>
                {links.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={active === l.href ? "active" : undefined}>{l.label}</a>
                ))}
                <a href={ctaHref} className="lp-cta-btn" style={{ marginTop: 14, textAlign: "center", padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 600 }} onClick={() => setOpen(false)}>
                  {ctaLabel}
                </a>
              </div>
            </div>
          )}
          <div className={`lp-mcta${showCta && !open ? " on" : ""}`}>
            <a href={ctaHref} className="lp-cta-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px", borderRadius: 13, fontSize: 15.5, fontWeight: 600 }}>
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
