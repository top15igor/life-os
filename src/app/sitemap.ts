import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Карта сайта: только публичные страницы. Личные разделы приложения гостю всё
// равно недоступны, а чужие витрины намеренно не отдаём в поиск (см. robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, freq: "weekly" },
    { path: "/features", priority: 0.8, freq: "weekly" },
    { path: "/one-place", priority: 0.8, freq: "monthly" },
    { path: "/reviews", priority: 0.7, freq: "weekly" },
    { path: "/pricing", priority: 0.7, freq: "monthly" },
    { path: "/privacy", priority: 0.4, freq: "yearly" },
    { path: "/privacy/policy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
