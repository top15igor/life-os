import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import KnowledgeGrid from "@/components/KnowledgeGrid";
import { getSavedItems } from "@/lib/queries";
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

export default async function KnowledgePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const items = await getSavedItems(user.id);

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
          <KnowledgeGrid items={items} locale={locale} />
        )}
      </main>
    </div>
  );
}
