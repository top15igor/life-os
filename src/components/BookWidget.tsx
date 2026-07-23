"use client";

import Link from "next/link";

const STR: Record<string, any> = {
  ru: { title: (y: number) => `Твоя книга «Моя жизнь, ${y}»`, growing: (n: number) => `${n} записей уже станут её страницами`, sub: "Год твоей жизни — будущее наследие для близких.", cta: "Открыть книгу", ready: "готовность" },
  en: { title: (y: number) => `Your book “My life, ${y}”`, growing: (n: number) => `${n} entries are becoming its pages`, sub: "A year of your life — a future legacy for your loved ones.", cta: "Open the book", ready: "ready" },
  uk: { title: (y: number) => `Твоя книга «Моє життя, ${y}»`, growing: (n: number) => `${n} записів уже стануть її сторінками`, sub: "Рік твого життя — майбутня спадщина для близьких.", cta: "Відкрити книгу", ready: "готовність" },
  fr: { title: (y: number) => `Ton livre « Ma vie, ${y} »`, growing: (n: number) => `${n} entrées deviennent ses pages`, sub: "Une année de ta vie — un futur héritage pour tes proches.", cta: "Ouvrir le livre", ready: "prêt" },
  es: { title: (y: number) => `Tu libro «Mi vida, ${y}»`, growing: (n: number) => `${n} entradas ya se están convirtiendo en sus páginas`, sub: "Un año de tu vida — un futuro legado para tus seres queridos.", cta: "Abrir el libro", ready: "listo" },
};

export default function BookWidget({ book, locale }: { book: { year: number; entries: number; readiness: number }; locale: string }) {
  const s = STR[locale] || STR.ru;
  if (!book || book.entries === 0) return null;
  const R = 22.5, C = 2 * Math.PI * R;
  return (
    <Link href="/lifebook" className="card soft-hero" style={{ display: "block", marginBottom: 16, border: "1px solid var(--border)", textDecoration: "none", color: "var(--text)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
          <circle cx={28} cy={28} r={R} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={5} />
          <circle cx={28} cy={28} r={R} fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - book.readiness / 100)} transform="rotate(-90 28 28)" />
          <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text)">{book.readiness}%</text>
        </svg>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14.5, fontWeight: 600 }}>
            <i className="ti ti-book-2" style={{ fontSize: 17, color: "var(--accent)" }} />{s.title(book.year)}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--accent-text)", marginTop: 3 }}>{s.growing(book.entries)}</div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2, lineHeight: 1.4 }}>{s.sub}</div>
        </div>
        <i className="ti ti-arrow-right" style={{ color: "var(--text-3)", flexShrink: 0 }} />
      </div>
    </Link>
  );
}
