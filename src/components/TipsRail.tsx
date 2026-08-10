import Link from "next/link";
import { cookies } from "next/headers";
import { tipsOfDay } from "@/lib/tips";
import { sectionTips, hasSectionTips } from "@/lib/sectionTips";
import { hints } from "@/lib/hints";
import { lifeCase } from "@/lib/cases";
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

export default async function TipsRail({ locale, section }: { locale: Locale; section?: string }) {
  // Выключено в Профиле — колонки нет вовсе.
  if ((await cookies()).get("tips")?.value === "off") return null;

  // Порядок в колонке: сначала «зачем это в жизни» (кейс), потом «что это»
  // (пояснение), потом общая подсказка. Чего нет — то пропускаем, и вместо
  // него добавляем ещё одну общую подсказку, чтобы колонка не пустовала.
  const kase = lifeCase(section, locale);
  const about = section ? hints(locale)[section] : undefined;
  // Подсказки — про ЭТОТ раздел. Общий набор берём только там, где своего нет
  // (служебные страницы), иначе на каждой странице висело бы одно и то же.
  const want = 4 + (kase ? 0 : 1) + (about ? 0 : 1);
  // Есть свои — показываем ТОЛЬКО их. Добивать общими нельзя: именно так на всех
  // страницах и оказывался один и тот же совет.
  const tips = hasSectionTips(section) ? sectionTips(section, locale, want) : tipsOfDay(locale, want, section);
  if (!tips.length && !about && !kase) return null;

  return (
    <aside className="tips-rail" aria-label={TITLE[locale] || TITLE.ru}>
      {kase && (
        <div className="tips-card tips-card-case">
          <div className="tips-case-emoji">{kase.emoji}</div>
          <div className="tips-card-text">{kase.text}</div>
        </div>
      )}
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
