import Link from "next/link";
import { getLocale } from "@/lib/locale";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { PUBLIC_LIGHT_AURORA } from "@/lib/publicShell";

// Страница «такого адреса нет». Раньше её не было: опечатка в ссылке давала
// голый чёрно-белый экран Next без единой ссылки наружу.

const T: Record<string, { title: string; text: string; home: string; feat: string }> = {
  ru: { title: "Такой страницы нет", text: "Возможно, ссылка устарела или в адресе опечатка. Ничего не потерялось — вот куда можно вернуться.", home: "На главную", feat: "Посмотреть возможности" },
  en: { title: "This page doesn't exist", text: "The link may be outdated or the address has a typo. Nothing is lost — here's where to go next.", home: "Home", feat: "See the features" },
  uk: { title: "Такої сторінки немає", text: "Можливо, посилання застаріло або в адресі помилка. Нічого не загубилося — ось куди можна повернутися.", home: "На головну", feat: "Подивитись можливості" },
  fr: { title: "Cette page n'existe pas", text: "Le lien est peut-être périmé ou l'adresse contient une faute. Rien n'est perdu — voici où aller.", home: "Accueil", feat: "Voir les fonctionnalités" },
  es: { title: "Esta página no existe", text: "Puede que el enlace haya caducado o que la dirección tenga una errata. No se ha perdido nada — aquí puedes seguir.", home: "Inicio", feat: "Ver las funciones" },
};

export default async function NotFound() {
  const locale = await getLocale();
  const s = T[locale] || T.ru;

  return (
    <div data-public="1" style={PUBLIC_LIGHT_AURORA}>
      <PublicHeader locale={locale} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "90px 22px 110px", textAlign: "center" }}>
        <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--accent)" }}>404</div>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "18px 0 10px" }}>{s.title}</h1>
        <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 460 }}>{s.text}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/about" style={{ padding: "13px 26px", borderRadius: 12, background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 12px 28px -12px rgba(91,91,245,.55)" }}>
            {s.home}
          </Link>
          <Link href="/features" style={{ padding: "13px 26px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            {s.feat}
          </Link>
        </div>
      </div>
      <PublicFooter locale={locale} width={640} />
    </div>
  );
}
