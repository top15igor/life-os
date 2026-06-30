// Рендер секций карточки инструкции (p / заголовок / шаги / примеры / подсказки).
// Используется и в модалке GuidePanels, и на отдельных страницах инструкции.

type Section = { h?: string; p?: string; steps?: string[]; examples?: string[]; tips?: string[] };

export default function GuideSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          {sec.h && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 9 }}>{sec.h}</div>}
          {sec.p && <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{sec.p}</div>}

          {sec.steps && (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {sec.steps.map((st, k) => (
                <div key={k} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600 }}>{k + 1}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.55, paddingTop: 2 }}>{st}</span>
                </div>
              ))}
            </div>
          )}

          {sec.examples && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {sec.examples.map((ex2, k) => (
                <div key={k} style={{ fontSize: 13.5, lineHeight: 1.5, padding: "9px 12px", borderRadius: 10, background: "var(--surface-2)", borderLeft: "3px solid var(--accent)", color: "var(--text)" }}>{ex2}</div>
              ))}
            </div>
          )}

          {sec.tips && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sec.tips.map((tp, k) => (
                <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.55 }}>
                  <i className="ti ti-bulb" style={{ fontSize: 16, color: "var(--energy)", flexShrink: 0, marginTop: 2 }} />{tp}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
