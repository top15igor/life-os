// Скелет на время серверного рендера: переключение вкладок и месяцев больше
// не выглядит зависанием — картинка меняется мгновенно, цифры доезжают следом.
export default function FinanceLoading() {
  const box = (h: number) => ({
    height: h,
    borderRadius: 14,
    background: "var(--surface-2)",
    animation: "pulse 1.2s ease-in-out infinite",
  });
  return (
    <div className="shell">
      <main className="main">
        <style>{`@keyframes pulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }`}</style>
        <div style={{ display: "flex", gap: 8, margin: "18px 0 16px" }}>
          {[70, 80, 70, 90].map((w, i) => (
            <div key={i} style={{ ...box(34), width: w }} />
          ))}
        </div>
        <div style={{ ...box(44), width: 420, marginBottom: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={box(210)} />
          <div style={box(210)} />
          <div style={box(330)} />
          <div style={box(330)} />
        </div>
      </main>
    </div>
  );
}
