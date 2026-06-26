import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import PricingPlans from "@/components/PricingPlans";
import { getEntries } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const HINT: Record<string, string> = {
  ru: "Честная оплата: платишь за ценность дневника, а не фиксированную «подписку на всякий случай».",
  en: "Fair pricing: you pay for the diary's value, not a just-in-case subscription.",
  uk: "Чесна оплата: платиш за цінність щоденника, а не «підписку про всяк випадок».",
  fr: "Tarification juste : tu paies pour la valeur du journal, pas un abonnement « au cas où ».",
};
const TITLE: Record<string, string> = { ru: "Тарифы", en: "Plans", uk: "Тарифи", fr: "Forfaits" };

export default async function PricingPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  const all = await getEntries(user.id, 300);
  const ym = new Date().toISOString().slice(0, 7);
  const monthEntries = all.filter((e: any) => (e.entry_date || "").startsWith(ym)).length;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-star" color="#f59e0b" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <PricingPlans locale={locale} monthEntries={monthEntries} userName={user.name || ""} />
      </main>
    </div>
  );
}
