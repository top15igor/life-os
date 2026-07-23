import Link from "next/link";
import { getPublicPath, getPathPages } from "@/lib/paths";
import { getInviteCode } from "@/lib/users";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

const ACCENTS: Record<string, [string, string]> = { indigo: ["#4f46e5", "#7c6ff0"], green: ["#0f9d6e", "#34d399"], amber: ["#c2620a", "#f59e0b"], pink: ["#be1d6a", "#f472b6"], dark: ["#111827", "#374151"] };

const STR: Record<string, any> = {
  ru: { by: "Путь", pages: "страниц", active: "Иду", done: "Пройден", empty: "В этом пути пока нет публичных страниц.", cta: "Завести свой дневник", ctaSub: "Бесплатно. Веди свои пути и делись прогрессом.", notFound: "Такого пути нет или он скрыт.", months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"] },
  en: { by: "Path", pages: "pages", active: "Ongoing", done: "Completed", empty: "No public pages in this path yet.", cta: "Start your own diary", ctaSub: "Free. Keep your paths and share progress.", notFound: "No such path, or it's hidden.", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
  uk: { by: "Шлях", pages: "сторінок", active: "Іду", done: "Пройдено", empty: "У цьому шляху поки немає публічних сторінок.", cta: "Завести свій щоденник", ctaSub: "Безкоштовно. Веди свої шляхи й ділись прогресом.", notFound: "Такого шляху немає або він прихований.", months: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"] },
  fr: { by: "Chemin", pages: "pages", active: "En cours", done: "Terminé", empty: "Pas encore de pages publiques dans ce chemin.", cta: "Créer ton journal", ctaSub: "Gratuit. Suis tes chemins et partage tes progrès.", notFound: "Ce chemin n'existe pas ou est masqué.", months: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."] },
  es: { by: "Camino", pages: "páginas", active: "En curso", done: "Completado", empty: "Todavía no hay páginas públicas en este camino.", cta: "Crea tu propio diario", ctaSub: "Gratis. Lleva tus caminos y comparte tu progreso.", notFound: "Ese camino no existe o está oculto.", months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] },
};

export default async function PublicPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const s = STR[locale] || STR.ru;
  const path = await getPublicPath(id);

  if (!path) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "var(--text-2)", fontSize: 15 }}>{s.notFound}</div>;
  }

  const [c1, c2] = ACCENTS[path.accent] || ACCENTS.indigo;
  const pages = await getPathPages(id);
  const inviteCode = await getInviteCode(path.userId);
  const fmt = (iso: string) => { const [y, m, d] = (iso || "").slice(0, 10).split("-"); return m ? `${Number(d)} ${s.months[Number(m) - 1]} ${y}` : iso; };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", justifyContent: "center", padding: "0 0 40px" }}>
      <div style={{ width: "100%", maxWidth: 620 }}>
        {/* Герой */}
        <div style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, padding: "46px 24px 34px", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{path.emoji || "🌱"}</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 12 }}>{path.title}</div>
          {path.description && <div style={{ fontSize: 15, opacity: 0.92, marginTop: 8, lineHeight: 1.55, maxWidth: 460, margin: "8px auto 0" }}>{path.description}</div>}
          <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 12, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <span>{path.name}</span>
            <span>{path.status === "done" ? "✓ " + s.done : s.active}</span>
            <span>{pages.length} {s.pages}</span>
          </div>
        </div>

        <div style={{ padding: "26px 20px 0" }}>
          {pages.length === 0 ? (
            <div className="card" style={{ color: "var(--text-2)", fontSize: 14 }}>{s.empty}</div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 26 }}>
              {/* вертикальная линия таймлайна */}
              <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: "var(--border)" }} />
              {pages.map((pg) => (
                <div key={pg.id} style={{ position: "relative", marginBottom: 18 }}>
                  <span style={{ position: "absolute", left: -26, top: 4, width: 16, height: 16, borderRadius: 99, background: c1, border: "3px solid var(--bg)" }} />
                  <div className="card">
                    {pg.title && <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 5 }}>{pg.title}</div>}
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{pg.text}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>{fmt(pg.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link href={`/i/${inviteCode}`} style={{ display: "block", background: "var(--accent)", color: "#fff", textAlign: "center", padding: "14px", borderRadius: 13, fontSize: 15.5, fontWeight: 600, textDecoration: "none", marginTop: 24 }}>{s.cta}</Link>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-3)", marginTop: 8 }}>{s.ctaSub}</div>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 24 }}><span style={{ fontWeight: 700, letterSpacing: 1 }}>LIFE OS</span></div>
        </div>
      </div>
    </div>
  );
}
