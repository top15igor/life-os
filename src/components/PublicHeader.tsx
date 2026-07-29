import Link from "next/link";
import LangMenu from "@/components/LangMenu";
import type { Locale } from "@/lib/i18n";

// Единая шапка публичных страниц (лендинги, юр. документы, чужие витрины).
// До неё каждая страница рисовала свою (lp-topbar / fx-top / op-top), а половина
// публичных страниц была вообще без шапки — с чужой витрины было некуда идти.
// Палитру не задаём: наследуем переменные страницы, чтобы шапка вставала и в
// светлый лендинг, и в витрину с темой посетителя.

type NavLink = { href: string; label: string };

const T: Record<string, { login: string; app: string; home: string }> = {
  ru: { login: "Войти", app: "В приложение", home: "На главную" },
  en: { login: "Sign in", app: "Open app", home: "Home" },
  uk: { login: "Увійти", app: "У застосунок", home: "На головну" },
  fr: { login: "Se connecter", app: "Ouvrir l'app", home: "Accueil" },
  es: { login: "Iniciar sesión", app: "Abrir la app", home: "Inicio" },
};

const CSS = `
.ph{ position:sticky; top:0; z-index:50; background:color-mix(in srgb, var(--bg, #f7f8fc) 86%, transparent); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid var(--border, rgba(20,24,40,.08)); }
.ph-in{ max-width:var(--ph-w, 920px); margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 22px; }
.ph a{ text-decoration:none; white-space:nowrap; }
.ph-brand{ display:flex; align-items:center; gap:9px; color:var(--text, #14161c); font-size:18px; font-weight:600; }
.ph-nav{ display:flex; align-items:center; gap:22px; }
.ph-nav a{ font-size:14px; font-weight:500; color:var(--text-2, #4a5261); transition:color .15s; }
.ph-nav a:hover{ color:var(--text, #14161c); }
.ph-right{ display:flex; align-items:center; gap:10px; }
.ph-cta{ padding:9px 18px; border-radius:11px; background:linear-gradient(135deg,#6d6bf6,#8b5cf6); color:#fff; font-size:14px; font-weight:600; box-shadow:0 10px 24px -12px rgba(91,91,245,.55); }
@media (max-width:760px){ .ph-nav{ display:none; } }
@media (max-width:640px){
  .ph-in{ padding:10px 14px; gap:8px; }
  .ph-brand{ font-size:16px; }
  .ph-cta{ padding:8px 13px; font-size:13px; }
}
`;

export default function PublicHeader({
  locale,
  isAuthed = false,
  links = [],
  homeHref = "/about",
  loginHref = "/login",
  ctaLabel,
  ctaHref,
  showLang = true,
  width = 920,
}: {
  locale: Locale;
  isAuthed?: boolean;
  links?: NavLink[];
  homeHref?: string;
  loginHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
  showLang?: boolean;
  /** Ширина контентной колонки страницы — чтобы логотип встал по одной линии с текстом. */
  width?: number;
}) {
  const s = T[locale] || T.ru;
  // Вошедшему не предлагаем «Войти»: ведём в приложение.
  const href = ctaHref || (isAuthed ? "/" : loginHref);
  const label = ctaLabel || (isAuthed ? s.app : s.login);

  return (
    <div className="ph" style={{ ["--ph-w" as any]: `${width}px` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ph-in">
        <Link href={homeHref} className="ph-brand" title={s.home}>
          <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent, #5b5bf5)" }} />
          LIFE OS
        </Link>
        {links.length > 0 && (
          <nav className="ph-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
        )}
        <div className="ph-right">
          {showLang && <LangMenu current={locale} align="right" />}
          <Link href={href} className="ph-cta">{label}</Link>
        </div>
      </div>
    </div>
  );
}
