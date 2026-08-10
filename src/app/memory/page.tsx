import Sidebar from "@/components/Sidebar";
import CaseStrip from "@/components/CaseStrip";
import TipsRail from "@/components/TipsRail";
import PageHead from "@/components/PageHead";
import MemoryArchive from "@/components/MemoryArchive";
import { getMemories } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Визуальная память", en: "Visual Memory", uk: "Візуальна пам'ять", fr: "Mémoire visuelle", es: "Memoria visual" };
const HINT: Record<string, string> = {
  ru: "Фото, документы и важные моменты — с понятным смыслом и местом в твоей истории.",
  en: "Photos, documents and key moments — with clear meaning and a place in your story.",
  uk: "Фото, документи й важливі моменти — зі зрозумілим сенсом і місцем у твоїй історії.",
  fr: "Photos, documents et moments clés — avec un sens clair et une place dans ton histoire.",
  es: "Fotos, documentos y momentos clave — con un significado claro y un lugar en tu historia.",
};

export default async function MemoryPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const memories = await getMemories(user.id);

  // Пользовательские названия категорий (переименование) — из morning_prefs.memCatLabels.
  let catLabels: Record<string, string> = {};
  let customCats: { key: string; label: string; icon: string; c: string; bg: string }[] = [];
  try {
    const { data } = await supabaseAdmin().from("users").select("morning_prefs").eq("id", user.id).maybeSingle();
    const raw = (data as any)?.morning_prefs;
    if (raw && typeof raw === "object") {
      if (raw.memCatLabels && typeof raw.memCatLabels === "object") catLabels = raw.memCatLabels;
      if (Array.isArray(raw.memCustomCats)) customCats = raw.memCustomCats.filter((c: any) => c?.key && c?.label);
    }
  } catch {}

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <CaseStrip locale={locale} section="memory" />
        <PageHead icon="ti-camera" color="#ec4899" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <MemoryArchive initial={memories as any} locale={locale} catLabels={catLabels} customCats={customCats} />
      </main>
      <TipsRail locale={locale} section="memory" />
    </div>
  );
}
