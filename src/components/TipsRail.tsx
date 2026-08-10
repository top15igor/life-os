import Link from "next/link";
import { tipsOfDay } from "@/lib/tips";
import type { Locale } from "@/lib/i18n";

// Правая колонка с подсказками на «Сегодня».
//
// Показывается ТОЛЬКО когда справа реально остаётся пустое место: боковое меню
// (220px) плюс контент (максимум 1200px) занимают 1420px, поэтому колонка
// включается с 1760px — там её 280px помещаются, не поджимая контент.
// Порог живёт в globals.css (.tips-rail): чистый CSS, без мигания при загрузке.

const TITLE: Record<string, string> = {
  ru: "Попробуй",
  en: "Try this",
  uk: "Спробуй",
  fr: "Essaie",
  es: "Prueba esto",
};

export default function TipsRail({ locale }: { locale: Locale }) {
  const tips = tipsOfDay(locale);
  if (!tips.length) return null;

  return (
    <aside className="tips-rail" aria-label={TITLE[locale] || TITLE.ru}>
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
