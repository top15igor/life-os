// Плавающий переключатель дизайнов лендинга (A — классика, B — новый).
// Чисто ссылки: ?d=a / ?d=b. Реферал сохраняем.
export default function DesignSwitch({ active, refCode, labelA, labelB }: { active: "a" | "b"; refCode: string; labelA: string; labelB: string }) {
  const href = (d: "a" | "b") => (refCode ? `/about?d=${d}&ref=${encodeURIComponent(refCode)}` : `/about?d=${d}`);
  const seg = (on: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    color: on ? "#fff" : "rgba(255,255,255,.72)",
    background: on ? "#6f8f72" : "transparent",
    transition: "background .15s,color .15s",
    whiteSpace: "nowrap",
  });
  return (
    <div
      style={{
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "rgba(28,30,28,.82)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,.5)",
      }}
    >
      <a href={href("a")} style={seg(active === "a")}>A · {labelA}</a>
      <a href={href("b")} style={seg(active === "b")}>B · {labelB}</a>
    </div>
  );
}
