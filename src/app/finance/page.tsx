import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import FinanceTracker from "@/components/FinanceTracker";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { getFinanceData } from "@/lib/finance";
import type { Scope } from "@/lib/financeScope";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SCOPES: { key: Scope | "all"; ru: string; en: string; uk: string; fr: string; es: string }[] = [
  { key: "all", ru: "Всё", en: "All", uk: "Все", fr: "Tout", es: "Todo" },
  { key: "personal", ru: "Личное", en: "Personal", uk: "Особисте", fr: "Perso", es: "Personal" },
  { key: "business", ru: "Бизнес", en: "Business", uk: "Бізнес", fr: "Pro", es: "Negocio" },
  { key: "transfer", ru: "Переводы", en: "Transfers", uk: "Перекази", fr: "Virements", es: "Transferencias" },
];

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ m?: string; scope?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const view = (["personal", "business", "transfer", "all"].includes(sp.scope || "") ? sp.scope : "all") as Scope | "all";
  const data = await getFinanceData(user.id, sp.m, view);
  const lc = (locale === "uk" ? "uk" : locale === "fr" ? "fr" : locale === "en" ? "en" : locale === "es" ? "es" : "ru") as "ru" | "en" | "uk" | "fr" | "es";

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-wallet" color="#10b981" title={t.nav.finance} hint={h.finance} />
        <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "var(--surface-2)", borderRadius: 12, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
          {SCOPES.map((s) => {
            const active = s.key === view;
            const qs = new URLSearchParams();
            if (sp.m) qs.set("m", sp.m);
            qs.set("scope", s.key);
            return (
              <Link
                key={s.key}
                href={`/finance?${qs.toString()}`}
                style={{ fontSize: 13.5, fontWeight: 500, padding: "7px 14px", borderRadius: 9, textDecoration: "none", background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)" }}
              >
                {s[lc]}
              </Link>
            );
          })}
        </div>
        <FinanceTracker data={data} locale={locale} />
      </main>
    </div>
  );
}
