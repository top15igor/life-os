import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Готовые тексты для лендинга, постов и рекламы — копируй и вставляй.
const POST = `🪷 LIFE OS — CRM твоей жизни

Ты просто рассказываешь боту, как прошёл день — голосом или текстом. А дальше он сам:
📖 разбирает и раскладывает по полочкам
🤖 помнит всё и отвечает на вопросы о твоей жизни
📚 собирает из этого твою Книгу жизни

Дневник, цели, деньги, здоровье, люди, память — всё в одном месте. Плюс капсулы времени и воспоминания «в этот день».

Это путь к маленькому бессмертию — по одной записи в день.
👉 life-os.today`;

const TAGLINES = [
  "Ты живёшь — я запоминаю. LIFE OS: CRM твоей жизни и твоя Книга жизни.",
  "Дневник, который ведёт себя сам. И однажды станет книгой, которую прочтут твои дети.",
  "Твоя жизнь, собранная в одном месте — и сохранённая навсегда.",
];

const HERO_TITLE = "Твоя жизнь заслуживает быть сохранённой";
const HERO_SUB = "Ты просто говоришь, как прошёл день. AI расшифровывает, понимает и собирает из этого твою историю: дневник, Книгу жизни, цели, здоровье, людей и места. Без дисциплины и таблиц — только расскажи.";

const WHY = [
  ["Мы почти ничего не помним", "Через год ты не вспомнишь, каким был этот месяц. LIFE OS сохраняет не фото, а тебя — мысли, решения, моменты."],
  ["Ноль трения", "Ничего не заполнять и не систематизировать. Ты говоришь — AI делает остальное."],
  ["Путь к бессмертию", "Каждый день — ещё одна страница, которая не исчезнет. То, что останется тем, кто будет после."],
];

const FINAL = "Начни первую страницу своей Книги жизни.\nБесплатно. Через Google или почту — за минуту.";

function Block({ title, hint, text }: { title: string; hint?: string; text: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: hint ? 2 : 8 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>{hint}</div>}
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.6, color: "var(--text)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px", margin: 0 }}>{text}</pre>
    </div>
  );
}

export default async function AdminCopyPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");
  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <i className="ti ti-writing" style={{ fontSize: 22, color: "var(--accent)" }} />
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Тексты для лендинга и постов</h1>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>Готовые тексты — копируй и вставляй.</span>
          <Link href="/admin/marketing" style={{ color: "var(--accent)" }}>← к Маркетингу</Link>
          <Link href="/features" style={{ color: "var(--accent)" }}>Открыть /features →</Link>
        </div>

        <div className="card" style={{ padding: "16px 18px" }}>
          <Block title="🔹 Короткий пост" hint="Для соцсетей и Telegram-канала" text={POST} />
          <Block title="🔹 Одной строкой" hint="Для шапки профиля или рекламы" text={TAGLINES.map((x) => `• ${x}`).join("\n")} />
          <Block title="🔹 Заголовок лендинга (hero)" text={`${HERO_TITLE}\n\n${HERO_SUB}\n\n[Создать аккаунт]   [Открыть в Telegram]`} />
          <Block title="🔹 Три буллета «почему это»" hint="Под hero" text={WHY.map(([h, d]) => `${h}\n${d}`).join("\n\n")} />
          <Block title="🔹 Финальный призыв" text={FINAL} />
        </div>
      </main>
    </div>
  );
}
