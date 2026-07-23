import Sidebar from "@/components/Sidebar";
import BackLink from "@/components/BackLink";
import GuideSections from "@/components/GuideSections";
import { guideExtras } from "@/lib/guideExtras";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BACK: Record<string, string> = { ru: "Инструкция", en: "Guide", uk: "Інструкція", fr: "Guide", es: "Guía" };

export default async function AiHelpersPage() {
  await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const ex = guideExtras(locale);
  const f = ex.features.find((x) => x.key === "ai-compare");

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 620 }}>
          <BackLink locale={locale} href="/guide" label={BACK[locale] || BACK.ru} />
          {f ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <i className={`ti ${f.icon}`} style={{ fontSize: 28, color: f.color, flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{f.title}</h1>
                  <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 4 }}>{f.short}</div>
                </div>
              </div>
              <div className="card">
                <GuideSections sections={f.sections} />
              </div>
            </>
          ) : (
            <div className="card">—</div>
          )}
        </div>
      </main>
    </div>
  );
}
