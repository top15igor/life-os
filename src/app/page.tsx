import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getToday, cats, tagList, type Entry } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, greeting, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import QuickAdd from "@/components/QuickAdd";

export const dynamic = "force-dynamic";

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899",
  business: "#3b82f6", finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6",
  task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4", emotions: "#a78bfa",
};

function pickLatest(entries: Entry[], key: string) {
  for (const e of entries) if (e[key] != null) return e[key];
  return null;
}

function Metric({ label, icon, value, suffix, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, marginTop: 3 }}>
        {value ?? "—"}{value != null && suffix ? <span style={{ fontSize: 12, color: "var(--text-3)" }}>{suffix}</span> : null}
      </div>
    </div>
  );
}

export default async function TodayPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const { date, entries } = await getToday(user.id);
  const mood = pickLatest(entries, "mood");
  const energy = pickLatest(entries, "energy");
  const health = pickLatest(entries, "health");
  const focus = pickLatest(entries, "focus");
  const QA = {
    ru: { placeholder: "Что произошло? Напиши пару строк…", button: "Добавить", saving: "Сохраняю…" },
    en: { placeholder: "What happened? Write a few lines…", button: "Add", saving: "Saving…" },
    uk: { placeholder: "Що сталося? Напиши кілька рядків…", button: "Додати", saving: "Зберігаю…" },
    fr: { placeholder: "Que s'est-il passé ? Écris quelques lignes…", button: "Ajouter", saving: "Enregistrement…" },
  }[locale];

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 19, fontWeight: 500 }}>{greeting(locale)}{user.name ? ", " + user.name : ""}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {dateLabel(locale, date || undefined)} · {entries.length} {t.entriesWord}
          </div>
        </div>

        <QuickAdd placeholder={QA.placeholder} button={QA.button} saving={QA.saving} hint={t.quickHint} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 9, marginBottom: 22 }}>
          <Metric label={t.mood} icon="ti-mood-smile" value={mood} suffix="/10" color="var(--accent)" />
          <Metric label={t.energy} icon="ti-bolt" value={energy} suffix="/10" color="var(--energy)" />
          <Metric label={t.health} icon="ti-heart" value={health} suffix="/10" color="var(--health)" />
          <Metric label={t.focus} icon="ti-target" value={focus} color="#3b82f6" />
        </div>

        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>{t.entriesOfDay}</div>
        {entries.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{t.noEntriesToday}</div>
        ) : (
          entries.map((e) => (
            <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "flex", gap: 12, padding: "13px 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ flexShrink: 0, width: 50, textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{(e.entry_time || "").slice(0, 5)}</div>
                <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 14, color: "var(--text-3)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 7 }}>{e.summary || e.raw_text}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cats(e).slice(0, 4).map((c: any) => (
                    <span key={c.slug} className="tag" style={{ background: "var(--surface-2)", color: CAT_COLOR[c.slug] || "var(--text-2)" }}>{t.cats[c.slug] || c.slug}</span>
                  ))}
                  {tagList(e).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="tag" style={{ color: "var(--accent)" }}>#{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
