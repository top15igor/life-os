import Link from "next/link";
import type { Locale } from "@/lib/i18n";

// Единый футер публичных страниц — пара к PublicHeader.
// До него юридические ссылки жили только в подвале /about: с каталога, с лендинга
// заметок и с чужих витрин на «Приватность» и «Условия» было не попасть.
// Палитру наследуем от страницы, как и шапка.

const GH = "https://github.com/top15igor/life-os";

const T: Record<string, { priv: string; terms: string; code: string; tester: string; pricing: string }> = {
  ru: { priv: "Безопасно и приватно", terms: "Условия", code: "Код на GitHub", tester: "Тестировщикам", pricing: "Тарифы" },
  en: { priv: "Safe and private", terms: "Terms", code: "Code on GitHub", tester: "For testers", pricing: "Plans" },
  uk: { priv: "Безпечно і приватно", terms: "Умови", code: "Код на GitHub", tester: "Тестувальникам", pricing: "Тарифи" },
  fr: { priv: "Sûr et privé", terms: "Conditions", code: "Code sur GitHub", tester: "Pour les testeurs", pricing: "Forfaits" },
  es: { priv: "Seguro y privado", terms: "Términos", code: "Código en GitHub", tester: "Para testers", pricing: "Planes" },
};

const CSS = `
.pf{ border-top:1px solid var(--border, rgba(20,24,40,.08)); padding:24px 22px; }
.pf-in{ max-width:var(--pf-w, 920px); margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.pf a{ text-decoration:none; }
.pf-brand{ display:flex; align-items:center; gap:8px; color:var(--text-2, #4a5261); font-size:14px; }
.pf-links{ display:flex; align-items:center; flex-wrap:wrap; gap:18px; }
.pf-links a{ color:var(--text-3, #8b93a3); font-size:13px; }
.pf-links a:hover{ color:var(--text-2, #4a5261); }
.pf-priv{ display:inline-flex; align-items:center; gap:7px; padding:9px 16px; border-radius:10px; border:1px solid var(--accent, #5b5bf5); background:var(--accent-bg, #edecff); color:var(--accent-text, #4338ca) !important; font-size:13.5px; font-weight:600; }
.pf-note{ max-width:var(--pf-w, 920px); margin:14px auto 0; color:var(--text-3, #8b93a3); font-size:12.5px; }
`;

export default function PublicFooter({
  locale,
  note,
  refCode,
  width = 920,
}: {
  locale: Locale;
  /** Строка про саму страницу — то, что раньше было её собственным подвалом. */
  note?: string;
  /** Реферал не должен теряться при переходе на памятку тестировщика. */
  refCode?: string;
  width?: number;
}) {
  const s = T[locale] || T.ru;
  const testerHref = refCode ? `/tester.html?ref=${encodeURIComponent(refCode)}` : "/tester.html";

  return (
    <div className="pf" style={{ ["--pf-w" as any]: `${width}px` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pf-in">
        <div className="pf-brand">
          <i className="ti ti-flower" style={{ fontSize: 16, color: "var(--accent, #5b5bf5)" }} />
          LIFE OS
        </div>
        <div className="pf-links">
          {/* Приватность выделена кнопкой: это главный вопрос доверия к дневнику. */}
          <Link href="/privacy" className="pf-priv">
            <i className="ti ti-shield-lock" style={{ fontSize: 16, color: "var(--accent, #5b5bf5)" }} />
            {s.priv}
          </Link>
          <Link href="/pricing">{s.pricing}</Link>
          <a href={testerHref}>{s.tester}</a>
          <Link href="/terms">{s.terms}</Link>
          <a href={GH} target="_blank" rel="noreferrer">{s.code}</a>
        </div>
      </div>
      {note && <div className="pf-note">{note}</div>}
    </div>
  );
}
