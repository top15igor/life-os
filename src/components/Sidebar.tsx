"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";
import type { Locale } from "@/lib/i18n";

const NAV = [
  { key: "today", href: "/", icon: "ti-home", ready: true },
  { key: "diary", href: "/diary", icon: "ti-book", ready: true },
  { key: "health", href: "#", icon: "ti-heartbeat", ready: false },
  { key: "energy", href: "#", icon: "ti-bolt", ready: false },
  { key: "sport", href: "#", icon: "ti-run", ready: false },
  { key: "food", href: "#", icon: "ti-salad", ready: false },
  { key: "family", href: "#", icon: "ti-users", ready: false },
  { key: "projects", href: "#", icon: "ti-briefcase", ready: false },
  { key: "insights", href: "/insights", icon: "ti-bulb", ready: true },
  { key: "goals", href: "#", icon: "ti-target", ready: false },
  { key: "lifebook", href: "#", icon: "ti-book-2", ready: false },
  { key: "people", href: "/people", icon: "ti-user-heart", ready: true },
  { key: "places", href: "#", icon: "ti-map-pin", ready: false },
  { key: "analytics", href: "#", icon: "ti-chart-line", ready: false },
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
