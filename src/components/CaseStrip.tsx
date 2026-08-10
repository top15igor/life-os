"use client";

import { useEffect, useState } from "react";
import { lifeCase } from "@/lib/cases";
import type { Locale } from "@/lib/i18n";

// Кейс раздела одной строкой — для экранов, где правой колонки нет.
//
// Колонка появляется только с 1700px, а это MacBook Pro 16 и внешние мониторы.
// На Air 13 (1440) и Pro 14 (1512), не говоря про планшет и телефон, человек
// не видел ни кейсов, ни подсказок вовсе. Здесь тот же кейс, но одной полоской
// под заголовком; на широком экране полоска скрыта — там работает колонка.

const CLOSE: Record<string, string> = {
  ru: "Скрыть", en: "Hide", uk: "Сховати", fr: "Masquer", es: "Ocultar",
};

export default function CaseStrip({ locale, section }: { locale: Locale; section?: string }) {
  const kase = lifeCase(section, locale);
  const key = `case-hidden:${section || ""}`;
  const [hidden, setHidden] = useState(false);

  // Читаем после монтирования: на сервере localStorage нет, а расходиться
  // с серверной разметкой нельзя.
  useEffect(() => {
    try {
      if (localStorage.getItem(key) === "1") setHidden(true);
    } catch {}
  }, [key]);

  if (!kase || hidden) return null;

  function close() {
    setHidden(true);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  }

  return (
    <div className="case-strip">
      <span className="case-strip-emoji">{kase.emoji}</span>
      <span className="case-strip-text">{kase.text}</span>
      <button onClick={close} className="case-strip-x" aria-label={CLOSE[locale] || CLOSE.ru} title={CLOSE[locale] || CLOSE.ru}>
        <i className="ti ti-x" />
      </button>
    </div>
  );
}
