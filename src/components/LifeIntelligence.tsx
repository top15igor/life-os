"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Hint from "./Hint";
import { hints } from "@/lib/hints";

const STR: Record<string, any> = {
  ru: { title: "Life Intelligence", causes: "Почему это произошло", consequences: "Что изменилось после", related: "Связанные и похожие", decisions: "Какие решения появились", patterns: "Закономерности", loading: "AI выстраивает связи…", empty: "Связи появятся, когда накопится больше записей." },
  en: { title: "Life Intelligence", causes: "Why this happened", consequences: "What changed after", related: "Related & similar", decisions: "Decisions that emerged", patterns: "Patterns", loading: "AI is building connections…", empty: "Connections will appear as more entries accumulate." },
  uk: { title: "Life Intelligence", causes: "Чому це сталося", consequences: "Що змінилося після", related: "Пов'язані та схожі", decisions: "Які рішення з'явилися", patterns: "Закономірності", loading: "AI вибудовує зв'язки…", empty: "Зв'язки з'являться, коли накопичиться більше записів." },
  fr: { title: "Life Intelligence", causes: "Pourquoi est-ce arrivé", consequences: "Ce qui a changé après", related: "Liés et similaires", decisions: "Décisions apparues", patterns: "Tendances", loading: "L'IA construit les liens…", empty: "Les liens apparaîtront à mesure que les entrées s'accumulent." },
  es: { title: "Life Intelligence", causes: "Por qué pasó esto", consequences: "Qué cambió después", related: "Relacionado y similar", decisions: "Decisiones que surgieron", patterns: "Patrones", loading: "La IA está construyendo conexiones…", empty: "Las conexiones aparecerán a medida que se acumulen más entradas." },
};

const CONF: Record<string, { c: string; bg: string }> = {
  high: { c: "#059669", bg: "rgba(5,150,105,0.12)" },
  medium: { c: "#d97706", bg: "rgba(217,119,6,0.12)" },
  low: { c: "#6b7280", bg: "rgba(107,114,128,0.12)" },
};

function Conf({ level }: { level: string }) {
  const k = CONF[level] || CONF.low;
  return <span style={{ fontSize: 10.5, padding: "1px 7px", borderRadius: 99, color: k.c, background: k.bg }}>{level}</span>;
}

export default function LifeIntelligence({ entryId, locale }: { entryId: string; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    fetch(`/api/intelligence/${entryId}`)
      .then((r) => r.json())
      .then((j) => { if (on) { setData(j.ok ? j.intel : null); setLoading(false); } })
      .catch(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [entryId]);

  const refLink = (id: string) => {
    const r = data?.refsInfo?.[id];
    if (!r) return null;
    return (
      <Link key={id} href={`/entry/${id}`} style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-bg)", padding: "1px 7px", borderRadius: 6, marginRight: 5 }}>
        {r.date}
      </Link>
    );
  };

  const Lines = ({ items }: { items: any[] }) => (
    <>
      {items.map((c, k) => (
        <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: "5px 0", display: "flex", gap: 8 }}>
          <i className="ti ti-point-filled" style={{ fontSize: 12, color: "var(--accent)", marginTop: 4, flexShrink: 0 }} />
          <span>
            {c.text} {c.confidence && <Conf level={c.confidence} />}
            {c.refs?.length > 0 && <span style={{ marginLeft: 4 }}>{c.refs.map(refLink)}</span>}
          </span>
        </div>
      ))}
    </>
  );

  const hasAny =
    data && (data.causes?.length || data.consequences?.length || data.related?.length || data.decisions?.length || data.patterns?.length);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px", marginBottom: 16, background: "var(--surface)" }}>
      <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <i className="ti ti-brain" style={{ color: "var(--insight)", fontSize: 17 }} />{s.title}
        <Hint text={hints(locale as any).intelligence} />
      </div>

      {loading ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 15 }} />{s.loading}
        </div>
      ) : !hasAny ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{data?.note || s.empty}</div>
      ) : (
        <>
          {data.causes?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 2 }}>{s.causes}</div>
              <Lines items={data.causes} />
            </div>
          )}
          {data.consequences?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 2 }}>{s.consequences}</div>
              <Lines items={data.consequences} />
            </div>
          )}
          {data.related?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 2 }}>{s.related}</div>
              {data.related.map((r: any, k: number) => (
                <Link key={k} href={`/entry/${r.entryId}`} style={{ display: "block", fontSize: 12.5, color: "var(--text-2)", padding: "4px 0" }}>
                  <span style={{ color: "var(--accent)" }}>{data.refsInfo?.[r.entryId]?.date} →</span> {r.why}
                </Link>
              ))}
            </div>
          )}
          {data.decisions?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 2 }}>{s.decisions}</div>
              {data.decisions.map((d: string, k: number) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: "3px 0", display: "flex", gap: 8 }}>
                  <i className="ti ti-arrow-right" style={{ fontSize: 13, color: "var(--accent)", marginTop: 3, flexShrink: 0 }} />{d}
                </div>
              ))}
            </div>
          )}
          {data.patterns?.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 2 }}>{s.patterns}</div>
              {data.patterns.map((p: string, k: number) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: "3px 0", display: "flex", gap: 8 }}>
                  <i className="ti ti-repeat" style={{ fontSize: 13, color: "var(--insight)", marginTop: 3, flexShrink: 0 }} />{p}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
