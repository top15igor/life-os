import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import ShareCard from "@/components/ShareCard";
import PublicProfileEditor from "@/components/PublicProfileEditor";
import { getPublicConfig } from "@/lib/public";
import { getEntries, getDreams } from "@/lib/queries";
import { getWeightData } from "@/lib/weight";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getHandle } from "@/lib/handle";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Поделиться", en: "Share", uk: "Поділитися", fr: "Partager", es: "Compartir" };
const HINT: Record<string, string> = {
  ru: "Собери красивую карточку своего достижения и поделись в Telegram, Instagram или WhatsApp. Дневник остаётся приватным: уходит только то, что ты соберёшь.",
  en: "Build a beautiful card of your achievement and share to Telegram, Instagram or WhatsApp. Your diary stays private: only what you build goes out.",
  uk: "Збери гарну картку свого досягнення і поділись у Telegram, Instagram чи WhatsApp. Щоденник лишається приватним: виходить лише те, що ти збереш.",
  fr: "Crée une belle carte de ta réussite et partage sur Telegram, Instagram ou WhatsApp. Ton journal reste privé : seul ce que tu crées sort.",
  es: "Crea una bonita tarjeta de tu logro y compártela en Telegram, Instagram o WhatsApp. Tu diario sigue siendo privado: solo sale lo que tú armes.",
};

const TRANSLIT: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g", " ": "-" };
function slugifyName(name: string): string {
  return (name || "").toLowerCase().split("").map((c) => (c in TRANSLIT ? TRANSLIT[c] : c)).join("").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
}

export default async function SharePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  const [all, dreams, weight] = await Promise.all([
    getEntries(user.id, 300),
    getDreams(user.id),
    getWeightData(user.id),
  ]);

  // Пресеты с реальными данными (для быстрого старта; всё редактируется).
  const wStart = weight.points[0]?.kg ?? null;
  const wNow = weight.current?.kg ?? null;
  const progress = wStart != null && wNow != null && weight.points.length >= 2
    ? { title: locale === "en" ? "Weight" : locale === "fr" ? "Poids" : locale === "uk" ? "Вага" : locale === "es" ? "Peso" : "Вес", from: String(wStart), to: String(wNow), unit: locale === "en" || locale === "fr" || locale === "es" ? "kg" : locale === "uk" ? "кг" : "кг" }
    : null;
  const doneDreams = dreams.filter((d: any) => d.status === "done").map((d: any) => d.text).filter(Boolean).slice(0, 12);
  const thoughts = all.map((e: any) => e.summary).filter(Boolean).slice(0, 12);

  const hdrs = await headers();
  const host = hdrs.get("host") || "life-os.today";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const refLink = `${proto}://${host}/i/${await getHandle(user.id, user.name)}`;

  const pubConfig = await getPublicConfig(user.id);
  const suggestedSlug = slugifyName(user.name) || user.id.slice(0, 8);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-share-2" color="#4f46e5" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <ShareCard prefill={{ progress, dreams: doneDreams, thoughts }} host={host} refLink={refLink} locale={locale} />
        <PublicProfileEditor initial={pubConfig} host={host} suggestedSlug={suggestedSlug} locale={locale} />
      </main>
    </div>
  );
}
