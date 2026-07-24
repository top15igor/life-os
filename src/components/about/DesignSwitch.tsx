// Плавающий переключатель дизайна лендинга (A «Классика» ↔ B «Новый»).
// Обычный компонент без хуков — работает и на сервере (дизайн A), и в клиенте (дизайн B).
// Реферальная метка ?ref= сохраняется при переключении.

const STR: Record<string, { a: string; b: string; title: string }> = {
  ru: { a: "Классика", b: "Новый", title: "Дизайн" },
  en: { a: "Classic", b: "New", title: "Design" },
  uk: { a: "Класика", b: "Новий", title: "Дизайн" },
  fr: { a: "Classique", b: "Nouveau", title: "Design" },
  es: { a: "Clásico", b: "Nuevo", title: "Diseño" },
};

export default function DesignSwitch({ locale, current, refCode }: { locale: string; current: "a" | "b"; refCode?: string }) {
  const s = STR[locale] || STR.ru;
  const q = refCode ? `&ref=${encodeURIComponent(refCode)}` : "";
  const hrefA = `/about?d=a${q}`;
  const hrefB = `/about?d=b${q}`;

  const seg = (active: boolean): React.CSSProperties => ({
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: active ? 600 : 500,
    textDecoration: "none",
    color: active ? "#1a1a1a" : "#777",
    background: active ? "#fff" : "transparent",
    boxShadow: active ? "0 1px 4px rgba(0,0,0,.12)" : "none",
    whiteSpace: "nowrap",
  });

  return (
    <div
      title={s.title}
      style={{
        position: "fixed", right: 14, bottom: 14, zIndex: 60,
        display: "flex", alignItems: "center", gap: 2, padding: 3,
        borderRadius: 999, border: "1px solid rgba(0,0,0,.08)",
        background: "rgba(240,240,238,.88)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,.10)",
      }}
    >
      <a href={hrefA} style={seg(current === "a")}>{s.a}</a>
      <a href={hrefB} style={seg(current === "b")}>{s.b}</a>
    </div>
  );
}
