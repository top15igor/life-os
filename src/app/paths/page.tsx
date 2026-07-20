import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import PathsView from "@/components/PathsView";
import { getPaths } from "@/lib/paths";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Мои пути", en: "My paths", uk: "Мої шляхи", fr: "Mes chemins" };
const HINT: Record<string, string> = {
  ru: "Путь — длинная история жизни («Восстановление здоровья», «Запуск проекта»). Группируй в него опубликованные страницы — получается публичный таймлайн твоего прогресса.",
  en: "A path is a long life story (“Restoring health”, “Launching a project”). Group published pages into it — a public timeline of your progress.",
  uk: "Шлях — довга історія життя. Групуй у нього опубліковані сторінки — публічний таймлайн твого прогресу.",
  fr: "Un chemin est une longue histoire de vie. Regroupes-y tes pages publiées — une frise publique de ta progression.",
};

export default async function PathsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const paths = await getPaths(user.id);
  const host = (await headers()).get("host") || "life-os.today";

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-route" color="#4f46e5" title={TITLE[locale] || TITLE.ru} hint={HINT[locale] || HINT.ru} />
        <PathsView paths={paths} host={host} locale={locale} />
      </main>
    </div>
  );
}
