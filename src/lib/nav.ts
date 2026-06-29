export const NAV: { key: string; href: string; icon: string }[] = [
  { key: "today", href: "/", icon: "ti-home" },
  { key: "diary", href: "/diary", icon: "ti-book" },
  { key: "wellness", href: "/health", icon: "ti-heartbeat" },
  { key: "plans", href: "/goals", icon: "ti-target" },
  { key: "finance", href: "/finance", icon: "ti-wallet" },
  { key: "family", href: "/family", icon: "ti-users" },
  { key: "projects", href: "/projects", icon: "ti-briefcase" },
  { key: "lifebook", href: "/lifebook", icon: "ti-book-2" },
  { key: "knowledge", href: "/knowledge", icon: "ti-bookmarks" },
  { key: "trace", href: "/trace", icon: "ti-heart-handshake" },
  { key: "memory", href: "/memory", icon: "ti-camera" },
  { key: "people", href: "/people", icon: "ti-user-heart" },
  { key: "places", href: "/places", icon: "ti-map-pin" },
  { key: "analytics", href: "/analytics", icon: "ti-sparkles" },
  { key: "lab", href: "/lab", icon: "ti-flask-2" },
  { key: "biographer", href: "/biographer", icon: "ti-messages" },
  { key: "share", href: "/share", icon: "ti-share-2" },
  { key: "paths", href: "/paths", icon: "ti-route" },
  { key: "profile", href: "/profile", icon: "ti-user" },
  { key: "guide", href: "/guide", icon: "ti-help" },
];

// Смысловые блоки бокового меню (порядок по умолчанию).
export const NAV_GROUPS: { id: string; keys: string[] }[] = [
  { id: "main", keys: ["today", "diary", "wellness"] },
  { id: "life", keys: ["plans", "finance", "trace", "family", "projects"] },
  { id: "memory", keys: ["lifebook", "knowledge", "memory", "people", "places"] },
  { id: "ai", keys: ["analytics", "biographer", "lab"] },
  { id: "more", keys: ["share", "paths", "profile"] }, // «guide» вынесен в нижний блок сайдбара (рядом с «Обратной связью»)
];

// Главные разделы для нижнего таб-бара на мобильном.
export const MOBILE_PRIMARY = ["today", "diary", "wellness", "biographer"];
