"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, MOBILE_PRIMARY } from "@/lib/nav";
import LangSwitcher from "./LangSwitcher";
import InviteButton from "./InviteButton";
import Feedback from "./Feedback";
import type { Locale } from "@/lib/i18n";

const MENU: Record<string, string> = { ru: "Меню", en: "Menu", uk: "Меню", fr: "Menu" };

export default function MobileNav({ navLabels, locale, isOwner, inviteLink, homeHref }: { navLabels: Record<string, string>; locale: Locale; isOwner?: boolean; inviteLink?: string; homeHref?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const primary = MOBILE_PRIMARY.map((k) => NAV.find((n) => n.key === k)).filter(Boolean) as typeof NAV;
  const hrefOf = (n: { key: string; href: string }) => (n.key === "today" && homeHref ? homeHref : n.href);

  return (
    <>
      {open && (
        <div className="mobile-drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{MENU[locale] || "Меню"}</span>
              <button onClick={() => setOpen(false)} aria-label="close" style={{ background: "none", border: "none", color: "var(--text-2)", cursor: "pointer" }}><i className="ti ti-x" style={{ fontSize: 20 }} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {NAV.map((n) => {
                const href = hrefOf(n);
                const active = href === path || (n.key === "today" && path === "/");
                return (
                  <Link key={n.key} href={href} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, background: active ? "var(--accent-bg)" : "var(--surface-2)", color: active ? "var(--accent-text)" : "var(--text)" }}>
                    <i className={`ti ${n.icon}`} style={{ fontSize: 19 }} />
                    <span style={{ fontSize: 13.5, fontWeight: active ? 500 : 400 }}>{navLabels[n.key] || n.key}</span>
                  </Link>
                );
              })}
            </div>
            <Feedback locale={locale} variant="drawer" />
            {inviteLink && <InviteButton link={inviteLink} locale={locale} variant="drawer" />}
            {isOwner && (
              <Link href="/admin" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, background: "var(--accent-bg)", color: "var(--accent-text)", marginBottom: 14 }}>
                <i className="ti ti-shield-lock" style={{ fontSize: 19 }} />
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>Admin</span>
              </Link>
            )}
            <LangSwitcher current={locale} />
          </div>
        </div>
      )}

      <nav className="mobilenav">
        {primary.map((n) => {
          const href = hrefOf(n);
          const active = href === path || (n.key === "today" && path === "/");
          return (
            <Link key={n.key} href={href} className={active ? "active" : ""}>
              <i className={`ti ${n.icon}`} />
              <span>{navLabels[n.key] || n.key}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen((o) => !o)} className={open ? "active" : ""}>
          <i className="ti ti-menu-2" />
          <span>{MENU[locale] || "Меню"}</span>
        </button>
      </nav>
    </>
  );
}
