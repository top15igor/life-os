import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import KnowledgeManager from "@/components/KnowledgeManager";
import { getSavedItems } from "@/lib/queries";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "База знаний", en: "Knowledge Base", uk: "База знань", fr: "Base de connaissances", es: "Base de conocimientos" };
const HINT: Record<string, string> = {
  ru: "Сохранённое из Instagram и YouTube, разобранное по темам. Пришли боту ссылку на пост, reels или видео — он добавит сюда.",
  en: "Your Instagram & YouTube saves, organized by topic. Send the bot a post, reel or video link — it lands here.",
  uk: "Збережене з Instagram і YouTube, розкладене за темами. Надішли боту посилання на пост, reels або відео.",
  fr: "Tes enregistrements Instagram & YouTube, classés par thème. Envoie un lien au bot — il atterrit ici.",
  es: "Tus guardados de Instagram y YouTube, organizados por tema. Envíale al bot un enlace de una publicación, reel o video — y llegará aquí.",
};
export default async function KnowledgePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const items = await getSavedItems(user.id);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main wide">
        <PageHead icon="ti-bookmarks" color="#6d5efc" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />

        <KnowledgeManager initial={items} locale={locale} />
      </main>
    </div>
  );
}
