"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";
import type { Locale } from "@/lib/i18n";

const NAV = [
  { key: "today", href: "/", icon: "ti-home", ready: true },
  { key: "guide", href: "/guide", icon: "ti-help", ready: true },
  { key: "diary", href: "/diary", icon: "ti-book", ready: true },
  { key: "health", href: "/health", icon: "ti-heartbeat", ready: true },
  { key: "energy", href: "/energy", icon: "ti-bolt", ready: true },
  { key: "sport", href: "/sport", icon: "ti-run", ready: true },
  { key: "food", href: "/food", icon: "ti-salad", ready: true },
  { key: "family", href: "/family", icon: "ti-users", ready: true },
  { key: "projects", href: "/projects", icon: "ti-briefcase", ready: true },
  { key: "insights", href: "/insights", icon: "ti-bulb", ready: true },
  { key: "goals", href: "/goals", icon: "ti-target", ready: true },
  { key: "lifebook", href: "/lifebook", icon: "ti-book-2", ready: true },
  { key: "people", href: "/people", icon: "ti-user-heart", ready: true },
  { key: "places", href: "/places", icon: "ti-map-pin", ready: true },
  { key: "analytics", href: "/analytics", icon: "ti-chart-line", ready: true },
  { key: "biographer", href: "/biographer", icon: "ti-messages", ready: true },
];

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
  return (
    <aside className="sidebar">
      <div className="brand">
        <i className="ti ti-flower" style={{ fontSize: 18, color: "var(--accent)" }} />
        <span>{brand}</span>
      </div>
      {NAV.map((n) => {
        const active = n.href === path;
        const label = navLabels[n.key] || n.key;
        if (!n.ready) {
          return (
            <div key={n.key} className="navlink soon">
              <i className={`ti ${n.icon}`} />
              <span className="navlabel">{label}</span>
            </div>
          );
        }
        return (
          <Link key={n.key} href={n.href} className={`navlink${active ? " active" : ""}`}>
            <i className={`ti ${n.icon}`} />
            <span className="navlabel">{label}</span>
          </Link>
        );
      })}
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <LangSwitcher current={locale} />
      </div>
    </aside>
  );
}
