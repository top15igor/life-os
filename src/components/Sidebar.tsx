"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", icon: "ti-home", label: "Today", ready: true },
  { href: "/diary", icon: "ti-book", label: "Diary", ready: true },
  { href: "#", icon: "ti-heartbeat", label: "Health", ready: false },
  { href: "#", icon: "ti-bolt", label: "Energy", ready: false },
  { href: "#", icon: "ti-run", label: "Sport", ready: false },
  { href: "#", icon: "ti-salad", label: "Food", ready: false },
  { href: "#", icon: "ti-users", label: "Family", ready: false },
  { href: "#", icon: "ti-briefcase", label: "Projects", ready: false },
  { href: "#", icon: "ti-bulb", label: "Insights", ready: false },
  { href: "#", icon: "ti-target", label: "Goals", ready: false },
  { href: "#", icon: "ti-book-2", label: "Life Book", ready: false },
  { href: "#", icon: "ti-user-heart", label: "People", ready: false },
  { href: "#", icon: "ti-map-pin", label: "Places", ready: false },
  { href: "#", icon: "ti-chart-line", label: "Analytics", ready: false },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <i className="ti ti-flower" style={{ fontSize: 18, color: "var(--accent)" }} />
        <span>LIFE OS</span>
      </div>
      {NAV.map((n) => {
        const active = n.href === path;
        if (!n.ready) {
          return (
            <div key={n.label} className="navlink soon" title="Скоро">
              <i className={`ti ${n.icon}`} />
              <span className="navlabel">{n.label}</span>
            </div>
          );
        }
        return (
          <Link key={n.label} href={n.href} className={`navlink${active ? " active" : ""}`}>
            <i className={`ti ${n.icon}`} />
            <span className="navlabel">{n.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
