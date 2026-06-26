import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import ShareCard from "@/components/ShareCard";
import PublicProfileEditor from "@/components/PublicProfileEditor";
import { getPublicConfig } from "@/lib/public";
import { getEntries, getGoodDeeds, getDreams, getStreak } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getInviteCode } from "@/lib/users";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Поделиться", en: "Share", uk: "Поділитися", fr: "Partager" };
const HINT: Record<string, string> = {
  ru: "Красивые карточки твоих успехов — поделись в Telegram, Instagram или WhatsApp. Дневник остаётся приватным: уходит только то, что ты выберешь.",
  en: "Beautiful cards of your wins — share to Telegram, Instagram or WhatsApp. Your diary stays private: only what you pick goes out.",
  uk: "Гарні картки твоїх успіхів — поділись у Telegram, Instagram чи WhatsApp. Щоденник лишається приватним: виходить лише те, що ти обереш.",
  fr: "De belles cartes de tes réussites — partage sur Telegram, Instagram ou WhatsApp. Ton journal reste privé : seul ce que tu choisis sort.",
};

const PT: Record<string, { month: (m: string) => string; year: (y: string) => string; all: string }> = {
  ru: { month: (m) => `Мой ${m}`, year: (y) => `Мой ${y} год`, all: "Вся моя жизнь" },
  en: { month: (m) => `My ${m}`, year: (y) => `My year ${y}`, all: "My whole life" },
  uk: { month: (m) => `Мій ${m}`, year: (y) => `Мій ${y} рік`, all: "Усе моє життя" },
  fr: { month: (m) => `Mon ${m}`, year: (y) => `Mon année ${y}`, all: "Toute ma vie" },
};

// Транслитерация имени в латиницу для красивого предлагаемого адреса (Игорь → igor).
const TRANSLIT: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g", " ": "-" };
function slugifyName(name: string): string {
  return (name || "").toLowerCase().split("").map((c) => (c in TRANSLIT ? TRANSLIT[c] : c)).join("").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
}

export default async function SharePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  const [all, deeds, dreams, streak] = await Promise.all([
    getEntries(user.id, 300),
    getGoodDeeds(user.id, 300),
    getDreams(user.id),
    getStreak(user.id),
  ]);

  const now = new Date();
  const ym = now.toISOString().slice(0, 10).slice(0, 7);
  const yStr = String(now.getUTCFullYear());
  const lc = locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : locale === "uk" ? "uk-UA" : "ru-RU";
  const monthName = now.toLocaleDateString(lc, { month: "long" });

  const inP = (d: string | undefined, start: string | null) => !start || (d || "") >= start;
  const build = (start: string | null) => {
    const list = all.filter((e: any) => inP(e.entry_date, start));
    const days = new Set(list.map((e: any) => e.entry_date)).size;
    const voice = list.filter((e: any) => e.source === "telegram_voice").length;
    const d = deeds.filter((x: any) => inP((x.created_at || "").slice(0, 10), start)).length;
    const dr = dreams.filter((x: any) => x.status === "done" && inP((x.created_at || "").slice(0, 10), start)).length;
    return { entries: list.length, days, voice, deeds: d, dreamsDone: dr };
  };

  const p = PT[locale] || PT.ru;
  const periods = [
    { key: "month", title: p.month(monthName), stats: build(`${ym}-01`) },
    { key: "year", title: p.year(yStr), stats: build(`${yStr}-01-01`) },
    { key: "all", title: p.all, stats: build(null) },
  ];

  const hdrs = await headers();
  const host = hdrs.get("host") || "mylifebookai.vercel.app";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const refLink = `${proto}://${host}/i/${await getInviteCode(user.id)}`;

  const pubConfig = await getPublicConfig(user.id);
  const suggestedSlug = slugifyName(user.name) || user.id.slice(0, 8);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-share-2" color="#4f46e5" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <ShareCard periods={periods} streak={streak} host={host} refLink={refLink} locale={locale} />
        <PublicProfileEditor initial={pubConfig} host={host} suggestedSlug={suggestedSlug} locale={locale} />
      </main>
    </div>
  );
}
