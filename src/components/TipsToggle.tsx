"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Выключатель подсказок. Через месяц человек всё это уже знает, и колонка
// просто занимает место — пусть будет чем её убрать.
//
// Храним в куке (не в базе): сервер читает её при отрисовке, поэтому
// подсказки не мигают и SQL для этого не нужен.

const T: Record<string, { title: string; sub: string }> = {
  ru: { title: "Подсказки в разделах", sub: "Кейсы и советы справа от содержимого. Всё знаешь — выключи." },
  en: { title: "Tips in sections", sub: "Cases and advice to the right of the content. Know it all — turn it off." },
  uk: { title: "Підказки в розділах", sub: "Кейси й поради праворуч від вмісту. Усе знаєш — вимкни." },
  fr: { title: "Astuces dans les sections", sub: "Cas et conseils à droite du contenu. Tu sais déjà tout ? Désactive." },
  es: { title: "Consejos en las secciones", sub: "Casos y consejos a la derecha. ¿Ya lo sabes todo? Desactívalo." },
};

export default function TipsToggle({ locale, initialOn }: { locale: string; initialOn: boolean }) {
  const s = T[locale] || T.ru;
  const [on, setOn] = useState(initialOn);
  const router = useRouter();

  function toggle() {
    const next = !on;
    setOn(next);
    // Год жизни куки: выключил — значит выключил надолго.
    document.cookie = `tips=${next ? "on" : "off"}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
      <i className="ti ti-bulb" style={{ fontSize: 22, color: "var(--accent)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45 }}>{s.sub}</div>
      </div>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={on}
        style={{
          width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
          background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background .18s",
        }}
      >
        <span
          style={{
            position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%",
            background: "#fff", transition: "left .18s", boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          }}
        />
      </button>
    </div>
  );
}
