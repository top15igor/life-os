"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import InviteButton from "./InviteButton";
import Feedback from "./Feedback";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import type { Locale } from "@/lib/i18n";

const NAV_BY: Record<string, { key: string; href: string; icon: string }> = Object.fromEntries(NAV.map((n) => [n.key, n]));
const DEFAULT_ORDER = NAV.map((n) => n.key);

const GROUPS_L: Record<string, Record<string, string>> = {
  ru: { main: "Главное", life: "Жизнь и цели", memory: "Память и люди", ai: "AI-помощники", more: "Ещё" },
  en: { main: "Main", life: "Life & goals", memory: "Memory & people", ai: "AI helpers", more: "More" },
  uk: { main: "Головне", life: "Життя та цілі", memory: "Пам'ять і люди", ai: "AI-помічники", more: "Ще" },
  fr: { main: "Principal", life: "Vie & objectifs", memory: "Mémoire & gens", ai: "Assistants IA", more: "Plus" },
};
const ED_L: Record<string, Record<string, string>> = {
  ru: { customize: "Настроить меню", done: "Готово", reset: "Сбросить", title: "Порядок и видимость" },
  en: { customize: "Customize menu", done: "Done", reset: "Reset", title: "Order & visibility" },
  uk: { customize: "Налаштувати меню", done: "Готово", reset: "Скинути", title: "Порядок і видимість" },
  fr: { customize: "Personnaliser", done: "OK", reset: "Réinitialiser", title: "Ordre & visibilité" },
};

// Цветовые акценты разделов — чтобы блоки меню различались не только интервалом.
const GROUP_COLORS: Record<string, string> = { main: "#6366f1", life: "#22c55e", memory: "#a855f7", ai: "#3b82f6", more: "#f59e0b" };

const K_ORDER = "lifeos_nav_order", K_HIDDEN = "lifeos_nav_hidden", K_COLLAPSED = "lifeos_nav_collapsed";
const miniBtn = (dis: boolean): any => ({ background: "none", border: "none", cursor: dis ? "default" : "pointer", color: "var(--text-3)", padding: 2, opacity: dis ? 0.3 : 1, display: "inline-flex", flexShrink: 0 });

export default function Sidebar({ navLabels, brand, locale }: { navLabels: Record<string, string>; brand: string; locale: Locale }) {
  const path = usePathname();
  const [isOwner, setIsOwner] = useState(false);
  const [isTester, setIsTester] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  // Быстрый переключатель день/ночь у логотипа.
  const [dark, setDark] = useState(false);
  useEffect(() => { try { setDark(document.documentElement.dataset.theme === "dark"); } catch {} }, []);
  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    try { document.documentElement.dataset.theme = next; document.cookie = `theme=${next}; path=/; max-age=31536000`; } catch {}
    fetch("/api/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: next }) }).catch(() => {});
  };

  const gl = GROUPS_L[locale] || GROUPS_L.ru;
  const el = ED_L[locale] || ED_L.ru;

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => { setIsOwner(!!d.isOwner); setIsTester(!!d.tester); setRefCode(d.handle || d.refCode || d.ref || null); }).catch(() => {});
    try {
      const o = JSON.parse(localStorage.getItem(K_ORDER) || "null");
      const h = JSON.parse(localStorage.getItem(K_HIDDEN) || "null");
      const c = JSON.parse(localStorage.getItem(K_COLLAPSED) || "null");
      if (Array.isArray(o)) { const valid = o.filter((k: string) => NAV_BY[k]); setOrder([...valid, ...DEFAULT_ORDER.filter((k) => !valid.includes(k))]); }
      if (Array.isArray(h)) setHidden(h.filter((k: string) => NAV_BY[k]));
      if (Array.isArray(c)) setCollapsed(c);
    } catch {}
    setReady(true);
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = refCode ? `${origin}/i/${refCode}` : "";
  const reordered = JSON.stringify(order) !== JSON.stringify(DEFAULT_ORDER);

  function saveOrder(o: string[]) { setOrder(o); try { localStorage.setItem(K_ORDER, JSON.stringify(o)); } catch {} }
  function saveHidden(h: string[]) { setHidden(h); try { localStorage.setItem(K_HIDDEN, JSON.stringify(h)); } catch {} }
  function move(key: string, dir: -1 | 1) {
    const i = order.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    const n = [...order]; [n[i], n[j]] = [n[j], n[i]]; saveOrder(n);
  }
  function toggleHide(key: string) { saveHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]); }
  function toggleCollapse(gid: string) {
    const n = collapsed.includes(gid) ? collapsed.filter((g) => g !== gid) : [...collapsed, gid];
    setCollapsed(n); try { localStorage.setItem(K_COLLAPSED, JSON.stringify(n)); } catch {}
  }
  function reset() { saveOrder(DEFAULT_ORDER); saveHidden([]); }

  const NavLink = (key: string) => {
    const n = NAV_BY[key]; if (!n) return null;
    // «Сегодня» живёт по красивому адресу /i/<username> (как @имя в Instagram); корень / редиректит туда же.
    const href = key === "today" && refCode ? `/i/${refCode}` : n.href;
    const active = href === path || (key === "today" && path === "/");
    return (
      <Link key={key} href={href} className={`navlink${active ? " active" : ""}`}>
        <i className={`ti ${n.icon}`} />
        <span className="navlabel">{navLabels[key] || key}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="sidebar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 10 }}>
          <Link href="/about" className="brand" style={{ textDecoration: "none", padding: "4px 9px 4px", flex: 1, minWidth: 0 }}>
            <i className="ti ti-flower" style={{ fontSize: 18, color: "var(--accent)" }} />
            <span>{brand}</span>
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={dark ? "Светлая тема" : "Тёмная тема"}
            title={dark ? "Светлая тема" : "Тёмная тема"}
            style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 16 }} />
          </button>
        </div>

        {editing ? (
          /* ===== РЕЖИМ НАСТРОЙКИ ===== */
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 4px 8px" }}>{el.title}</div>
            {order.filter((k) => k !== "guide").map((key, idx, arr) => {
              const n = NAV_BY[key]; if (!n) return null;
              const isHidden = hidden.includes(key);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 8, opacity: isHidden ? 0.45 : 1 }}>
                  <i className={`ti ${n.icon}`} style={{ fontSize: 16, color: "var(--text-2)", width: 18, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{navLabels[key] || key}</span>
                  <button onClick={() => move(key, -1)} disabled={idx === 0} aria-label="up" style={miniBtn(idx === 0)}><i className="ti ti-chevron-up" style={{ fontSize: 15 }} /></button>
                  <button onClick={() => move(key, 1)} disabled={idx === arr.length - 1} aria-label="down" style={miniBtn(idx === arr.length - 1)}><i className="ti ti-chevron-down" style={{ fontSize: 15 }} /></button>
                  <button onClick={() => toggleHide(key)} aria-label="hide" style={miniBtn(false)}><i className={`ti ${isHidden ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15, color: isHidden ? "var(--text-3)" : "var(--accent)" }} /></button>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={reset} style={{ flex: 1, fontSize: 12.5, padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" }}>{el.reset}</button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, fontSize: 12.5, padding: "8px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 500, cursor: "pointer" }}>{el.done}</button>
            </div>
          </div>
        ) : reordered ? (
          /* ===== СВОЙ ПОРЯДОК (плоский список) ===== */
          <div>{order.filter((k) => !hidden.includes(k) && k !== "guide").map((k) => NavLink(k))}</div>
        ) : (
          /* ===== ПО БЛОКАМ (по умолчанию) ===== */
          <div>
            {NAV_GROUPS.map((g, gi) => {
              const keys = g.keys.filter((k) => !hidden.includes(k));
              if (!keys.length) return null;
              const isCol = collapsed.includes(g.id);
              return (
                <div key={g.id} style={{ marginBottom: 6, paddingTop: gi > 0 ? 10 : 0, marginTop: gi > 0 ? 4 : 0, borderTop: gi > 0 ? "1px solid var(--border)" : "none" }}>
                  <button onClick={() => toggleCollapse(g.id)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 6px 6px", color: "var(--text-3)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: GROUP_COLORS[g.id] || "var(--accent)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>{gl[g.id] || g.id}</span>
                    <i className={`ti ti-chevron-${isCol ? "right" : "down"}`} style={{ fontSize: 14, marginLeft: "auto", color: "var(--text-3)" }} />
                  </button>
                  {!isCol && keys.map((k) => NavLink(k))}
                </div>
              );
            })}
          </div>
        )}

        {isTester && !editing && (
          <Link href="/tests" className={`navlink${path === "/tests" ? " active" : ""}`} style={{ marginTop: 6, color: "#0e9f6e" }}>
            <i className="ti ti-checklist" />
            <span className="navlabel">Тесты</span>
          </Link>
        )}

        {isOwner && !editing && (
          <Link href="/admin" className={`navlink${path === "/admin" ? " active" : ""}`} style={{ marginTop: 6, color: "var(--accent)" }}>
            <i className="ti ti-shield-lock" />
            <span className="navlabel">Admin</span>
          </Link>
        )}

        {!editing && ready && (
          <button onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "7px 10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", fontSize: 12.5, borderRadius: 8 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 16 }} />{el.customize}
          </button>
        )}

        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <Link href="/guide" className={`navlink${path === "/guide" ? " active" : ""}`}>
            <i className="ti ti-help" />
            <span className="navlabel">{navLabels.guide || "Инструкция"}</span>
          </Link>
          <Feedback locale={locale} variant="sidebar" />
          {inviteLink && <InviteButton link={inviteLink} locale={locale} />}
        </div>
      </aside>

      <MobileNav navLabels={navLabels} locale={locale} isOwner={isOwner} inviteLink={inviteLink} homeHref={refCode ? `/i/${refCode}` : "/"} />
    </>
  );
}
