import Link from "next/link";
import { CopyLink } from "@/components/ProfileActions";
import RelayButton from "@/components/RelayButton";
import type { ReferralTree, RefNode, RefActivity, ReferralStatus } from "@/lib/referral";

// Локализованные подписи. UK берёт RU-словарь как ближайший, FR — EN (как на других страницах).
const STR: Record<string, any> = {
  ru: {
    title: "Мои приглашённые",
    sub: "Кого ты привёл в LIFE OS — и кого пригласили они. Видно только тебе.",
    direct: "Приглашено напрямую",
    network: "Вся сеть",
    active: "Активных",
    invited: "пригласил",
    entries: "записей",
    joinedNever: "ещё не писал(а)",
    inviteT: "Твоя ссылка-приглашение",
    inviteS: "Поделись ею — кто заведёт дневник по ней, появится здесь, в твоём дереве.",
    emptyT: "Пока никого",
    emptyS: "Ты ещё никого не пригласил. Поделись своей ссылкой — и здесь вырастет твоё дерево: друзья, и те, кого пригласят уже они.",
    rewardA: "Активных друзей",
    rewardB: "до бесплатной книги",
    rewardDone: "Бесплатная книга уже доступна — оформи в Книге жизни!",
    capped: "Сеть большая — показана верхняя часть.",
    act: { active: "активно пишет", warm: "пишет иногда", started: "давно не заходил(а)", idle: "ещё не писал(а)" },
    legend: "Активность",
  },
  en: {
    title: "People you invited",
    sub: "Who you brought to LIFE OS — and who they invited. Visible only to you.",
    direct: "Invited directly",
    network: "Whole network",
    active: "Active",
    invited: "invited",
    entries: "entries",
    joinedNever: "no entries yet",
    inviteT: "Your invite link",
    inviteS: "Share it — anyone who starts a diary through it shows up here, in your tree.",
    emptyT: "No one yet",
    emptyS: "You haven't invited anyone yet. Share your link — your tree will grow here: friends, and whoever they invite next.",
    rewardA: "Active friends",
    rewardB: "to a free book",
    rewardDone: "A free book is already available — claim it in your Book of Life!",
    capped: "Big network — showing the top part.",
    act: { active: "writes actively", warm: "writes sometimes", started: "away for a while", idle: "no entries yet" },
    legend: "Activity",
  },
};

const ACT: Record<RefActivity, { color: string; bg: string }> = {
  active: { color: "var(--positive)", bg: "color-mix(in srgb, var(--positive) 14%, transparent)" },
  warm: { color: "var(--accent)", bg: "var(--accent-bg)" },
  started: { color: "#f59e0b", bg: "#f59e0b14" },
  idle: { color: "var(--text-3)", bg: "var(--surface-2)" },
};

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  try {
    const map: Record<string, string> = { ru: "ru-RU", uk: "uk-UA", en: "en-US", fr: "fr-FR" };
    return new Date(iso).toLocaleDateString(map[locale] || "en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function Node({ node, s, locale, last }: { node: RefNode; s: any; locale: string; last: boolean }) {
  const a = ACT[node.activity];
  const initial = (node.name || "?").trim().charAt(0).toUpperCase() || "?";
  const kids = node.children.length;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0" }}>
        <span
          style={{
            width: 38, height: 38, flexShrink: 0, borderRadius: 99, background: a.bg, color: a.color,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600,
            border: `1.5px solid ${a.color}`,
          }}
        >
          {initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {node.name}
            {kids > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <i className="ti ti-users" style={{ fontSize: 13 }} />{kids} {s.invited}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 9, marginTop: 1, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <i className="ti ti-pencil" style={{ fontSize: 12.5 }} />{node.entries} {s.entries}
            </span>
            {node.joined && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <i className="ti ti-calendar" style={{ fontSize: 12.5 }} />{fmtDate(node.joined, locale)}
              </span>
            )}
          </div>
          {node.entries > 0 && <RelayButton targetId={node.id} locale={locale} />}
        </div>
        <span
          style={{
            fontSize: 11, fontWeight: 600, color: a.color, background: a.bg, border: `1px solid ${a.color}`,
            padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {s.act[node.activity]}
        </span>
      </div>
      {kids > 0 && (
        <div style={{ marginLeft: 18, paddingLeft: 16, borderLeft: "2px solid var(--border)" }}>
          {node.children.map((c, i) => (
            <Node key={c.id} node={c} s={s} locale={locale} last={i === node.children.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferralTreeView({
  locale, tree, status, inviteLink,
}: {
  locale: string;
  tree: ReferralTree;
  status: ReferralStatus;
  inviteLink: string;
}) {
  const s = STR[locale] || (locale === "uk" ? STR.ru : locale === "fr" ? STR.en : STR.ru);
  const stat = (val: number, label: string, color: string) => (
    <div className="card" style={{ flex: 1, minWidth: 92, textAlign: "center", padding: "13px 8px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
        <i className="ti ti-affiliate" style={{ fontSize: 26, color: "var(--accent)" }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{s.title}</h1>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 18, lineHeight: 1.5 }}>{s.sub}</div>

      {/* Сводка */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {stat(tree.direct, s.direct, "var(--accent)")}
        {stat(tree.network, s.network, "var(--text)")}
        {stat(tree.active, s.active, "var(--positive)")}
      </div>

      {/* Прогресс к бесплатной книге (если есть приглашённые) */}
      {tree.direct > 0 && (
        <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid #f59e0b55", background: "#f59e0b0d" }}>
          <i className="ti ti-book" style={{ fontSize: 22, color: "#f59e0b", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.45 }}>
            {status.available > 0 ? (
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{s.rewardDone}</span>
            ) : (
              <>
                <b style={{ color: "var(--text)" }}>{status.active}</b> {s.rewardA} · {s.rewardB}:{" "}
                <b style={{ color: "#f59e0b" }}>{status.toNext}</b>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ссылка-приглашение */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{s.inviteT}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 11, lineHeight: 1.5 }}>{s.inviteS}</div>
        <CopyLink link={inviteLink} locale={locale} />
      </div>

      {/* Дерево или пустое состояние */}
      {tree.nodes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "28px 18px" }}>
          <i className="ti ti-users-plus" style={{ fontSize: 34, color: "var(--text-3)" }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, margin: "10px 0 6px" }}>{s.emptyT}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, maxWidth: 380, margin: "0 auto" }}>{s.emptyS}</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {tree.nodes.map((n, i) => (
              <Node key={n.id} node={n} s={s} locale={locale} last={i === tree.nodes.length - 1} />
            ))}
          </div>
          {tree.capped && (
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8, textAlign: "center" }}>{s.capped}</div>
          )}
          {/* Легенда активности */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 14, fontSize: 11.5, color: "var(--text-2)" }}>
            {(["active", "warm", "started", "idle"] as RefActivity[]).map((k) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: ACT[k].color, display: "inline-block" }} />
                {s.act[k]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
