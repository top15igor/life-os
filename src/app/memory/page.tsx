import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import MemoryArchive from "@/components/MemoryArchive";
import { getMemories } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Визуальная память", en: "Visual Memory", uk: "Візуальна пам'ять", fr: "Mémoire visuelle" };
const HINT: Record<string, string> = {
  ru: "Фото, документы и важные моменты — с понятным смыслом и местом в твоей истории.",
  en: "Photos, documents and key moments — with clear meaning and a place in your story.",
  uk: "Фото, документи й важливі моменти — зі зрозумілим сенсом і місцем у твоїй історії.",
  fr: "Photos, documents et moments clés — avec un sens clair et une place dans ton histoire.",
};

export default async function MemoryPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const memories = await getMemories(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-camera" color="#ec4899" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <MemoryArchive initial={memories as any} locale={locale} />
      </main>
    </div>
  );
}
