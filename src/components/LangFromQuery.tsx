"use client";

import { useEffect } from "react";
import { isLocale } from "@/lib/i18n";

// Позволяет открывать страницу сразу на нужном языке через ?lang=fr (или ?lng / ?locale).
// Ставит cookie выбранного языка и перезагружает один раз; повторных перезагрузок нет (сверяемся с cookie).
export default function LangFromQuery() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("lang") || params.get("lng") || params.get("locale");
    if (!q || !isLocale(q)) return;

    const cur = document.cookie.split("; ").find((c) => c.startsWith("locale="))?.split("=")[1];

    const cleanUrl = () => {
      params.delete("lang"); params.delete("lng"); params.delete("locale");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    };

    if (cur === q) { cleanUrl(); return; }

    document.cookie = `locale=${q}; path=/; max-age=31536000`;
    cleanUrl();
    location.reload();
  }, []);

  return null;
}
