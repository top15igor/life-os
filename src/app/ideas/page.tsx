import Sidebar from "@/components/Sidebar";
import IdeasBoard from "@/components/IdeasBoard";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { listIdeas } from "@/lib/ideas";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

export default async function IdeasPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const owner = user.id === OWNER;
  const ideas = await listIdeas(user.id, owner);

  let authors: Record<string, string> = {};
  if (owner && ideas.length) {
    try {
      const { data } = await supabaseAdmin().from("users").select("id, name").in("id", [...new Set(ideas.map((i) => i.user_id))]);
      for (const u of ((data as any[]) || [])) authors[String(u.id)] = String(u.name || "");
    } catch {
      /* без имён обойдёмся */
    }
  }

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
            <i className="ti ti-bulb" style={{ fontSize: 24, color: "var(--accent)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Идеи</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
            {owner
              ? "Предложения от тех, кто пользуется LIFE OS. Каждая прошла обсуждение с ботом, поэтому это постановка, а не реплика. Меняешь статус — автор сразу узнаёт об этом сам."
              : "Твои предложения по LIFE OS и что с ними стало. Расскажи боту «идея по LIFE OS» своими словами — он расспросит, доведёт до постановки и передаст. О решении сообщит сам, следить не нужно."}
          </p>
          <IdeasBoard initial={ideas} owner={owner} authors={authors} />
        </div>
      </main>
    </div>
  );
}
