import Sidebar from "@/components/Sidebar";
import TipsRail from "@/components/TipsRail";
import BackLink from "@/components/BackLink";
import PageHead from "@/components/PageHead";
import PricingPlans from "@/components/PricingPlans";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { PUBLIC_LIGHT_AURORA } from "@/lib/publicShell";
import { getEntries } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("pricing", "/pricing");
}

const HINT: Record<string, string> = {
  ru: "Честная оплата: платишь за ценность дневника, а не фиксированную «подписку на всякий случай».",
  en: "Fair pricing: you pay for the diary's value, not a just-in-case subscription.",
  uk: "Чесна оплата: платиш за цінність щоденника, а не «підписку про всяк випадок».",
  fr: "Tarification juste : tu paies pour la valeur du journal, pas un abonnement « au cas où ».",
  es: "Precios justos: pagas por el valor del diario, no por una suscripción «por si acaso».",
};
const TITLE: Record<string, string> = { ru: "Тарифы", en: "Plans", uk: "Тарифи", fr: "Forfaits", es: "Planes" };

export default async function PricingPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  // Цены смотрят ДО регистрации. Гостю показываем ту же таблицу в оболочке
  // публичных страниц, вошедшему — привычный экран приложения со счётчиком записей.
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div data-public="1" style={PUBLIC_LIGHT_AURORA}>
        <PublicHeader locale={locale} links={[{ href: "/about", label: locale === "en" ? "Home" : "На главную" }, { href: "/features", label: locale === "en" ? "Features" : "Возможности" }]} />
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "44px 22px 60px" }}>
          <h1 style={{ fontSize: "clamp(27px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 10px" }}>{TITLE[locale] || TITLE.ru}</h1>
          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 26px", maxWidth: 640 }}>{HINT[locale] || HINT.ru}</p>
          <PricingPlans locale={locale} monthEntries={0} userName="" guest />
        </div>
        <PublicFooter locale={locale} />
      </div>
    );
  }

  const all = await getEntries(user.id, 300);
  const ym = new Date().toISOString().slice(0, 7);
  const monthEntries = all.filter((e: any) => (e.entry_date || "").startsWith(ym)).length;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <BackLink locale={locale} />
        <PageHead icon="ti-star" color="#f59e0b" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <PricingPlans locale={locale} monthEntries={monthEntries} userName={user.name || ""} />
      </main>
      <TipsRail locale={locale} />
    </div>
  );
}
