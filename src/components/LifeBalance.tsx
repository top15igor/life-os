"use client";

import { useEffect, useState } from "react";

const STR: Record<string, any> = {
  ru: { title: "Жизненный баланс", loading: "AI смотрит на твою жизнь…", growing: "Что сейчас растёт", neglected: "Без внимания", evolution: "Как меняется", empty: "Наполнится, когда накопится больше записей — здесь AI покажет, что в твоей жизни растёт, что забыто и куда всё движется.", up: "растёт", down: "снижается", flat: "стабильно" },
  en: { title: "Life balance", loading: "AI is looking at your life…", growing: "What's growing", neglected: "Neglected", evolution: "How it's changing", empty: "Fills in as entries accumulate — AI will show what's growing, what's neglected and where life is heading.", up: "up", down: "down", flat: "stable" },
  uk: { title: "Життєвий баланс", loading: "AI дивиться на твоє життя…", growing: "Що зараз росте", neglected: "Без уваги", evolution: "Як змінюється", empty: "Наповниться, коли накопичиться більше записів — AI покаже, що росте, що забуто й куди все рухається.", up: "росте", down: "знижується", flat: "стабільно" },
  fr: { title: "Équilibre de vie", loading: "L'IA observe ta vie…", growing: "Ce qui grandit", neglected: "Négligé", evolution: "Comment ça évolue", empty: "Se remplit avec les entrées — l'IA montrera ce qui grandit, ce qui est négligé et où va ta vie.", up: "monte", down: "baisse", flat: "stable" },
};

function Header({ emoji, title }: { emoji: string; title: string }) {
  return <div style={{ fontSize: 14, fontWeight: 600, margin: "0 0 9px", display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 16 }}>{emoji}</span>{title}</div>;
}

function Skeleton() {
  return (
    <div>
      <style>{`@keyframes lbpulse{0%,100%{opacity:.45}50%{opacity:.85}}`}</style>
      {[70, 54, 70].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, background: "var(--surface-2)", marginBottom: 10, animation: "lbpulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
  );
}

export default function LifeBalance({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 75000);
    fetch("/api/life-overview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setData(j.data || null))
      .catch(() => setData(null))
      .finally(() => { clearTimeout(to); setLoading(false); });
  }, []);

  const title = <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 12 }}>{s.title}</div>;

  if (loading) {
    return (
      <div style={{ marginBottom: 22 }}>
        {title}
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><i className="ti ti-sparkles" style={{ color: "var(--insight)" }} />{s.loading}</div>
        <Skeleton />
      </div>
    );
  }

  const b = data?.balance;
  const has = b && (b.growing?.length || b.neglected?.length || b.evolution?.length);
  if (!has) {
    return (
      <div style={{ marginBottom: 22 }}>
        {title}
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.55 }}>{s.empty}</div>
      </div>
    );
  }

  const dirColor = (d: string) => (d === "up" ? "var(--positive)" : d === "down" ? "#ef4444" : "var(--text-3)");
  const dirIcon = (d: string) => (d === "up" ? "ti-arrow-up-right" : d === "down" ? "ti-arrow-down-right" : "ti-arrow-right");
  const dirWord = (d: string) => (d === "up" ? s.up : d === "down" ? s.down : s.flat);

  return (
    <div style={{ marginBottom: 22 }}>
      {title}

      {b.growing?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Header emoji="🌱" title={s.growing} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
            {b.growing.map((g: any, i: number) => (
              <div key={i} className="card" style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{g.emoji || "🌱"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 3, lineHeight: 1.5 }}>{g.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {b.evolution?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Header emoji="📈" title={s.evolution} />
          <div className="card">
            {b.evolution.map((e: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                <i className={`ti ${dirIcon(e.direction)}`} style={{ fontSize: 17, color: dirColor(e.direction), flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{e.label}</b> <span style={{ color: dirColor(e.direction), fontSize: 12 }}>· {dirWord(e.direction)}</span></div>
                  {e.why && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2, lineHeight: 1.45 }}>{e.why}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {b.neglected?.length > 0 && (
        <div>
          <Header emoji="🌾" title={s.neglected} />
          <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {b.neglected.map((n: any, i: number) => (
              <div key={i} title={n.text || ""} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 99, background: "var(--surface-2)", fontSize: 13 }}>
                <span style={{ fontSize: 15 }}>{n.emoji || "🌾"}</span>{n.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
