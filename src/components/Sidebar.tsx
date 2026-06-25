"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";
import MobileNav from "./MobileNav";
import { NAV } from "@/lib/nav";
import type { Locale } from "@/lib/i18n";

export default function Sidebar({
  navLabels,
  brand,
  locale,
}: {
  navLabels: Record<string, string>;
  brand: string;
  locale: Locale;
}) {
  const path = usePathname();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(!!d.isOwner))
      .catch(() => {});
  }, []);

  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <i className="ti ti-flower" style={{ fontSize: 18, color: "var(--accent)" }} />
          <span>{brand}</span>
        </Link>
        {NAV.map((n) => (
          <Link key={n.key} href={n.href} className={`navlink${n.href === path ? " active" : ""}`}>
            <i className={`ti ${n.icon}`} />
            <span className="navlabel">{navLabels[n.key] || n.key}</span>
          </Link>
        ))}
        {isOwner && (
          <Link href="/admin" className={`navlink${path === "/admin" ? " active" : ""}`} style={{ marginTop: 6, color: "var(--accent)" }}>
            <i className="ti ti-shield-lock" />
            <span className="navlabel">Admin</span>
          </Link>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <LangSwitcher current={locale} />
        </div>
      </aside>

      <MobileNav navLabels={navLabels} locale={locale} isOwner={isOwner} />
    </>
  );
}
