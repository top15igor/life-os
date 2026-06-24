import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { getEntry, cats, tagList, people, kyivDateLabel } from "@/lib/queries";

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

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getEntry(id);

  if (!e) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="main">
          <Link href="/diary" style={{ color: "var(--accent)", fontSize: 13 }}>← к дневнику</Link>
          <div className="card" style={{ marginTop: 14 }}>Запись не найдена.</div>
        </main>
      </div>
    );
  }

  const places = (e.entry_places || []).map((x: any) => x.places?.name).filter(Boolean);
  const projects = (e.entry_projects || []).map((x: any) => x.projects?.name).filter(Boolean);

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Link href="/diary" style={{ color: "var(--accent)", fontSize: 13 }}>← к дневнику</Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Запись · {kyivDateLabel(e.entry_date)}</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
              <i className={`ti ${e.source === "telegram_voice" ? "ti-microphone" : "ti-message"}`} style={{ fontSize: 13 }} />
              {(e.entry_time || "").slice(0, 5)} · {e.source === "telegram_voice" ? "голосовая" : "текст"}
            </div>
          </div>
        </div>

        <Section icon="ti-quote" title="Оригинал">
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-2)" }}>
            {e.raw_text}
          </div>
        </Section>

        {e.summary && (
          <Section icon="ti-sparkles" title="AI-резюме" color="var(--accent)">
            <div style={{ background: "var(--accent-bg)", borderRadius: 12, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--accent-text)" }}>
              {e.summary}
            </div>
          </Section>
        )}

        <Section icon="ti-database" title="Извлечённые данные">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
            {[["Mood", e.mood, "var(--accent)"], ["Energy", e.energy, "var(--energy)"], ["Health", e.health, "var(--health)"]].map(([l, v, c]: any) => (
              <div key={l} style={{ background: "var(--surface-2)", borderRadius: 10, padding: "9px 11px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>{l}</div>
                <div style={{ fontSize: 19, fontWeight: 500, color: c }}>{v ?? "—"}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: "6px 14px" }}>
            <KV label="Теги" value={tagList(e).map((t: string) => `#${t}`).join("  ") || "—"} />
            <KV label="Категории" value={cats(e).map((c: any) => c.name).join(", ") || "—"} top />
            <KV label="Люди" value={people(e).join(", ") || "—"} top />
            <KV label="Проекты" value={projects.join(", ") || "—"} top />
            <KV label="Места" value={places.join(", ") || "—"} top />
          </div>
        </Section>

        {e.insights?.length > 0 && (
          <Section icon="ti-bulb" title="Инсайты" color="var(--energy)">
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
          <Section icon="ti-checkbox" title="Задачи" color="#3b82f6">
            <div className="card">
              {e.tasks.map((t: any) => (
                <div key={t.id} style={{ fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8, padding: "3px 0", color: t.done ? "var(--text-3)" : "var(--text)" }}>
                  <i className={`ti ${t.done ? "ti-square-check" : "ti-square"}`} style={{ fontSize: 15, color: t.done ? "var(--positive)" : "var(--text-3)" }} />
                  <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {e.gratitude?.length > 0 && (
          <Section icon="ti-heart" title="Благодарность" color="#14b8a6">
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

function KV({ label, value, top }: { label: string; value: string; top?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 12.5, padding: "7px 0", borderTop: top ? "1px solid var(--border)" : "none", alignItems: "baseline" }}>
      <span style={{ color: "var(--text-2)", minWidth: 78 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
