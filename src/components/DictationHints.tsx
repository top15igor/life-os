"use client";

import { useState, useEffect } from "react";

const HINTS: Record<string, string[]> = {
  ru: ["Что сегодня произошло?", "Кому ты сегодня помог?", "Что хорошего сделал для других?", "Ты что-то кому-то обещал?", "За что ты сегодня благодарен?", "Что важного понял?"],
  en: ["What happened today?", "Who did you help today?", "What good did you do for others?", "Did you promise anyone something?", "What are you grateful for?", "What did you realize today?"],
  uk: ["Що сьогодні сталося?", "Кому ти сьогодні допоміг?", "Що доброго зробив для інших?", "Ти щось комусь пообіцяв?", "За що ти вдячний?", "Що важливого зрозумів?"],
  fr: ["Que s'est-il passé aujourd'hui ?", "Qui as-tu aidé aujourd'hui ?", "Quel bien as-tu fait aux autres ?", "As-tu promis quelque chose à quelqu'un ?", "De quoi es-tu reconnaissant ?", "Qu'as-tu compris aujourd'hui ?"],
};

export default function DictationHints({ locale }: { locale: string }) {
  const list = HINTS[locale] || HINTS.ru;
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % list.length);
        setShow(true);
      }, 250);
    }, 3200);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-3)", margin: "-4px 2px 18px", minHeight: 18 }}>
      <i className="ti ti-bulb" style={{ fontSize: 14, flexShrink: 0 }} />
      <span style={{ opacity: show ? 1 : 0, transition: "opacity .25s" }}>{list[i]}</span>
    </div>
  );
}
