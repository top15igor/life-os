"use client";

import { useState } from "react";
import { intlOf } from "@/lib/i18n";

const STR: Record<string, any> = {
  ru: { open: "Открыть главу", close: "Свернуть", loading: "AI пишет главу…", empty: "Книга жизни начнётся, когда появятся записи.", entries: "записей" },
  en: { open: "Open chapter", close: "Collapse", loading: "AI is writing the chapter…", empty: "Your Book of Life begins once you have entries.", entries: "entries" },
  uk: { open: "Відкрити главу", close: "Згорнути", loading: "AI пише главу…", empty: "Книга життя почнеться, коли з'являться записи.", entries: "записів" },
  fr: { open: "Ouvrir le chapitre", close: "Réduire", loading: "L'IA écrit le chapitre…", empty: "Ton Livre de vie commence dès que tu as des entrées.", entries: "entrées" },
  es: { open: "Abrir capítulo", close: "Contraer", loading: "La IA está escribiendo el capítulo…", empty: "Tu Libro de vida empezará en cuanto tengas entradas.", entries: "entradas" },
};

export default function LifeBook({ months, locale }: { months: { month: string; count: number }[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [open, setOpen] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  function label(month: string) {
    return new Intl.DateTimeFormat(intlOf(locale as any), { month: "long", year: "numeric" }).format(new Date(month + "-01T12:00:00"));
  }

  async function toggle(month: string) {
    if (open === month) { setOpen(null); return; }
    setOpen(month);
    if (chapters[month] === undefined) {
      setLoading(month);
      const r = await fetch(`/api/lifebook?month=${month}`).then((x) => x.json()).catch(() => null);
      setChapters((c) => ({ ...c, [month]: r?.ok ? r.chapter : null }));
      setLoading(null);
    }
  }

  if (months.length === 0) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>;
  }

  return (
    <div>
      {months.map((m) => {
        const isOpen = open === m.month;
        const ch = chapters[m.month];
        return (
          <div key={m.month} className="card" style={{ marginBottom: 10 }}>
            <div onClick={() => toggle(m.month)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-book-2" style={{ fontSize: 19, color: "var(--accent)" }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, textTransform: "capitalize" }}>{label(m.month)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{m.count} {s.entries}</div>
                </div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent)" }}>{isOpen ? s.close : s.open}</span>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                {loading === m.month ? (
                  <div style={{ fontSize: 13, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 15 }} />{s.loading}
                  </div>
                ) : ch ? (
                  <div className="fade-up">
                    <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-serif, Georgia, serif)", marginBottom: 8 }}>{ch.title}</div>
                    {ch.themes?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {ch.themes.map((th: string, k: number) => (
                          <span key={k} style={{ fontSize: 11.5, padding: "3px 9px", borderRadius: 99, background: "var(--accent-bg)", color: "var(--accent-text)" }}>{th}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ch.narrative}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>—</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
