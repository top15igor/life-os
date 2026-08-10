import Link from "next/link";
import { tipsOfDay } from "@/lib/tips";
import { hints } from "@/lib/hints";
import type { Locale } from "@/lib/i18n";

// Правая колонка с подсказками — на всех разделах приложения.
//
// Показывается ТОЛЬКО когда справа реально остаётся пустое место: боковое меню
// (220px) плюс контент (максимум 1200px) занимают 1420px, поэтому колонка
// включается с 1700px — там её 260px помещаются, не поджимая контент.
// Порог живёт в globals.css (.tips-rail): чистый CSS, без мигания при загрузке.

const ABOUT: Record<string, string> = {
  ru: "Об этом разделе",
  en: "About this section",
  uk: "Про цей розділ",
  fr: "À propos de cette section",
  es: "Sobre esta sección",
};

const TITLE: Record<string, string> = {
  ru: "Попробуй",
  en: "Try this",
  uk: "Спробуй",
  fr: "Essaie",
  es: "Prueba esto",
};

export default function TipsRail({ locale, section }: { locale: Locale; section?: string }) {
  // Пояснение к разделу + общие подсказки. Если у раздела пояснения нет —
  // показываем на одну общую подсказку больше, чтобы колонка не пустовала.
  const about = section ? hints(locale)[section] : undefined;
  const tips = tipsOfDay(locale, about ? 2 : 3);
  if (!tips.length && !about) return null;

  return (
    <aside className="tips-rail" aria-label={TITLE[locale] || TITLE.ru}>
      {about && (
        <div className="tips-card tips-card-about">
          <div className="tips-card-head">
            <i className="ti ti-info-circle" />
            <span>{ABOUT[locale] || ABOUT.ru}</span>
          </div>
          <div className="tips-card-text">{about}</div>
        </div>
      )}
      <div className="tips-rail-title">{TITLE[locale] || TITLE.ru}</div>
      {tips.map((t, i) => {
        const body = (
          <>
            <div className="tips-card-head">
              <i className={`ti ${t.icon}`} />
              <span>{t.title}</span>
            </div>
            <div className="tips-card-text">{t.text}</div>
          </>
        );
        return t.href ? (
          <Link key={i} href={t.href} className="tips-card">{body}</Link>
        ) : (
          <div key={i} className="tips-card">{body}</div>
        );
      })}
    </aside>
  );
}
