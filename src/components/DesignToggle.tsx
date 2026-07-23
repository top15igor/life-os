"use client";

// Переключатель дизайна главной: «Классический» ↔ «✨ Новый».
const LBL: Record<string, { aware: string; classic: string }> = {
  ru: { aware: "Новый", classic: "Классический" },
  en: { aware: "New", classic: "Classic" },
  uk: { aware: "Новий", classic: "Класичний" },
  fr: { aware: "Nouveau", classic: "Classique" },
  es: { aware: "Nuevo", classic: "Clásico" },
};

function pill(active: boolean): any {
  return { fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)", whiteSpace: "nowrap" };
}

export default function DesignToggle({ locale, design, onSet }: { locale: string; design: "classic" | "aware"; onSet: (d: "classic" | "aware") => void }) {
  const l = LBL[locale] || LBL.ru;
  return (
    <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--surface-2)", gap: 2 }}>
      <button onClick={() => onSet("classic")} style={pill(design === "classic")}>{l.classic}</button>
      <button onClick={() => onSet("aware")} style={pill(design === "aware")}>✨ {l.aware}</button>
    </div>
  );
}
