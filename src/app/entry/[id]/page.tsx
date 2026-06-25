import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getEntry, cats, tagList, people } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import TaskList from "@/components/TaskList";
import LifeIntelligence from "@/components/LifeIntelligence";

export const dynamic = "force-dynamic";

function Section({ icon, title, color, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: color || "var(--text-2)" }} />{title}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, top }: { label: string; value: string; top?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 12.5, padding: "7px 0", borderTop: top ? "1px solid var(--border)" : "none", alignItems: "baseline" }}>
      <span style={{ color: "var(--text-2)", minWidth: 92 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const e = await getEntry(id, user.id);

  if (!e) {
    return (
      <div className="shell">
        <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
        <main className="main">
          <Link href="/diary" style={{ color: "var(--accent)", fontSize: 13 }}>← {t.entry.back}</Link>
          <div className="card" style={{ marginTop: 14 }}>{t.entry.notFound}</div>
        </main>
      </div>
    );
  }

  const placeNames = (e.entry_places || []).map((x: any) => x.places?.name).filter(Boolean);
  const projectNames = (e.entry_projects || []).map((x: any) => x.projects?.name).filter(Boolean);
  const catNames = cats(e).map((c: any) => t.cats[c.slug] || c.slug);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/diary" style={{ color: "var(--accent)", fontSize: 13 }}>← {t.entry.back}</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{t.entry.title} · {dateLabel(locale, e.entry_date)}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
              <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13 }} />
              {(e.entry_time || "").slice(0, 5)} · {e.source === "telegram_voice" ? t.entry.voiceFull : t.entry.textFull}
            </div>
          </div>
        </div>

        <Section icon="ti-quote" title={t.entry.original}>
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-2)" }}>
            {e.raw_text}
          </div>
        </Section>

        {e.summary && (
          <Section icon="ti-sparkles" title={t.entry.aiSummary} color="var(--accent)">
            <div style={{ background: "var(--accent-bg)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--accent-text)" }}>
              {e.summary}
            </div>
          </Section>
        )}

        <LifeIntelligence entryId={id} locale={locale} />

        <Section icon="ti-database" title={t.entry.extracted}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(85px, 1fr))", gap: 8, marginBottom: 10 }}>
            {[[t.mood, e.mood, "var(--accent)"], [t.energy, e.energy, "var(--energy)"], [t.health, e.health, "var(--health)"]].map(([l, v, c]: any) => (
              <div key={l} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "9px 11px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>{l}</div>
                <div style={{ fontSize: 19, fontWeight: 500, color: c }}>{v ?? "—"}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: "6px 14px" }}>
            <KV label={t.entry.tags} value={tagList(e).map((tag: string) => `#${tag}`).join("  ") || "—"} />
            <KV label={t.entry.categories} value={catNames.join(", ") || "—"} top />
            <KV label={t.entry.people} value={people(e).join(", ") || "—"} top />
            <KV label={t.entry.projects} value={projectNames.join(", ") || "—"} top />
            <KV label={t.entry.places} value={placeNames.join(", ") || "—"} top />
          </div>
        </Section>

        {e.insights?.length > 0 && (
          <Section icon="ti-bulb" title={t.entry.insights} color="var(--energy)">
            <div className="card">
              {e.insights.map((i: any, k: number) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8, padding: "3px 0" }}>
                  <i className="ti ti-point-filled" style={{ fontSize: 13, color: "var(--accent)", marginTop: 3 }} />{i.text}
                </div>
              ))}
            </div>
          </Section>
        )}

        {e.tasks?.length > 0 && (
          <Section icon="ti-checkbox" title={t.entry.tasks} color="#3b82f6">
            <TaskList tasks={e.tasks} />
          </Section>
        )}

        {e.gratitude?.length > 0 && (
          <Section icon="ti-heart" title={t.entry.gratitude} color="#14b8a6">
            <div className="card">
              {e.gratitude.map((g: any, k: number) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: "3px 0" }}>{g.text}</div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}
