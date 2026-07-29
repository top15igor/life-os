"use client";

import { useEffect, useRef, useState } from "react";

// Карусель отзывов для лендинга: листается пальцем и стрелками, сама
// прокручивается, пока на неё не навели мышь. Ширина карточки — по экрану:
// на телефоне одна, на планшете две, на широком три.

export type CarouselReview = { text: string; name: string; role: string };

const CSS = `
.rc{ position:relative; }
.rc-track{ display:flex; gap:16px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; padding:4px 0 10px; -ms-overflow-style:none; scrollbar-width:none; }
.rc-track::-webkit-scrollbar{ display:none; }
.rc-card{ scroll-snap-align:start; flex:0 0 calc(33.333% - 11px); min-width:0; display:flex; flex-direction:column; background:var(--surface,#fff); border:1px solid var(--border,rgba(20,24,40,.08)); border-radius:18px; padding:24px 22px; box-shadow:0 1px 2px rgba(20,24,40,.04), 0 12px 32px -20px rgba(20,24,40,.18); }
@media (max-width:900px){ .rc-card{ flex-basis:calc(50% - 8px); } }
@media (max-width:620px){ .rc-card{ flex-basis:88%; } }
.rc-stars{ color:#f5a623; font-size:15px; letter-spacing:2px; margin-bottom:12px; }
.rc-text{ font-size:15.5px; color:var(--text,#14161c); line-height:1.6; margin:0 0 18px; flex:1; }
.rc-who{ display:flex; align-items:center; gap:11px; }
.rc-ava{ width:38px; height:38px; border-radius:999px; background:var(--accent-bg,#edecff); color:var(--accent-text,#4338ca); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
.rc-name{ font-size:14.5px; font-weight:600; color:var(--text,#14161c); }
.rc-role{ font-size:13px; color:var(--text-3,#8b93a3); }
.rc-bar{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:14px; }
.rc-dots{ display:flex; gap:7px; flex-wrap:wrap; }
.rc-dot{ width:7px; height:7px; border-radius:999px; border:none; padding:0; background:var(--border,rgba(20,24,40,.18)); cursor:pointer; transition:width .2s, background .2s; }
.rc-dot.on{ width:22px; background:var(--accent,#5b5bf5); }
.rc-arrows{ display:flex; gap:8px; }
.rc-arrow{ width:38px; height:38px; border-radius:999px; border:1px solid var(--border,rgba(20,24,40,.08)); background:var(--surface,#fff); color:var(--text-2,#4a5261); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s, color .15s; }
.rc-arrow:hover{ color:var(--text,#14161c); transform:translateY(-1px); }
@media (max-width:620px){ .rc-arrows{ display:none; } }
`;

export default function ReviewsCarousel({ items }: { items: CarouselReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Активная точка — по позиции прокрутки, а не по счётчику: так она не врёт,
  // когда человек листает пальцем сам.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + 16;
      setActive(Math.round(el.scrollLeft / step));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Автопрокрутка: только когда карточек больше, чем помещается, и мышь не на карусели.
  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + 16;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  // Точку подсвечиваем сразу, не дожидаясь события прокрутки: при плавной
  // анимации (или когда система просит уменьшить движение) оно приходит с
  // задержкой, и точка отставала бы от карточки.
  function go(dir: -1 | 1) {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const step = card.offsetWidth + 16;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
    setActive((a) => Math.min(items.length - 1, Math.max(0, a + dir)));
  }

  function toDot(i: number) {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollTo({ left: i * (card.offsetWidth + 16), behavior: "smooth" });
    setActive(i);
  }

  if (!items.length) return null;

  return (
    <div className="rc" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rc-track" ref={trackRef}>
        {items.map((r, i) => (
          <div className="rc-card" key={i}>
            <div className="rc-stars">★★★★★</div>
            <p className="rc-text">«{r.text}»</p>
            <div className="rc-who">
              <div className="rc-ava">{(r.name || "?").charAt(0)}</div>
              <div>
                <div className="rc-name">{r.name}</div>
                {r.role && <div className="rc-role">{r.role}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="rc-bar">
          <div className="rc-dots">
            {items.map((_, i) => (
              <button key={i} className={`rc-dot${i === active ? " on" : ""}`} aria-label={`${i + 1}`} onClick={() => toDot(i)} />
            ))}
          </div>
          <div className="rc-arrows">
            <button className="rc-arrow" aria-label="←" onClick={() => go(-1)}><i className="ti ti-chevron-left" style={{ fontSize: 19 }} /></button>
            <button className="rc-arrow" aria-label="→" onClick={() => go(1)}><i className="ti ti-chevron-right" style={{ fontSize: 19 }} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
