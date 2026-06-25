import Sidebar from "@/components/Sidebar";
import PromiseList from "@/components/PromiseList";
import TraceDeeds from "@/components/TraceDeeds";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getGoodDeeds, getAllPromises, getRecentGratitude, getTraceWeek } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STR: Record<string, any> = {
  ru: { title: "Мой след", sub: "След, который ты оставляешь в мире: добрые дела, обещания людям, благодарность.", week: "За неделю", deedsW: "добрых дел", promW: "обещаний выполнено", gratW: "благодарности", deeds: "Добрые дела", promises: "Обещания людям", gratitude: "Благодарность", deedsEmpty: "Здесь будут твои добрые дела. Расскажи в записи, кому помог — даже мелочь оставляет след.", gratEmpty: "Пока пусто. Запиши, за что ты сегодня благодарен." },
  en: { title: "My Trace", sub: "The trace you leave in the world: good deeds, promises to people, gratitude.", week: "This week", deedsW: "good deeds", promW: "promises kept", gratW: "gratitudes", deeds: "Good deeds", promises: "Promises to people", gratitude: "Gratitude", deedsEmpty: "Your good deeds will appear here. Mention who you helped — even a small thing leaves a trace.", gratEmpty: "Empty for now. Write what you're grateful for today." },
  uk: { title: "Мій слід", sub: "Слід, який ти залишаєш у світі: добрі справи, обіцянки людям, вдячність.", week: "За тиждень", deedsW: "добрих справ", promW: "обіцянок виконано", gratW: "подяки", deeds: "Добрі справи", promises: "Обіцянки людям", gratitude: "Вдячність", deedsEmpty: "Тут будуть твої добрі справи. Згадай у записі, кому допоміг — навіть дрібниця лишає слід.", gratEmpty: "Поки порожньо. Запиши, за що ти сьогодні вдячний." },
  fr: { title: "Mon empreinte", sub: "L'empreinte que tu laisses dans le monde : bonnes actions, promesses, gratitude.", week: "Cette semaine", deedsW: "bonnes actions", promW: "promesses tenues", gratW: "gratitudes", deeds: "Bonnes actions", promises: "Promesses aux gens", gratitude: "Gratitude", deedsEmpty: "Tes bonnes actions apparaîtront ici. Dis qui tu as aidé — même un petit geste laisse une trace.", gratEmpty: "Vide pour l'instant. Écris ce dont tu es reconnaissant aujourd'hui." },
};

function SectionTitle({ children }: { children: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "26px 0 12px" }}>
      <span style={{ width: 4, height: 19, borderRadius: 2, background: "#ec4899" }} />
      <span style={{ fontSize: 17, fontWeight: 600 }}>{children}</span>
    </div>
  );
}

export default async function TracePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const s = STR[locale] || STR.ru;

  const [deeds, promises, gratitude, week] = await Promise.all([
    getGoodDeeds(user.id, 120),
    getAllPromises(user.id),
    getRecentGratitude(user.id, 40),
    getTraceWeek(user.id),
  ]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <i className="ti ti-heart-handshake" style={{ fontSize: 24, color: "#ec4899" }} />
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>{s.title}</h1>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>{s.sub}</p>

          <div className="card" style={{ background: "var(--surface-2)", border: "none" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 11 }}>{s.week}</div>
            <div style={{ display: "flex", gap: 22 }}>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{week.deeds}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.deedsW}</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{week.promisesDone}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.promW}</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{week.gratitude}</div><div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.gratW}</div></div>
            </div>
          </div>

          <SectionTitle>{s.deeds}</SectionTitle>
          <TraceDeeds deeds={deeds} locale={locale} emptyText={s.deedsEmpty} />

          <SectionTitle>{s.promises}</SectionTitle>
          <PromiseList promises={promises} locale={locale} full />

          <SectionTitle>{s.gratitude}</SectionTitle>
          {gratitude.length === 0 ? (
            <div className="card" style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{s.gratEmpty}</div>
          ) : (
            <div style={{ display: "grid", gap: 8, marginBottom: 30 }}>
              {gratitude.map((g: any, i: number) => (
                <div key={i} className="card" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14.5, lineHeight: 1.45 }}>{g.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
