"use client";

import { useEffect, useState } from "react";

const STR: Record<string, any> = {
  ru: {
    loading: "AI изучает твою жизнь…",
    noticed: "Сегодня AI заметил", discovery: "Главное открытие",
    happiness: "Что делает тебя счастливым", givers: "Что даёт энергию", drainers: "Что забирает энергию",
    chains: "Причины → последствия", surprise: "AI удивился", story: "История последних 30 дней", patterns: "Закономерности",
    conf: { low: "гипотеза", medium: "вероятно", high: "уверенно" }, basis: "на основе", retry: "Обновить", loadingHint: "Это занимает 10–20 секунд", failed: "Не удалось собрать наблюдения. Попробуй обновить.",
    empty: "Наблюдения появятся, когда накопится больше записей. Пиши боту каждый день 🙂",
  },
  en: {
    loading: "AI is studying your life…",
    noticed: "Today AI noticed", discovery: "Key discovery",
    happiness: "What makes you happy", givers: "What gives energy", drainers: "What drains energy",
    chains: "Causes → effects", surprise: "AI was surprised", story: "Story of the last 30 days", patterns: "Patterns",
    conf: { low: "hypothesis", medium: "likely", high: "confident" }, basis: "based on", retry: "Refresh", loadingHint: "This takes 10–20 seconds", failed: "Couldn't build insights. Try refreshing.",
    empty: "Insights will appear as more entries accumulate. Write to the bot every day 🙂",
  },
  uk: {
    loading: "AI вивчає твоє життя…",
    noticed: "Сьогодні AI помітив", discovery: "Головне відкриття",
    happiness: "Що робить тебе щасливим", givers: "Що дає енергію", drainers: "Що забирає енергію",
    chains: "Причини → наслідки", surprise: "AI здивувався", story: "Історія останніх 30 днів", patterns: "Закономірності",
    conf: { low: "гіпотеза", medium: "ймовірно", high: "впевнено" }, basis: "на основі", retry: "Оновити", loadingHint: "Це триває 10–20 секунд", failed: "Не вдалося зібрати спостереження. Спробуй оновити.",
    empty: "Спостереження з'являться, коли накопичиться більше записів. Пиши боту щодня 🙂",
  },
  fr: {
    loading: "L'IA étudie ta vie…",
    noticed: "Aujourd'hui l'IA a remarqué", discovery: "Découverte clé",
    happiness: "Ce qui te rend heureux", givers: "Ce qui donne de l'énergie", drainers: "Ce qui épuise",
    chains: "Causes → effets", surprise: "L'IA a été surprise", story: "Histoire des 30 derniers jours", patterns: "Schémas",
    conf: { low: "hypothèse", medium: "probable", high: "sûr" }, basis: "d'après", retry: "Actualiser", loadingHint: "Cela prend 10–20 secondes", failed: "Impossible de générer. Réessaie.",
    empty: "Les observations apparaîtront avec plus d'entrées. Écris au bot chaque jour 🙂",
  },
};

function Conf({ level, s }: any) {
  const c = level === "high" ? "var(--positive)" : level === "medium" ? "#f59e0b" : "var(--text-3)";
  return <span style={{ fontSize: 11, color: c, background: "var(--surface-2)", padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{(s.conf[level] || s.conf.low)}</span>;
}

function Refs({ refs, s }: any) {
  if (!refs?.length) return null;
  return <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 7 }}>{s.basis}: {refs.slice(0, 5).join(" · ")}</div>;
}

function Block({ emoji, title, children }: any) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
        <span style={{ fontSize: 17 }}>{emoji}</span>{title}
      </div>
      {children}
    </div>
  );
}

function EnergyRow({ item, color }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{item.label}</span>
        <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map((n) => (<span key={n} style={{ width: 7, height: 7, borderRadius: 99, background: n <= item.strength ? color : "var(--surface-2)" }} />))}
        </span>
      </div>
      {item.why && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, lineHeight: 1.45 }}>{item.why}</div>}
    </div>
  );
}

function Skeleton({ s }: any) {
  return (
    <div>
      <style>{`@keyframes lopulse{0%,100%{opacity:.45}50%{opacity:.85}}`}</style>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <i className="ti ti-sparkles" style={{ color: "var(--insight)" }} />{s.loading}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14, marginLeft: 24 }}>{s.loadingHint}</div>
      {[120, 80, 96].map((hgt, i) => (
        <div key={i} style={{ height: hgt, borderRadius: 14, background: "var(--surface-2)", marginBottom: 12, animation: "lopulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

export default function IntelligenceOverview({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load(fresh = false) {
    setLoading(true);
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 75000);
    fetch("/api/life-overview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fresh }), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setData(j.data || null))
      .catch(() => setData(null))
      .finally(() => { clearTimeout(to); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  if (loading) return <Skeleton s={s} />;

  const d = data;
  const hasAny = d && (d.noticed || d.discovery || d.happiness?.length || d.energyGivers?.length || d.energyDrainers?.length || d.chains?.length || d.surprise || d.story || d.patterns?.length);

  if (!hasAny) {
    return (
      <div className="card" style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6 }}>
        {!data ? s.failed : (d.note || s.empty)}
        <button onClick={() => load(true)} style={{ display: "block", marginTop: 12, fontSize: 13, padding: "7px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>
          <i className="ti ti-refresh" style={{ fontSize: 13, verticalAlign: "-2px" }} /> {s.retry}
        </button>
      </div>
    );
  }

  return (
    <div>
      {d.noticed && (
        <div style={{ borderRadius: 16, padding: "18px 18px", marginBottom: 22, background: "linear-gradient(135deg, var(--accent-bg), var(--surface-2))", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
            <span style={{ fontSize: 17 }}>🧠</span><span style={{ fontWeight: 600, color: "var(--text)" }}>{s.noticed}</span>
            <span style={{ marginLeft: "auto" }}><Conf level={d.noticed.confidence} s={s} /></span>
          </div>
          <div style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 500 }}>{d.noticed.text}</div>
          {d.noticed.why && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 9, lineHeight: 1.55 }}>{d.noticed.why}</div>}
          <Refs refs={d.noticed.refs} s={s} />
        </div>
      )}

      {d.discovery && (
        <Block emoji="💡" title={s.discovery}>
          <div className="card">
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <div style={{ fontSize: 14.5, lineHeight: 1.55, flex: 1 }}>{d.discovery.text}</div>
              <Conf level={d.discovery.confidence} s={s} />
            </div>
            {d.discovery.basis && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 7 }}>{d.discovery.basis}</div>}
            <Refs refs={d.discovery.refs} s={s} />
          </div>
        </Block>
      )}

      {d.happiness?.length > 0 && (
        <Block emoji="😊" title={s.happiness}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {d.happiness.map((hp: any, i: number) => (
              <div key={i} className="card" style={{ padding: "13px 14px" }}>
                <div style={{ fontSize: 24, marginBottom: 5 }}>{hp.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{hp.label}</div>
                {hp.why && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.45 }}>{hp.why}</div>}
              </div>
            ))}
          </div>
        </Block>
      )}

      {(d.energyGivers?.length > 0 || d.energyDrainers?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 14, marginBottom: 22 }}>
          {d.energyGivers?.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>⚡ {s.givers}</div>
              <div className="card">{d.energyGivers.map((it: any, i: number) => <EnergyRow key={i} item={it} color="#f59e0b" />)}</div>
            </div>
          )}
          {d.energyDrainers?.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>⚠️ {s.drainers}</div>
              <div className="card">{d.energyDrainers.map((it: any, i: number) => <EnergyRow key={i} item={it} color="#ef4444" />)}</div>
            </div>
          )}
        </div>
      )}

      {d.chains?.length > 0 && (
        <Block emoji="🌳" title={s.chains}>
          {d.chains.map((ch: any, i: number) => (
            <div key={i} className="card" style={{ marginBottom: 10 }}>
              {ch.steps.map((step: string, j: number) => (
                <div key={j}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--accent)", marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{step}</span>
                  </div>
                  {j < ch.steps.length - 1 && <div style={{ marginLeft: 3, color: "var(--text-3)", fontSize: 14, lineHeight: 1.2 }}>↓</div>}
                </div>
              ))}
            </div>
          ))}
        </Block>
      )}

      {d.surprise && (
        <div style={{ borderRadius: 14, padding: "15px 16px", marginBottom: 22, background: "var(--surface-2)", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>🔥 {s.surprise}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{d.surprise.text}</div>
          {d.surprise.why && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 6 }}>{d.surprise.why}</div>}
        </div>
      )}

      {d.story && (
        <Block emoji="📖" title={s.story}>
          <div className="card" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{d.story}</div>
        </Block>
      )}

      {d.patterns?.length > 0 && (
        <Block emoji="🧭" title={s.patterns}>
          <div className="card">
            {d.patterns.map((p: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 9, padding: "5px 0", fontSize: 13.5, lineHeight: 1.5 }}>
                <i className="ti ti-point-filled" style={{ fontSize: 13, color: "var(--insight)", marginTop: 3, flexShrink: 0 }} />{p}
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}
