import Link from "next/link";
import { getPublicBySlug, getPublicStats } from "@/lib/public";
import { getPublicPages } from "@/lib/publish";
import { getHandle } from "@/lib/handle";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { lblEntries: "Записи", lblDays: "Дней в дневнике", lblVoice: "Голосовые", lblDeeds: "Добрые дела", lblDreams: "Мечты сбылись", lblStreak: "Дней подряд", since: "В LIFE OS с", tagline: "Записываю свою жизнь во времени", cta: "Завести свой дневник", ctaSub: "Бесплатно. Наговариваешь день голосом — AI всё раскладывает.", notFound: "Такой страницы нет или она скрыта.", months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"] },
  en: { lblEntries: "Entries", lblDays: "Days journaled", lblVoice: "Voice notes", lblDeeds: "Good deeds", lblDreams: "Dreams come true", lblStreak: "Day streak", since: "On LIFE OS since", tagline: "Capturing my life over time", cta: "Start your own diary", ctaSub: "Free. Just talk through your day — AI sorts it all out.", notFound: "No such page, or it's hidden.", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
  uk: { lblEntries: "Записи", lblDays: "Днів у щоденнику", lblVoice: "Голосові", lblDeeds: "Добрі справи", lblDreams: "Мрії збулися", lblStreak: "Днів поспіль", since: "У LIFE OS з", tagline: "Записую своє життя у часі", cta: "Завести свій щоденник", ctaSub: "Безкоштовно. Наговорюєш день голосом — AI усе розкладає.", notFound: "Такої сторінки немає або вона прихована.", months: ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"] },
  fr: { lblEntries: "Entrées", lblDays: "Jours journalisés", lblVoice: "Vocaux", lblDeeds: "Bonnes actions", lblDreams: "Rêves réalisés", lblStreak: "Jours d'affilée", since: "Sur LIFE OS depuis", tagline: "Je capture ma vie dans le temps", cta: "Créer ton journal", ctaSub: "Gratuit. Raconte ta journée à la voix — l'IA range tout.", notFound: "Cette page n'existe pas ou est masquée.", months: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."] },
};

function Tile({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? "rgba(255,255,255,.16)" : "var(--surface)", border: accent ? "none" : "1px solid var(--border)", borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: accent ? "#fff" : "var(--text)", lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12.5, color: accent ? "rgba(255,255,255,.85)" : "var(--text-2)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const s = STR[locale] || STR.ru;
  const prof = await getPublicBySlug(slug);

  if (!prof) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "var(--text-2)", fontSize: 15 }}>
        {s.notFound}
      </div>
    );
  }

  const st = await getPublicStats(prof.userId);
  const inviteCode = await getHandle(prof.userId, prof.name);
  const pages = await getPublicPages(prof.userId);
  const blocks = new Set(prof.blocks);
  const bookTitle = locale === "en" ? "Public book" : locale === "fr" ? "Livre public" : locale === "uk" ? "Публічна книга" : "Публичная книга";
  const sinceStr = st.memberSince ? (() => { const [y, m] = st.memberSince!.split("-"); return `${s.since} ${s.months[Number(m) - 1]} ${y}`; })() : "";
  const initial = (prof.name || "?").trim().charAt(0).toUpperCase() || "?";

  // Тайлы: записи и дни всегда (постоянство); ниже — смысловые жизненные блоки.
  const extra: { n: number; label: string }[] = [];
  if (blocks.has("deeds") && st.deeds > 0) extra.push({ n: st.deeds, label: s.lblDeeds });
  if (blocks.has("dreams") && st.dreamsDone > 0) extra.push({ n: st.dreamsDone, label: s.lblDreams });
  if (blocks.has("streak") && st.streak > 1) extra.push({ n: st.streak, label: s.lblStreak });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", justifyContent: "center", padding: "0 0 40px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Герой */}
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c6ff0)", padding: "44px 24px 30px", color: "#fff", textAlign: "center" }}>
          <span style={{ width: 72, height: 72, borderRadius: 99, background: "rgba(255,255,255,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700 }}>{initial}</span>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>{prof.name || "—"}</div>
          {prof.bio && <div style={{ fontSize: 14.5, opacity: 0.92, marginTop: 6, lineHeight: 1.5, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{prof.bio}</div>}
          {sinceStr && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>{sinceStr}</div>}
          {/* верхние тайлы — на градиенте */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 22, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
            <Tile n={st.entries} label={s.lblEntries} accent />
            <Tile n={st.days} label={s.lblDays} accent />
          </div>
        </div>

        <div style={{ padding: "18px 16px 0" }}>
          {extra.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 18 }}>
              {extra.map((t, i) => <Tile key={i} n={t.n} label={t.label} />)}
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-2)", margin: "8px 0 22px", fontStyle: "italic" }}>
            «{s.tagline}»
          </div>

          {/* Публичная книга — опубликованные страницы */}
          {pages.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <i className="ti ti-book-2" style={{ fontSize: 16, color: "var(--accent)" }} />{bookTitle}
              </div>
              {pages.map((pg) => (
                <div key={pg.id} className="card" style={{ marginBottom: 10 }}>
                  {pg.title && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>{pg.title}</div>}
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>{pg.text}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>{(() => { const d = (pg.created_at || "").slice(0, 10); const [yy, mm, dd] = d.split("-"); return mm ? `${Number(dd)} ${s.months[Number(mm) - 1]} ${yy}` : d; })()}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link href={`/i/${inviteCode}`} style={{ display: "block", background: "var(--accent)", color: "#fff", textAlign: "center", padding: "14px", borderRadius: 13, fontSize: 15.5, fontWeight: 600, textDecoration: "none" }}>
            {s.cta}
          </Link>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-3)", marginTop: 8 }}>{s.ctaSub}</div>

          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", marginTop: 26 }}>
            <span style={{ fontWeight: 700, letterSpacing: 1 }}>LIFE OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
