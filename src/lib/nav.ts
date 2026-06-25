export const NAV: { key: string; href: string; icon: string }[] = [
  { key: "today", href: "/", icon: "ti-home" },
  { key: "diary", href: "/diary", icon: "ti-book" },
  { key: "wellness", href: "/health", icon: "ti-heartbeat" },
  { key: "plans", href: "/goals", icon: "ti-target" },
  { key: "family", href: "/family", icon: "ti-users" },
  { key: "projects", href: "/projects", icon: "ti-briefcase" },
  { key: "lifebook", href: "/lifebook", icon: "ti-book-2" },
  { key: "people", href: "/people", icon: "ti-user-heart" },
  { key: "places", href: "/places", icon: "ti-map-pin" },
  { key: "analytics", href: "/analytics", icon: "ti-chart-line" },
  { key: "biographer", href: "/biographer", icon: "ti-messages" },
  { key: "guide", href: "/guide", icon: "ti-help" },
];

// Главные разделы для нижнего таб-бара на мобильном.
export const MOBILE_PRIMARY = ["today", "diary", "wellness", "biographer"];
