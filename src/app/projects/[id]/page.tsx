import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { getProject } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { back: "к проектам", entries: "Записи проекта", tasks: "Задачи проекта", insights: "Инсайты", notFound: "Проект не найден.", empty: "Записей в проекте пока нет." },
  en: { back: "to projects", entries: "Project entries", tasks: "Project tasks", insights: "Insights", notFound: "Project not found.", empty: "No entries in this project yet." },
  uk: { back: "до проєктів", entries: "Записи проєкту", tasks: "Завдання проєкту", insights: "Інсайти", notFound: "Проєкт не знайдено.", empty: "Записів у проєкті поки немає." },
  fr: { back: "aux projets", entries: "Entrées du projet", tasks: "Tâches du projet", insights: "Insights", notFound: "Projet introuvable.", empty: "Pas encore d'entrées dans ce projet." },
  es: { back: "a proyectos", entries: "Entradas del proyecto", tasks: "Tareas del proyecto", insights: "Ideas", notFound: "Proyecto no encontrado.", empty: "Aún no hay entradas en este proyecto." },
};

function SectionTitle({ children }: any) {
  return <div style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 10px", letterSpacing: "-0.01em" }}>{children}</div>;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const p = await getProject(user.id, id);

  if (!p) {
    return (
      <div className="shell">
        <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
        <main className="main">
          <Link href="/projects" style={{ color: "var(--accent)", fontSize: 13 }}>← {s.back}</Link>
          <div className="card" style={{ marginTop: 14 }}>{s.notFound}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/projects" style={{ color: "var(--accent)", fontSize: 13 }}>← {s.back}</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "12px 0 4px" }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-briefcase" style={{ fontSize: 20 }} />
          </span>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{p.name}</h1>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 6 }}>{p.entries.length} · {s.tasks.toLowerCase()}: {p.tasks.length}</div>

        {p.tasks.length > 0 && (
          <>
            <SectionTitle>✅ {s.tasks}</SectionTitle>
            <TaskList tasks={p.tasks as any} />
          </>
        )}

        {p.insights.length > 0 && (
          <>
            <SectionTitle>💡 {s.insights}</SectionTitle>
            <div className="card">
              {p.insights.map((it: any, k: number) => (
                <div key={k} style={{ fontSize: 13, lineHeight: 1.55, display: "flex", gap: 8, padding: "4px 0" }}>
                  <i className="ti ti-bulb" style={{ fontSize: 15, color: "var(--energy)", marginTop: 2, flexShrink: 0 }} />{it.text}
                </div>
              ))}
            </div>
          </>
        )}

        <SectionTitle>📝 {s.entries}</SectionTitle>
        {p.entries.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          p.entries.map((e: any) => (
            <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 5 }}>{dateLabel(locale, e.entry_date)} · {(e.entry_time || "").slice(0, 5)}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{e.summary || e.raw_text}</div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
