import Link from "next/link";
import { cats, tagList, type Entry } from "@/lib/queries";
import { dateLabel } from "@/lib/i18n";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

const EMPTY: Record<string, string> = {
  ru: "В этой категории пока нет записей.",
  en: "No entries in this category yet.",
  uk: "У цій категорії поки немає записів.",
  fr: "Pas encore d'entrées dans cette catégorie.",
};

export default function EntryFeed({ entries, t, locale }: { entries: Entry[]; t: any; locale: string }) {
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries) (byDate[e.entry_date] ||= []).push(e);
  const dates = Object.keys(byDate).sort().reverse();

  if (!dates.length) {
    return <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{EMPTY[locale] || EMPTY.ru}</div>;
  }

  return (
    <>
      {dates.map((d) => (
        <div key={d} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>{dateLabel(locale as any, d)}</div>
          {byDate[d].map((e) => (
            <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)", marginBottom: 6, flexWrap: "wrap" }}>
                <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13 }} />
                {(e.entry_time || "").slice(0, 5)} · {e.source === "telegram_voice" ? t.voice : t.text}
                {cats(e).slice(0, 3).map((c: any) => (
                  <span key={c.slug} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 7, background: "var(--surface-2)", color: CAT_COLOR[c.slug] || "var(--text-2)" }}>{t.cats[c.slug] || c.slug}</span>
                ))}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 8 }}>{e.summary || e.raw_text}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tagList(e).slice(0, 5).map((tg: string) => (<span key={tg} style={{ fontSize: 11.5, color: "var(--accent)" }}>#{tg}</span>))}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}
