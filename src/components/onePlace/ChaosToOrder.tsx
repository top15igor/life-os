"use client";

import { useEffect, useRef } from "react";

/* Скролл-сцена лендинга /one-place: сверху хаос (заметки айфона, сохранёнки,
   файлы, стикеры), прокручиваешь — всё слетается в одну кучу и складывается
   в LIFE OS. Прогресс считаем сами (не animation-timeline: нужен Safari),
   позиции пишем прямо в style через rAF — без ре-рендеров React. */

export type Chip = {
  icon: string;   // эмодзи источника
  src: string;    // откуда: «Заметки айфона», «Инстаграм»…
  text: string;   // что там лежит
  sx: number;     // старт по X, доля ширины сцены от центра (-.5….5)
  sy: number;     // старт по Y, доля высоты сцены от центра
  r: number;      // наклон в хаосе, градусы
};

type Props = {
  chips: Chip[];
  caps: [string, string, string];
  hint: string;
  result: { title: string; sub: string; rows: string[] };
};

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function ChaosToOrder({ chips, caps, hint, result }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let queued = false;

    const draw = () => {
      queued = false;
      const box = outer.current;
      const st = stage.current;
      if (!box || !st) return;

      const total = box.offsetHeight - window.innerHeight;
      const passed = -box.getBoundingClientRect().top;
      const p = reduce ? 1 : clamp(total > 0 ? passed / total : 0, 0, 1);

      const W = st.clientWidth;
      const H = st.clientHeight;
      // сборка: 0.10 → 0.66, растворение в LIFE OS: 0.60 → 0.90
      const gather = easeInOut(seg(p, 0.1, 0.66));
      const merge = seg(p, 0.6, 0.9);
      const n = chips.length;

      items.current.forEach((el, i) => {
        if (!el) return;
        const c = chips[i];
        // финал: плотная стопка по центру, с лёгким веером
        const fanY = (i - (n - 1) / 2) * 3.2;
        const fanR = (i % 2 ? 1 : -1) * (1 - gather * 0.85) * 2;
        // держим карточки внутри сцены: на узких/низких экранах края бы обрезались
        const limX = Math.max(0, (W - el.offsetWidth) / 2 - 6);
        const limY = Math.max(0, (H - el.offsetHeight) / 2 - 6);
        const x = clamp(c.sx * W, -limX, limX) * (1 - gather);
        const y = clamp(c.sy * H, -limY, limY) * (1 - gather) + fanY * gather;
        const rot = c.r * (1 - gather) + fanR;
        const s = 1 - 0.28 * gather - 0.12 * merge;
        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        el.style.opacity = String((1 - merge * 0.96).toFixed(3));
        el.style.zIndex = String(10 + i);
      });

      // подписи-фазы: хаос → собирается → сложено
      const on = [1 - seg(p, 0.12, 0.3), seg(p, 0.2, 0.36) * (1 - seg(p, 0.62, 0.76)), seg(p, 0.72, 0.86)];
      capRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = on[i].toFixed(3);
        el.style.transform = `translateY(${((1 - on[i]) * 10).toFixed(1)}px)`;
      });

      if (panel.current) {
        const e = easeInOut(seg(p, 0.7, 0.94));
        panel.current.style.opacity = e.toFixed(3);
        panel.current.style.transform = `translate3d(-50%, -50%, 0) scale(${(0.86 + 0.14 * e).toFixed(3)})`;
        panel.current.style.pointerEvents = e > 0.6 ? "auto" : "none";
      }
      if (hintRef.current) hintRef.current.style.opacity = (1 - seg(p, 0.02, 0.14)).toFixed(3);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chips]);

  return (
    <div className="op-scene" ref={outer}>
      <div className="op-sticky">
        <div className="op-caps">
          {caps.map((c, i) => (
            <div className="op-cap" key={i} ref={(el) => { capRefs.current[i] = el; }} style={{ opacity: i === 0 ? 1 : 0 }}>
              {c}
            </div>
          ))}
        </div>

        <div className="op-stage" ref={stage}>
          {chips.map((c, i) => (
            <div
              className="op-chip"
              key={c.src + i}
              ref={(el) => { items.current[i] = el; }}
              style={{ transform: "translate3d(-50%,-50%,0)" }}
            >
              <div className="op-chip-in" style={{ animationDelay: `${(i * 0.37).toFixed(2)}s`, animationDuration: `${(7 + (i % 5)).toFixed(1)}s` }}>
                <div className="op-chip-src"><span>{c.icon}</span>{c.src}</div>
                <div className="op-chip-text">{c.text}</div>
              </div>
            </div>
          ))}

          <div className="op-panel" ref={panel} style={{ opacity: 0, transform: "translate3d(-50%,-50%,0) scale(.86)" }}>
            <div className="op-panel-head">
              <i className="ti ti-flower" />
              <span>LIFE OS</span>
            </div>
            <div className="op-panel-title">{result.title}</div>
            <div className="op-panel-sub">{result.sub}</div>
            <div className="op-panel-rows">
              {result.rows.map((r) => (
                <div className="op-panel-row" key={r}>
                  <i className="ti ti-check" />
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="op-hint" ref={hintRef}>{hint} <i className="ti ti-arrow-down" /></div>
      </div>
    </div>
  );
}
