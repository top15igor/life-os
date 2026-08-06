import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AdminQuestions from "@/components/AdminQuestions";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { questionStats } from "@/lib/questionCoach";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

async function load() {
  const db = supabaseAdmin();
  let candidates: any[] = [], bank: any[] = [];
  try {
    const { data } = await db.from("question_candidates").select("id, theme, text, reason, replaces, created_at")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(50);
    candidates = data || [];
  } catch { /* нет таблицы — пусто */ }
  try {
    const { data } = await db.from("question_bank").select("id, lang, theme, text, source, active")
      .order("created_at", { ascending: false }).limit(200);
    bank = data || [];
  } catch { /* нет таблицы — пусто */ }
  const stats = await questionStats(60);
  return { candidates, bank, stats };
}

export default async function AdminQuestionsPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const { candidates, bank, stats } = await load();

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: 13 }}>← Admin</Link>
        <div style={{ fontSize: 19, fontWeight: 500, margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-message-question" style={{ color: "var(--accent)" }} />Вопросы бота
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.5 }}>
          Агент каждую неделю смотрит, на какие вечерние вопросы люди отвечают, а какие пролистывают, и предлагает правки.
          К людям ничего не уходит без твоего одобрения. Агент видит только сам вопрос и цифры отклика — записи людей он не читает.
        </div>
        <AdminQuestions candidates={candidates as any} bank={bank as any} stats={stats as any} />
      </main>
    </div>
  );
}
