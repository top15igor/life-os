import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getEntries, cats, tagList, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PageHead from "@/components/PageHead";
import { hints } from "@/lib/hints";

export const dynamic = "force-dynamic";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899",
  business: "#3b82f6", finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6",
  task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

export default async function DiaryPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const entries = await getEntries(user.id, 200);
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries) (byDate[e.entry_date] ||= []).push(e);
  const dates = Object.keys(byDate).sort().reverse();
  const filters = [t.filters.date, t.filters.category, t.filters.tags, t.filters.mood, t.filters.people];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-book" color="var(--accent)" title={t.diaryTitle} hint={h.diary} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {filters.map((f) => (
            <span key={f} style={{ fontSize: 12.5, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text-2)" }}>
              {f} <i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
            </span>
          ))}
        </div>

        {dates.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{t.diaryEmpty}</div>
        ) : (
          dates.map((d) => (
            <div key={d} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>{dateLabel(locale, d)}</div>
              {byDate[d].map((e) => (
                <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6 }}>
                    <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13 }} />
                    {(e.entry_time || "").slice(0, 5)} · {e.source === "telegram_voice" ? t.voice : t.text}
                    {cats(e).slice(0, 3).map((c: any) => (
                      <span key={c.slug} className="tag" style={{ background: "var(--surface-2)", color: CAT_COLOR[c.slug] || "var(--text-2)" }}>{t.cats[c.slug] || c.slug}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 8 }}>{e.summary || e.raw_text}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-2)" }}>
                    {tagList(e).slice(0, 5).map((tag: string) => (
                      <span key={tag} style={{ color: "var(--accent)" }}>#{tag}</span>
                    ))}
                    <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                      {e.mood != null && <span>{t.mood} {e.mood}</span>}
                      {e.energy != null && <span>{t.energy} {e.energy}</span>}
                      {e.health != null && <span>{t.health} {e.health}</span>}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
