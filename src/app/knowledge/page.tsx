import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import { getSavedItems, type SavedItem } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "База знаний", en: "Knowledge Base", uk: "База знань", fr: "Base de connaissances" };
const HINT: Record<string, string> = {
  ru: "Сохранённое из Instagram, разобранное по темам. Пришли боту ссылку на пост или reels — он добавит сюда.",
  en: "Your Instagram saves, organized by topic. Send the bot a post or reel link — it lands here.",
  uk: "Збережене з Instagram, розкладене за темами. Надішли боту посилання на пост або reels.",
  fr: "Tes enregistrements Instagram, classés par thème. Envoie un lien au bot — il atterrit ici.",
};
const EMPTY: Record<string, string> = {
  ru: "Пока пусто. Открой в Instagram сохранённый пост или reels → «Поделиться» → «Копировать ссылку» → пришли её боту в Telegram.",
  en: "Empty for now. In Instagram open a saved post or reel → Share → Copy link → send it to the bot in Telegram.",
  uk: "Поки порожньо. Відкрий збережений пост або reels в Instagram → «Поділитися» → «Скопіювати посилання» → надішли боту.",
  fr: "Vide pour l'instant. Dans Instagram, ouvre un post enregistré → Partager → Copier le lien → envoie-le au bot.",
};

function groupByTopic(items: SavedItem[]): [string, SavedItem[]][] {
  const map = new Map<string, SavedItem[]>();
  for (const it of items) {
    const k = (it.topic || "—").trim() || "—";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default async function KnowledgePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const items = await getSavedItems(user.id);
  const groups = groupByTopic(items);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-bookmarks" color="#6d5efc" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />

        {items.length === 0 ? (
          <div style={{ padding: 28, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", color: "var(--muted)", maxWidth: 640, lineHeight: 1.6 }}>
            {EMPTY[locale] || EMPTY.ru}
          </div>
        ) : (
          groups.map(([topic, list]) => (
            <section key={topic} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-folder" style={{ color: "#6d5efc" }} /> {topic}
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {list.length}</span>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {list.map((it) => (
                  <article key={it.id} style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt="" style={{ width: "100%", height: 150, objectFit: "cover" }} />
                    ) : null}
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                        <i className={`ti ${it.kind === "reel" ? "ti-video" : "ti-photo"}`} />
                        <span>{it.kind === "reel" ? "Reels" : "Instagram"}</span>
                        {it.author ? <span>· {it.author}</span> : null}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35 }}>{it.title}</div>
                      {it.summary ? <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{it.summary}</div> : null}
                      {it.key_points?.length ? (
                        <ul style={{ margin: "2px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
                          {it.key_points.slice(0, 4).map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      ) : null}
                      {it.tags?.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                          {it.tags.slice(0, 6).map((tg, i) => (
                            <span key={i} style={{ fontSize: 11, color: "#6d5efc", background: "rgba(109,94,252,.1)", borderRadius: 8, padding: "2px 8px" }}>#{tg.replace(/\s+/g, "_")}</span>
                          ))}
                        </div>
                      ) : null}
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-external-link" /> Instagram
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
