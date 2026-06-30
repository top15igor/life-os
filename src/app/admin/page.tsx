import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AdminUsersTable from "@/components/AdminUsersTable";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getAdminData } from "@/lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Каждый тип расхода — человеческим языком: что это и когда тратятся деньги.
const KIND_INFO: Record<string, { label: string; desc: string }> = {
  analyze: { label: "Разбор записей", desc: "AI читает каждую запись и раскладывает по категориям, тегам, настроению, задачам. Тратится на КАЖДУЮ запись." },
  transcribe: { label: "Голос → текст (Whisper)", desc: "Расшифровка голосовых сообщений. Тратится на каждое голосовое." },
  companion: { label: "AI-друг (беседа)", desc: "Живой чат с ботом и на сайте — каждый ответ друга, иногда с поиском в интернете." },
  biographer: { label: "Биограф", desc: "Ответы на вопросы о твоей жизни (раздел «Биограф» и вопросы боту)." },
  intelligence: { label: "Связи записей", desc: "AI ищет причины, последствия и связи записи с другими — на экране записи." },
  overview: { label: "Аналитика / Зеркало", desc: "Ежедневный разбор всего архива для «Что заметил AI». Самый тяжёлый проход." },
  saved: { label: "База знаний (ссылки)", desc: "Разбор постов Instagram/YouTube/TikTok, которые кидают боту." },
  "finance-coach": { label: "Финансовый разбор", desc: "Советы и разбор в разделе «Деньги»." },
  vision: { label: "Распознавание фото", desc: "AI понимает фото для «Визуальной памяти»." },
  vision_doc: { label: "Распознавание документов", desc: "AI читает документы и PDF в «Память»." },
  health_focus: { label: "Здоровье сейчас", desc: "Дневной AI-вывод о здоровье на вкладке «Здоровье»." },
  morning: { label: "Утренний пуш", desc: "Тёплое утреннее сообщение в боте." },
  evening: { label: "Вечерний пуш", desc: "Вечернее напоминание или вопрос для книги." },
  publish: { label: "Публичная версия записи", desc: "AI готовит публичную версию, когда публикуешь запись." },
  intent: { label: "Классификатор (старый)", desc: "Определял вопрос/запись. Заменён на «Роутер бота»." },
  bot_route: { label: "Роутер бота", desc: "Определяет, что ты хочешь от бота: действие, вопрос или запись." },
  book_section: { label: "Главы Книги жизни", desc: "AI пишет главы для «Книги жизни»." },
  insights_autosort: { label: "Сортировка инсайтов", desc: "Кнопка «Разложить по категориям» в Инсайтах." },
  knowledge_ask: { label: "Вопрос к базе знаний", desc: "Поиск-ответ по сохранённым материалам." },
  assistant: { label: "Помощник-гид", desc: "AI-подсказки «куда нажать» в окне Помощник." },
  summarize: { label: "Перегенерация резюме", desc: "Пересборка резюме записи после правки." },
};

const CAT_COLOR: Record<string, string> = {
  health: "#ef4444", sport: "#10b981", food: "#84cc16", family: "#ec4899", relationship: "#f472b6", business: "#3b82f6",
  finance: "#0ea5e9", ideas: "#f59e0b", insight: "#8b5cf6", task: "#6366f1", gratitude: "#14b8a6", travel: "#06b6d4",
  emotions: "#a78bfa", problem: "#fb7185", decision: "#22d3ee", event: "#94a3b8",
};

function Stat({ label, value, color }: any) {
  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, marginTop: 3, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function Bars({ series, color }: { series: { day: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }}>
      {series.map((s) => (
        <div key={s.day} title={`${s.day}: ${s.count}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: `${Math.round((s.count / max) * 72)}px`, minHeight: s.count ? 3 : 0, background: color, borderRadius: 4 }} />
          <span style={{ fontSize: 9, color: "var(--text-3)" }}>{s.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function Title({ children }: any) {
  return <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>{children}</div>;
}

const TREE_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

function Avatar({ name, root, depth }: { name: string; root?: boolean; depth: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const bg = root ? "var(--accent)" : TREE_COLORS[depth % TREE_COLORS.length];
  return <span style={{ width: 30, height: 30, borderRadius: 99, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{initial}</span>;
}

function TreeNode({ node, depth }: { node: any; depth: number }) {
  const kids = node.children?.length || 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <Avatar name={node.name} root={depth === 0} depth={depth} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: depth === 0 ? 600 : 500, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {node.name}
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: 99, whiteSpace: "nowrap", background: node.active ? "rgba(5,150,105,0.12)" : "var(--surface-2)", color: node.active ? "var(--positive)" : "var(--text-3)" }}>
              {node.active ? "активен" : node.entries ? "тихо" : "не писал"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {kids > 0 ? `пригласил ${kids}` : depth === 0 ? "корень" : "приглашён"} · {node.entries ?? 0} зап.{node.last ? ` · посл. ${node.last}` : ""}
          </div>
        </div>
      </div>
      {kids > 0 && (
        <div style={{ marginLeft: 14, paddingLeft: 18, borderLeft: "1.5px solid var(--border)" }}>
          {node.children.map((c: any, i: number) => <TreeNode key={c.id || i} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_TREE = {
  id: "ex0", name: "Ты", entries: 12, children: [
    { id: "ex1", name: "Алиса", entries: 7, children: [
      { id: "ex2", name: "Костя", entries: 4, children: [{ id: "ex3", name: "Лена", entries: 2, children: [] }] },
    ] },
    { id: "ex4", name: "Дима", entries: 5, children: [] },
  ],
};

export default async function AdminPage() {
  const user = await requireUser();
  if (user.id !== OWNER) redirect("/");

  const locale = await getLocale();
  const t = getDict(locale);
  const d = await getAdminData();
  // Опции для ручного выбора «кто пригласил» (все пользователи).
  const refOptions = d.list.map((u: any) => ({ id: u.id, name: u.name }));

  const srcTotal = d.voice + d.textEntries || 1;
  const voicePct = Math.round((d.voice / srcTotal) * 100);
  const maxCat = d.catDist[0]?.count || 1;

  // Метрики роста и удержания (по уже посчитанным агрегатам).
  const totalU = d.totalUsers || 1;
  const pct = (n: number) => Math.round((n / totalU) * 100);
  const funnel = [
    { label: "Зашли (всего)", n: d.totalUsers, color: "var(--text-3)" },
    { label: "Написали хотя бы 1 запись", n: d.writers, color: "var(--accent)" },
    { label: "Вернулись (писали ≥2 дней)", n: d.returning, color: "var(--insight)" },
    { label: "Активны за 7 дней", n: d.activeUsers, color: "var(--positive)" },
  ];
  const plans = { free: 0, pro: 0, premium: 0 } as Record<string, number>;
  for (const u of d.list as any[]) plans[u.plan === "pro" || u.plan === "premium" ? u.plan : "free"]++;
  const paid = plans.pro + plans.premium;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-shield-lock" style={{ color: "var(--accent)" }} />Admin · LIFE OS
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-lock" style={{ fontSize: 13 }} />Только агрегированные данные — без текста личных записей.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
          <Link href="/admin/architecture" className="card" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
            <i className="ti ti-blueprint" style={{ fontSize: 24, color: "var(--accent)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-text)" }}>Архитектура проекта</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Стек, база данных, инфраструктура — для программиста и инвестора</div>
            </div>
            <i className="ti ti-arrow-right" style={{ color: "var(--accent)", fontSize: 18 }} />
          </Link>

          <Link href="/admin/marketing" className="card" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 24, color: "var(--accent)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent-text)" }}>Маркетинг</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>50 идей продвижения в Instagram и не только — подари книгу близким</div>
            </div>
            <i className="ti ti-arrow-right" style={{ color: "var(--accent)", fontSize: 18 }} />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
          <Stat label="Пользователей" value={d.totalUsers} />
          <Stat label="Активны (7 дней)" value={d.activeUsers} color="var(--positive)" />
          <Stat label="Активны (30 дней)" value={d.active30} />
          <Stat label="Всего записей" value={d.totalEntries} color="var(--accent)" />
          <Stat label="Ср. записей / автор" value={d.avgPerWriter} />
          <Stat label="Вернулись (≥2 дней)" value={d.returning} color="var(--insight)" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title>📈 Рост и удержание</Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {/* Воронка активации */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Воронка активации</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {funnel.map((f) => (
                  <div key={f.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-2)" }}>{f.label}</span>
                      <span style={{ fontWeight: 600 }}>{f.n} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {pct(f.n)}%</span></span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${pct(f.n)}%`, height: "100%", background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 11, lineHeight: 1.5 }}>
                Доля «написали» от «зашли» — активация. Доля «вернулись» — закрепилась ли привычка.
              </div>
            </div>

            {/* Удержание + тарифы */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Удержание и тарифы</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: 10, padding: "10px 6px" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--positive)" }}>{pct(d.activeUsers)}%</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>активны 7 дней</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: 10, padding: "10px 6px" }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{pct(d.active30)}%</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>активны 30 дней</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: "var(--text-2)" }}>Тарифы</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Старт (бесплатно)</span><b>{plans.free}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#0ea5e9" }}>Pro</span><b>{plans.pro}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#f59e0b" }}>Премиум</span><b>{plans.premium}</b></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 7, marginTop: 1 }}>
                  <span style={{ color: "var(--text-2)" }}>Конверсия в платный</span><b>{pct(paid)}%</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        {d.feedback && d.feedback.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title>💬 Обратная связь ({d.feedback.length})</Title>
            <div style={{ display: "grid", gap: 8 }}>
              {d.feedback.map((f: any, i: number) => (
                <div key={i} className="card" style={{ padding: "11px 13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{f.kind === "idea" ? "💡 Идея" : f.kind === "bug" ? "🐞 Проблема" : "💬 Отзыв"} · {f.name}</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap" }}>{new Date(f.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
          <div>
            <Title>Записи по дням (14 дней)</Title>
            <div className="card"><Bars series={d.entriesSeries} color="var(--accent)" /></div>
          </div>
          <div>
            <Title>Новые пользователи (14 дней)</Title>
            <div className="card"><Bars series={d.newUsersSeries} color="#10b981" /></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 24 }}>
          <div className="card">
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 8 }}>Голос vs текст</div>
            <div style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${voicePct}%`, background: "var(--accent)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>🎙 {d.voice} ({voicePct}%) · ✍️ {d.textEntries}</div>
          </div>
          <Stat label="Ср. настроение" value={d.avgMood ?? "—"} color="#4f46e5" />
          <Stat label="Ср. энергия" value={d.avgEnergy ?? "—"} color="var(--energy)" />
        </div>

        {d.catDist.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title>Зачем пользуются — темы записей</Title>
            <div className="card">
              {d.catDist.slice(0, 12).map((c) => {
                const pct = Math.round((c.count / d.totalEntries) * 100);
                return (
                  <div key={c.slug} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                      <span>{t.cats[c.slug] || c.slug}</span>
                      <span style={{ color: "var(--text-3)" }}>{c.count} · {pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((c.count / maxCat) * 100)}%`, height: "100%", background: CAT_COLOR[c.slug] || "var(--accent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <Title>🌳 Дерево приглашений — кто кого привёл</Title>
          {d.tree.length > 0 ? (
            <div className="card">
              {d.tree.map((n: any) => <TreeNode key={n.id} node={n} depth={0} />)}
            </div>
          ) : (
            <div className="card">
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 14 }}>
                Дерево пока пустое — никто не пришёл по ссылке-приглашению (все зашли в бота напрямую). Как только друг откроет твою ссылку «Пригласить друга» и заведётся — здесь вырастет ветка от тебя. Так это будет выглядеть:
              </div>
              <div style={{ opacity: 0.5, pointerEvents: "none" }}>
                <TreeNode node={EXAMPLE_TREE} depth={0} />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title>💰 Расход AI (примерно)</Title>
          {d.usage && d.usage.byKind.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 10 }}>
                <Stat label="Всего" value={`$${(d.usage.total / 100).toFixed(2)}`} color="var(--accent)" />
                <Stat label="За 7 дней" value={`$${(d.usage.last7 / 100).toFixed(2)}`} />
                <Stat label="Ср. на автора" value={`$${(d.usage.perWriter / 100).toFixed(2)}`} />
              </div>
              <div className="card" style={{ padding: "4px 14px" }}>
                {d.usage.byKind.map((k: any, i: number) => {
                  const info = KIND_INFO[k.kind];
                  return (
                    <div key={k.kind} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, fontSize: 13, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{info?.label || k.kind}</div>
                        {info?.desc && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>{info.desc}</div>}
                      </div>
                      <span style={{ color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" }}>${(k.cents / 100).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 8 }}>Оценка по токенам моделей (голос — приблизительно).</div>
              {/* Где пополнять баланс AI */}
              <div className="card" style={{ marginTop: 12, background: "var(--accent-bg)", border: "1px solid var(--accent)", fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>
                  <i className="ti ti-credit-card" style={{ fontSize: 17, color: "var(--accent)" }} />Где пополнять баланс
                </div>
                <div style={{ color: "var(--text-2)" }}>
                  Это не подписка пользователей, а себестоимость AI — списывается с кредитов в кабинетах поставщиков:
                  <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 5 }}>
                    <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 500 }}>→ Claude (Anthropic): console.anthropic.com → Billing</a>
                    <span style={{ color: "var(--text-3)", fontSize: 12 }}>Основной расход: разбор записей, AI-друг, биограф, аналитика, связи, советы — всё, кроме голоса.</span>
                    <a href="https://platform.openai.com/account/billing/overview" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 500, marginTop: 4 }}>→ OpenAI: platform.openai.com → Billing</a>
                    <span style={{ color: "var(--text-3)", fontSize: 12 }}>Только «Голос → текст (Whisper)» — расшифровка голосовых.</span>
                  </div>
                  <div style={{ marginTop: 9, color: "var(--text-3)", fontSize: 12 }}>Совет: включи там авто-пополнение (auto-reload), чтобы AI не остановился при нуле баланса.</div>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6 }}>
              Пока пусто. Запусти <b style={{ color: "var(--text)" }}>usage.sql</b> в Supabase, затем сделай новую запись или задай вопрос — расход начнёт считаться здесь. Старые записи (до включения учёта) не учитываются.
            </div>
          )}
        </div>

        {d.topReferrers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title>Кто больше всех приглашает</Title>
            <div className="card" style={{ padding: "6px 14px" }}>
              {d.topReferrers.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "8px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-user-plus" style={{ fontSize: 16, color: "var(--accent)" }} />{r.name}</span>
                  <span style={{ color: "var(--text-3)" }}>{r.count} {r.count === 1 ? "приглашённый" : "приглашённых"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Title>Все пользователи ({d.totalUsers})</Title>
        <AdminUsersTable users={d.list as any} refOptions={refOptions} />
      </main>
    </div>
  );
}
