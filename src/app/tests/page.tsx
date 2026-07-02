import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Link from "next/link";
import TesterReport from "@/components/TesterReport";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
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
        <PageHead icon="ti-checklist" color="#0e9f6e" title="Тесты" />
        {tester ? (
          <TesterReport />
        ) : (
          <div className="card" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 15, marginBottom: 6 }}>Режим тестировщика выключен.</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 12 }}>Включи его, чтобы сдавать ежедневные отчёты.</div>
            <Link href="/profile/tester" style={{ fontSize: 14, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Профиль → Тестировщик →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
