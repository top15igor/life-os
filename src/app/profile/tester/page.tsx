import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import TesterToggle from "@/components/TesterToggle";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const TIERS = [
  { amt: "$5", t: "Мелкая ошибка", d: "опечатка, косметика, мелкий сбой", c: "#b7791f" },
  { amt: "$10", t: "Баг или неверная запись", d: "не работает, нелогичный ответ AI, бот не то записал", c: "var(--accent)" },
  { amt: "$100", t: "Бонус за месяц", d: "активное тестирование, ~10 записей в день (пропуск дня не сжигает)", c: "#0e9f6e" },
];

export default async function TesterPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  let tester = false;
  try {
    const { data } = await supabaseAdmin().from("users").select("tester").eq("id", user.id).maybeSingle();
    tester = !!(data as any)?.tester;
  } catch {}

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 640 }}>
          <Link href="/profile" className="app-back" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />Профиль
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <i className="ti ti-bug" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Тестировщик</h1>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 18 }}>
            Помогаешь делать LIFE OS лучше — и получаешь за это. Ниже условия; полная памятка — по кнопке.
          </div>

          <TesterToggle initial={tester} />

          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", margin: "22px 2px 10px" }}>Оплата</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map((tr) => (
              <div key={tr.amt} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: tr.c, fontVariantNumeric: "tabular-nums", minWidth: 58 }}>{tr.amt}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{tr.t}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>{tr.d}</div>
                </div>
              </div>
            ))}
          </div>

          <a href="/tester.html" target="_blank" rel="noopener" className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "13px 15px", textDecoration: "none", color: "var(--text)" }}>
            <i className="ti ti-book" style={{ fontSize: 20, color: "var(--accent)" }} />
            <span style={{ fontWeight: 600, fontSize: 14.5, flex: 1 }}>Полная памятка тестировщика</span>
            <i className="ti ti-external-link" style={{ fontSize: 17, color: "var(--text-3)" }} />
          </a>
        </div>
      </main>
    </div>
  );
}
