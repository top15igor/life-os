type Series = { name: string; color: string; values: (number | null)[] };

// Простой линейный график на SVG (серверный, без библиотек).
export default function TrendChart({
  series,
  max = 10,
  labels,
}: {
  series: Series[];
  max?: number;
  labels?: string[];
}) {
  const n = Math.max(1, ...series.map((s) => s.values.length));
  const W = 640, H = labels && labels.length ? 164 : 150, padL = 20, padR = 10, padT = 10, padB = labels && labels.length ? 26 : 14;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xAt = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH;
  const grid = [0, max / 2, max].map((v) => yAt(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", color: "var(--text)" }}>
      {grid.map((gy, i) => (
        <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
      ))}
      {series.map((s) => {
        const pts = s.values
          .map((v, i) => (v == null ? null : `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
          .filter(Boolean) as string[];
        return (
          <g key={s.name}>
            {pts.length > 1 && (
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            )}
            {s.values.map((v, i) =>
              v == null ? null : <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.8} fill={s.color} />
            )}
          </g>
        );
      })}
      {labels && labels.map((lb, i) => {
        // показываем подписи разреженно, чтобы не сливались
        const step = n <= 7 ? 1 : Math.ceil(n / 7);
        if (i % step !== 0 && i !== n - 1) return null;
        const x = Math.max(padL + 6, Math.min(W - padR - 6, xAt(i)));
        return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize={8.5} fill="var(--text-3)">{lb}</text>;
      })}
    </svg>
  );
}
