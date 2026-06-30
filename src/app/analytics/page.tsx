import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import IntelligenceOverview from "@/components/IntelligenceOverview";
import AnalyticsPitch from "@/components/AnalyticsPitch";
import AiHelperBanner from "@/components/AiHelperBanner";
import { getEntries, getOnThisDay, getEntryCount, cats, tagList, projects as projectsOf, people as peopleOf, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { isPro } from "@/lib/plan";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { map: "Карта жизни", mapHint: "Самые большие темы твоей жизни — нажми, чтобы посмотреть записи.", spheres: "Сферы жизни", themes: "Темы", onthis: "Этот день в истории", year: "Год назад в этот день", month: "Месяц назад в этот день", empty: "Пока пусто — первые наблюдения появятся уже через несколько записей." },
  en: { map: "Life map", mapHint: "The biggest themes of your life — tap to see entries.", spheres: "Life areas", themes: "Topics", onthis: "This day in history", year: "A year ago today", month: "A month ago today", empty: "Empty for now — first insights appear after a few entries." },
  uk: { map: "Карта життя", mapHint: "Найбільші теми твого життя — натисни, щоб подивитися записи.", spheres: "Сфери життя", themes: "Теми", onthis: "Цей день в історії", year: "Рік тому цього дня", month: "Місяць тому цього дня", empty: "Поки порожньо — перші спостереження з'являться за кілька записів." },
  fr: { map: "Carte de vie", mapHint: "Les plus grands thèmes de ta vie — touche pour voir les entrées.", spheres: "Domaines de vie", themes: "Sujets", onthis: "Ce jour dans l'histoire", year: "Il y a un an aujourd'hui", month: "Il y a un mois aujourd'hui", empty: "Vide pour l'instant — les premières observations arrivent après quelques entrées." },
};

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

type MapItem = { label: string; count: number; href: string; color: string; kind: "sphere" | "theme" };

function MapChip({ it, maxCount }: { it: MapItem; maxCount: number }) {
  const scale = 0.5 + (it.count / maxCount) * 0.5; // 0.5..1
  return (
    <Link href={it.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: `${Math.round(5 + scale * 5)}px ${Math.round(10 + scale * 6)}px`, borderRadius: 99, background: "var(--surface-2)", color: "var(--text)", fontSize: Math.round(12.5 + scale * 6), fontWeight: 500, lineHeight: 1.1 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: it.color, flexShrink: 0 }} />
      {it.label}
      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{it.count}</span>
    </Link>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const h = hints(locale);
  const sp = await searchParams;

  // «Что заметил AI» открывается на Pro/Премиуме ИЛИ БЕСПЛАТНО за 50 записей (мотивируем вести дневник).
  // ?preview=lock — продающая страница даже у тех, у кого открыто.
  const FREE_AT = 50;
  const entryCount = await getEntryCount(user.id);
  const unlocked = ((await isPro(user.id)) || entryCount >= FREE_AT) && sp?.preview !== "lock";
  if (!unlocked) {
    return (
      <div className="shell">
        <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
        <main className="main">
          <PageHead icon="ti-sparkles" color="var(--insight)" title={t.nav.analytics} hint={h.analytics} />
          <AnalyticsPitch locale={locale} progress={{ count: entryCount, need: FREE_AT }} />
        </main>
      </div>
    );
  }

  const entries = await getEntries(user.id, 200);

  // Карта жизни: главные темы из категорий, проектов и тегов.
  // Тег, совпадающий с категорией (#здоровье ≡ Здоровье), вливается в неё — без дублей.
  const norm = (x: string) => x.toLowerCase().replace(/^#/, "").replace(/ё/g, "е").trim();
  const catByName: Record<string, string> = {};
  for (const [slug, name] of Object.entries(t.cats)) { catByName[norm(slug)] = slug; catByName[norm(name)] = slug; }

  const items: Record<string, MapItem> = {};
  const bump = (key: string, item: MapItem) => {
    if (items[key]) items[key].count += item.count;
    else items[key] = item;
  };
  const bumpCat = (slug: string) => bump("c:" + slug, { label: t.cats[slug] || slug, count: 1, href: `/diary?category=${slug}`, color: CAT_COLOR[slug] || "var(--accent)", kind: "sphere" });
  for (const e of entries as Entry[]) {
    for (const c of cats(e)) bumpCat(c.slug);
    for (const p of projectsOf(e)) bump("p:" + p, { label: p, count: 1, href: "/projects", color: "#3b82f6", kind: "sphere" });
    for (const tg of tagList(e)) {
      const catSlug = catByName[norm(tg)];
      if (catSlug) bumpCat(catSlug); // тег = категория → объединяем
      else bump("t:" + tg, { label: "#" + tg, count: 1, href: `/diary?tag=${encodeURIComponent(tg)}`, color: "var(--accent)", kind: "theme" });
    }
  }
  const all = Object.values(items);
  const maxCount = all.reduce((m, i) => Math.max(m, i.count), 1);
  const spheres = all.filter((i) => i.kind === "sphere").sort((a, b) => b.count - a.count).slice(0, 12);
  const themes = all.filter((i) => i.kind === "theme").sort((a, b) => b.count - a.count).slice(0, 12);
  const hasMap = spheres.length + themes.length > 0;

  const today = new Date().toISOString().slice(0, 10);
  const mem = await getOnThisDay(user.id, today);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-sparkles" color="var(--insight)" title={t.nav.analytics} hint={h.analytics} />

        <AiHelperBanner which="analytics" locale={locale} />
        <IntelligenceOverview locale={locale} />

        {hasMap && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
              <span style={{ fontSize: 17 }}>🌍</span>{s.map}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11 }}>{s.mapHint}</div>
            <div className="card">
              {spheres.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10 }}>{s.spheres}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {spheres.map((it) => <MapChip key={it.label} it={it} maxCount={maxCount} />)}
                  </div>
                </>
              )}
              {themes.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.03em", margin: `${spheres.length ? 16 : 0}px 0 10px`, paddingTop: spheres.length ? 14 : 0, borderTop: spheres.length ? "1px solid var(--border)" : "none" }}>{s.themes}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {themes.map((it) => <MapChip key={it.label} it={it} maxCount={maxCount} />)}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {mem && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
              <span style={{ fontSize: 17 }}>📅</span>{s.onthis}
            </div>
            <div className="card" style={{ background: "var(--surface-2)" }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 5 }}>{mem.period === "year" ? s.year : s.month}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{mem.summary}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
