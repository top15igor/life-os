import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import PromiseList from "@/components/PromiseList";
import { getPersonCard } from "@/lib/peopleCrm";
import { daysSince } from "@/lib/peopleCrm";
import { getLocale } from "@/lib/locale";
import { getDict, dateLabel } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { back: "к людям", notFound: "Человек не найден.", mentions: "упоминаний", lastContact: "Последний контакт", avgMood: "Настроение рядом", deedsN: "Добрых дел", today: "сегодня", ago: (n: number) => `${n} дн. назад`, staleHint: "Давно не общались — напомни о себе 💛", promises: "Обещания", deeds: "Добрые дела", timeline: "Упоминания в дневнике", empty: "Записей с этим человеком пока нет.", knownSince: "в дневнике с" },
  en: { back: "to people", notFound: "Person not found.", mentions: "mentions", lastContact: "Last contact", avgMood: "Mood together", deedsN: "Good deeds", today: "today", ago: (n: number) => `${n} days ago`, staleHint: "It's been a while — reach out 💛", promises: "Promises", deeds: "Good deeds", timeline: "Diary mentions", empty: "No entries with this person yet.", knownSince: "in the diary since" },
  uk: { back: "до людей", notFound: "Людину не знайдено.", mentions: "згадувань", lastContact: "Останній контакт", avgMood: "Настрій поруч", deedsN: "Добрих справ", today: "сьогодні", ago: (n: number) => `${n} дн. тому`, staleHint: "Давно не спілкувалися — нагадай про себе 💛", promises: "Обіцянки", deeds: "Добрі справи", timeline: "Згадки у щоденнику", empty: "Записів із цією людиною поки немає.", knownSince: "у щоденнику з" },
  fr: { back: "aux personnes", notFound: "Personne introuvable.", mentions: "mentions", lastContact: "Dernier contact", avgMood: "Humeur ensemble", deedsN: "Bonnes actions", today: "aujourd'hui", ago: (n: number) => `il y a ${n} j`, staleHint: "Ça fait longtemps — fais signe 💛", promises: "Promesses", deeds: "Bonnes actions", timeline: "Mentions dans le journal", empty: "Pas encore d'entrées avec cette personne.", knownSince: "dans le journal depuis" },
  es: { back: "a personas", notFound: "Persona no encontrada.", mentions: "menciones", lastContact: "Último contacto", avgMood: "Ánimo juntos", deedsN: "Buenas acciones", today: "hoy", ago: (n: number) => `hace ${n} días`, staleHint: "Hace tiempo que no hablan — escríbele 💛", promises: "Promesas", deeds: "Buenas acciones", timeline: "Menciones en el diario", empty: "Aún no hay entradas con esta persona.", knownSince: "en el diario desde" },
};

function moodEmoji(m: number): string {
  if (m >= 8) return "😄";
  if (m >= 6) return "🙂";
  if (m >= 4) return "😐";
  return "🙁";
}

function SectionTitle({ children }: any) {
  return <div style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 10px", letterSpacing: "-0.01em" }}>{children}</div>;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: "10px 13px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: accent || "var(--text)" }}>{value}</div>
    </div>
  );
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;
  const personId = Number(id);
  const p = Number.isFinite(personId) ? await getPersonCard(user.id, personId) : null;

  if (!p) {
    return (
      <div className="shell">
        <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
        <main className="main">
          <Link href="/people" style={{ color: "var(--accent)", fontSize: 13 }}>← {s.back}</Link>
          <div className="card" style={{ marginTop: 14 }}>{s.notFound}</div>
        </main>
      </div>
    );
  }

  const days = p.lastDate ? daysSince(p.lastDate) : null;
  const stale = days != null && days >= 14;
  const agoLabel = days == null ? "—" : days === 0 ? s.today : s.ago(days);
  const activePromises = p.promises.filter((x) => x.status === "active");
  const donePromises = p.promises.filter((x) => x.status !== "active");

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/people" style={{ color: "var(--accent)", fontSize: 13 }}>← {s.back}</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 4px" }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--surface-2)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 19, flexShrink: 0 }}>
            {p.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h1>
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
              {p.count} {s.mentions}{p.firstDate ? ` · ${s.knownSince} ${dateLabel(locale, p.firstDate)}` : ""}
            </div>
          </div>
        </div>

        {stale && (
          <div className="card" style={{ margin: "10px 0 4px", padding: "10px 13px", fontSize: 13.5, lineHeight: 1.45, borderLeft: "3px solid #ec4899" }}>
            {s.staleHint}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, margin: "12px 0 4px" }}>
          <Stat label={s.lastContact} value={agoLabel} accent={stale ? "#ec4899" : undefined} />
          {p.avgMood != null && <Stat label={s.avgMood} value={`${moodEmoji(p.avgMood)} ${p.avgMood}/10`} />}
          {p.deeds.length > 0 && <Stat label={s.deedsN} value={String(p.deeds.length)} />}
        </div>

        {(activePromises.length > 0 || donePromises.length > 0) && (
          <>
            <SectionTitle>🤝 {s.promises}</SectionTitle>
            <PromiseList promises={[...activePromises, ...donePromises] as any} locale={locale} />
          </>
        )}

        {p.deeds.length > 0 && (
          <>
            <SectionTitle>💛 {s.deeds}</SectionTitle>
            <div className="card">
              {p.deeds.map((d) => (
                <div key={d.id} style={{ fontSize: 13, lineHeight: 1.55, display: "flex", gap: 8, padding: "4px 0" }}>
                  <i className="ti ti-heart" style={{ fontSize: 15, color: "#ec4899", marginTop: 2, flexShrink: 0 }} />
                  <span>{d.text} <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>· {dateLabel(locale, d.created_at.slice(0, 10))}</span></span>
                </div>
              ))}
            </div>
          </>
        )}

        <SectionTitle>📝 {s.timeline}</SectionTitle>
        {p.entries.length === 0 ? (
          <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
        ) : (
          p.entries.map((e: any) => (
            <Link key={e.id} href={`/entry/${e.id}`} className="card" style={{ display: "block", marginBottom: 9 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 5 }}>
                {dateLabel(locale, e.entry_date)} · {(e.entry_time || "").slice(0, 5)}{e.mood != null ? ` · ${moodEmoji(e.mood)}` : ""}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{e.summary || e.raw_text}</div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
