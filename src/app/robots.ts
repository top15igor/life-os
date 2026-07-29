import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Правила для поисковых роботов. Раньше /robots.txt заворачивался middleware
// на лендинг, то есть роботы не могли его прочитать в принципе.
//
// Чужие витрины (/p, /w, /b, /path) из индекса исключены намеренно: человек
// делится ссылкой на свой дневник или вишлист адресно, а не публикует его в
// поиск. Ссылка продолжает открываться у всех, кому её прислали.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/p/", "/w/", "/b/", "/path/", "/i/", "/u/", "/m/", "/heir/", "/auth/", "/tester.html"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
