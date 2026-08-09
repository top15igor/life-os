import Sidebar from "@/components/Sidebar";
import SortShelf from "@/components/SortShelf";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { listToSort, listRules } from "@/lib/sortShelf";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = { ru: "Разобрать", en: "Sort it out", uk: "Розібрати", fr: "À trier", es: "Por ordenar" };
const SUB: Record<string, string> = {
  ru: "Шкаф раскладывает вещи сам, но иногда сомневается. Здесь он честно показывает, где именно, — и одно нажатие всё решает. Твоя поправка становится правилом, поэтому список должен становиться короче сам.",
  en: "The wardrobe files things itself, but sometimes it isn't sure. Here it shows exactly where — one tap settles it. Your correction becomes a rule, so this list should shrink on its own.",
  uk: "Шафа розкладає речі сама, але іноді сумнівається. Тут вона чесно показує, де саме, — і одне натискання все вирішує. Твоя поправка стає правилом.",
  fr: "L'armoire range toute seule, mais doute parfois. Elle montre ici où exactement — un geste suffit. Ta correction devient une règle.",
  es: "El armario ordena solo, pero a veces duda. Aquí muestra dónde exactamente — un toque lo resuelve. Tu corrección se vuelve una regla.",
};

export default async function SortPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const [items, rules] = await Promise.all([listToSort(user.id), listRules(user.id)]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <i className="ti ti-inbox" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{TITLE[locale] || TITLE.ru}</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 16px" }}>{SUB[locale] || SUB.ru}</p>
          <SortShelf initial={items} rules={rules} locale={locale} />
        </div>
      </main>
    </div>
  );
}
