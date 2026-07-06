import { supabaseAdmin } from "./supabaseAdmin";

const dayStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Сводка по тестировщикам для админки: кто, когда начал, записи, баги — чтобы
// понять, кому сколько платить.
export type TesterReportRow = { day: string; entries: number; ok: number; bug: number; skip: number; bugs: string | null; notes: string | null; updated_at: string | null };
export type TesterBug = { id: string; day: string | null; text: string; status: string; payout: number; created_at: string | null };
export type TesterRow = {
  id: string; name: string; email: string | null; since: string | null; lastDay: string | null;
  reportDays: number; totalEntries: number; daysWith10: number; bugMarks: number; okMarks: number; bugReports: number;
  reports: TesterReportRow[];
  bugs: TesterBug[]; bugsOwed: number; newBugs: number;
};

export async function getTesterData(): Promise<TesterRow[]> {
  const db = supabaseAdmin();
  let testers: any[] = [];
  try {
    const { data } = await db.from("users").select("id, name, email, created_at").eq("tester", true);
    testers = data || [];
  } catch { return []; }
  if (!testers.length) return [];

  const ids = testers.map((u) => u.id);
  let reports: any[] = [];
  try {
    const { data } = await db.from("tester_reports").select("user_id, day, entries, checklist, bugs, notes, updated_at").in("user_id", ids).order("day", { ascending: false });
    reports = data || [];
  } catch {}
  let allBugs: any[] = [];
  try {
    const { data } = await db.from("tester_bugs").select("id, user_id, day, text, status, payout, created_at").in("user_id", ids).order("created_at", { ascending: false });
    allBugs = data || [];
  } catch {}

  const byUser: Record<string, any[]> = {};
  for (const r of reports) (byUser[r.user_id] ||= []).push(r);
  const bugsByUser: Record<string, any[]> = {};
  for (const b of allBugs) (bugsByUser[b.user_id] ||= []).push(b);

  const rows: TesterRow[] = testers.map((u) => {
    const rs = byUser[u.id] || [];
    let totalEntries = 0, daysWith10 = 0, bugMarks = 0, okMarks = 0, bugReports = 0;
    const reports: TesterReportRow[] = rs.map((r) => {
      const list = Array.isArray(r.checklist) ? r.checklist : [];
      const ok = list.filter((c: any) => c?.result === "ok").length;
      const bug = list.filter((c: any) => c?.result === "bug").length;
      const skip = list.filter((c: any) => c?.result === "skip").length;
      const entries = Number(r.entries) || 0;
      totalEntries += entries; okMarks += ok; bugMarks += bug;
      if (entries >= 10) daysWith10++;
      if (r.bugs && String(r.bugs).trim()) bugReports++;
      return { day: String(r.day).slice(0, 10), entries, ok, bug, skip, bugs: r.bugs || null, notes: r.notes || null, updated_at: r.updated_at || null };
    });
    const days = reports.map((r) => r.day).sort();
    const rawBugs = bugsByUser[u.id] || [];
    const bugs: TesterBug[] = rawBugs.map((b) => ({ id: b.id, day: b.day ? String(b.day).slice(0, 10) : null, text: b.text || "", status: b.status || "new", payout: Number(b.payout) || 0, created_at: b.created_at || null }));
    const bugsOwed = bugs.reduce((s, b) => s + (b.status === "paid" ? b.payout : 0), 0);
    const newBugs = bugs.filter((b) => b.status === "new").length;
    return {
      id: u.id, name: u.name || "—", email: u.email || null,
      since: days[0] || (u.created_at ? String(u.created_at).slice(0, 10) : null),
      lastDay: days[days.length - 1] || null,
      reportDays: reports.length, totalEntries, daysWith10, bugMarks, okMarks, bugReports, reports,
      bugs, bugsOwed, newBugs,
    };
  });
  // самые активные сверху
  rows.sort((a, b) => (b.lastDay || "").localeCompare(a.lastDay || "") || b.totalEntries - a.totalEntries);
  return rows;
}

export async function getAdminData() {
  const db = supabaseAdmin();

  // referred_by/plan могут ещё не существовать (миграции не запущены) — мягкий фолбэк по убыванию.
  let users: any[] | null = null;
  const rA = await db.from("users").select("id, name, chat_id, created_at, referred_by, plan, email");
  if (!rA.error) {
    users = rA.data;
  } else {
    const r1 = await db.from("users").select("id, name, chat_id, created_at, referred_by, email");
    if (!r1.error) {
      users = r1.data;
    } else {
      const r2 = await db.from("users").select("id, name, chat_id, created_at");
      users = r2.data;
    }
  }

  // Только агрегаты — НИКАКОГО текста записей.
  const { data: entries } = await db.from("entries").select("user_id, entry_date, source, mood, energy");
  const ents = entries || [];

  const byUser: Record<string, { count: number; last: string; days: Set<string> }> = {};
  for (const e of ents) {
    const u = (byUser[e.user_id] ||= { count: 0, last: "", days: new Set() });
    u.count++;
    if (e.entry_date) {
      u.days.add(e.entry_date);
      if (e.entry_date > u.last) u.last = e.entry_date;
    }
  }

  const weekAgo = dayStr(Date.now() - 7 * 86400000);
  const monthAgo = dayStr(Date.now() - 30 * 86400000);
  const nameById: Record<string, string> = {};
  for (const u of users || []) nameById[u.id] = u.name || "—";

  // Настоящий Telegram-@username (users.tg_username) — мягким запросом, чтобы
  // не ломать фолбэк выше, если миграция tg_username.sql ещё не применена.
  const tgById: Record<string, string> = {};
  try {
    const { data: tg } = await db.from("users").select("id, tg_username");
    for (const r of tg || []) if ((r as any).tg_username) tgById[(r as any).id] = (r as any).tg_username;
  } catch {}

  const list = (users || []).map((u: any) => {
    const st = byUser[u.id] || { count: 0, last: "", days: new Set() };
    return {
      id: u.id,
      name: u.name || "—",
      joined: (u.created_at || "").slice(0, 10),
      entries: st.count,
      last: st.last || null,
      active: Boolean(st.last && st.last >= weekAgo),
      referrer: u.referred_by ? nameById[u.referred_by] || "—" : null,
      referrerId: u.referred_by || null,
      email: u.email || null,
      telegram: !!u.chat_id,
      tgUsername: tgById[u.id] || null,
      chatId: u.chat_id || null,
      plan: (u.plan === "pro" || u.plan === "premium") ? u.plan : "free",
    };
  });
  list.sort((a, b) => b.entries - a.entries);

  const totalUsers = list.length;
  const activeUsers = list.filter((u) => u.active).length;
  const active30 = list.filter((u) => u.last && u.last >= monthAgo).length;
  const totalEntries = ents.length;
  const writers = list.filter((u) => u.entries > 0).length;
  const returning = Object.values(byUser).filter((u) => u.days.size >= 2).length;
  const avgPerWriter = writers ? Math.round((totalEntries / writers) * 10) / 10 : 0;

  // Динамика за 14 дней.
  const days14: string[] = [];
  for (let i = 13; i >= 0; i--) days14.push(dayStr(Date.now() - i * 86400000));
  const entriesByDay: Record<string, number> = {};
  const usersByDay: Record<string, number> = {};
  for (const e of ents) if (e.entry_date) entriesByDay[e.entry_date] = (entriesByDay[e.entry_date] || 0) + 1;
  for (const u of users || []) {
    const d = (u.created_at || "").slice(0, 10);
    if (d) usersByDay[d] = (usersByDay[d] || 0) + 1;
  }
  const entriesSeries = days14.map((d) => ({ day: d, count: entriesByDay[d] || 0 }));
  const newUsersSeries = days14.map((d) => ({ day: d, count: usersByDay[d] || 0 }));

  // Голос vs текст.
  let voice = 0, textEntries = 0;
  for (const e of ents) ((e.source || "").includes("voice") ? voice++ : textEntries++);

  // Средние (анонимно, по всем).
  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
  const avgMood = avg(ents.map((e) => e.mood).filter((x) => x != null) as number[]);
  const avgEnergy = avg(ents.map((e) => e.energy).filter((x) => x != null) as number[]);

  // Распределение категорий (только slug + счётчик, без текста).
  let catDist: { slug: string; count: number }[] = [];
  try {
    const { data: ec } = await db.from("entry_categories").select("categories(slug)");
    const cc: Record<string, number> = {};
    for (const row of ec || []) {
      const slug = (row as any).categories?.slug;
      if (slug) cc[slug] = (cc[slug] || 0) + 1;
    }
    catDist = Object.entries(cc).map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count);
  } catch {}

  const refCount: Record<string, number> = {};
  for (const u of users || []) if (u.referred_by) refCount[u.referred_by] = (refCount[u.referred_by] || 0) + 1;
  const topReferrers = Object.entries(refCount)
    .map(([id, count]) => ({ name: nameById[id] || id, count }))
    .sort((a, b) => b.count - a.count);

  // Adoption фич: сколько РАЗНЫХ юзеров реально пользуются каждой фичей (что взлетело, что мёртвое).
  const adopt = async (table: string): Promise<{ users: number; total: number }> => {
    try {
      const { data } = await db.from(table).select("user_id");
      const rows = (data || []) as any[];
      return { users: new Set(rows.map((r) => r.user_id)).size, total: rows.length };
    } catch { return { users: 0, total: 0 }; }
  };
  const voiceUsers = new Set((ents as any[]).filter((e) => (e.source || "").includes("voice")).map((e) => e.user_id)).size;
  const FEATS: { label: string; table?: string; color: string }[] = [
    { label: "Голосовые", color: "#6d5efc" },
    { label: "Финансы", table: "finance_tx", color: "#0ea5e9" },
    { label: "Цели", table: "goals", color: "#3b82f6" },
    { label: "Задачи", table: "tasks", color: "#6366f1" },
    { label: "Мечты", table: "dreams", color: "#f59e0b" },
    { label: "Вишлист", table: "wishes", color: "#ec4899" },
    { label: "База знаний", table: "saved_items", color: "#14b8a6" },
    { label: "Память", table: "memories", color: "#8b5cf6" },
    { label: "AI-друг", table: "companion_messages", color: "#10b981" },
    { label: "Напоминания", table: "reminders", color: "#f472b6" },
    { label: "Книги", table: "books", color: "#84cc16" },
    { label: "Трекер веса", table: "weight_log", color: "#ef4444" },
  ];
  const adoptRes = await Promise.all(FEATS.map((f) => (f.table ? adopt(f.table) : Promise.resolve({ users: voiceUsers, total: 0 }))));
  const featureAdoption = FEATS
    .map((f, i) => ({ label: f.label, color: f.color, users: adoptRes[i].users, total: adoptRes[i].total }))
    .sort((a, b) => b.users - a.users);

  // Вовлечённость: распределение юзеров по числу записей.
  const buckets = { b0: 0, b12: 0, b310: 0, b11: 0 };
  for (const u of list) {
    if (u.entries === 0) buckets.b0++;
    else if (u.entries <= 2) buckets.b12++;
    else if (u.entries <= 10) buckets.b310++;
    else buckets.b11++;
  }

  // Дерево приглашений: кто кого позвал, ветки от корня.
  const userMap: Record<string, any> = {};
  for (const u of users || []) userMap[u.id] = u;
  const childrenOf: Record<string, any[]> = {};
  for (const u of users || []) {
    if (u.referred_by && userMap[u.referred_by]) (childrenOf[u.referred_by] ||= []).push(u);
  }
  const nodeActive = (id: string) => Boolean(byUser[id]?.last && byUser[id].last >= weekAgo);
  const buildNode = (u: any, depth: number, seen: Set<string>): any => {
    const base = { id: u.id, name: u.name || "—", entries: byUser[u.id]?.count || 0, last: byUser[u.id]?.last || null, active: nodeActive(u.id) };
    if (seen.has(u.id) || depth > 12) return { ...base, children: [] };
    seen.add(u.id);
    const children = (childrenOf[u.id] || []).map((c) => buildNode(c, depth + 1, seen));
    return { ...base, children };
  };
  const roots = (users || []).filter((u: any) => !u.referred_by || !userMap[u.referred_by]);
  const tree = roots.map((u: any) => buildNode(u, 0, new Set<string>())).filter((n: any) => n.children.length > 0);

  // Расход AI (если запущен usage.sql).
  const OPENAI_KINDS = new Set(["transcribe"]); // Whisper — OpenAI, остальное Claude
  let usage: { total: number; last7: number; perWriter: number; anthropic: number; openai: number; byKind: { kind: string; cents: number }[]; byDay: { day: string; anthropic: number; openai: number }[] } = { total: 0, last7: 0, perWriter: 0, anthropic: 0, openai: 0, byKind: [], byDay: [] };
  try {
    const since7 = dayStr(Date.now() - 7 * 86400000);
    const { data: ev } = await db.from("usage").select("kind, cost_cents, created_at").order("created_at", { ascending: false }).limit(100000);
    const rows = ev || [];
    let total = 0, last7 = 0, anthropic = 0, openai = 0;
    const bk: Record<string, number> = {};
    const byDayMap: Record<string, { a: number; o: number }> = {};
    for (const r of rows) {
      if (r.kind === "balance_set") continue; // служебные снимки баланса — не расход
      const c = Number(r.cost_cents) || 0;
      total += c;
      const isOpenai = OPENAI_KINDS.has(r.kind);
      if (isOpenai) openai += c; else anthropic += c;
      const day = (r.created_at || "").slice(0, 10);
      if (day >= since7) last7 += c;
      bk[r.kind] = (bk[r.kind] || 0) + c;
      if (day) {
        const e = byDayMap[day] || { a: 0, o: 0 };
        if (isOpenai) e.o += c; else e.a += c;
        byDayMap[day] = e;
      }
    }
    const byDay = Object.entries(byDayMap).map(([day, v]) => ({ day, anthropic: v.a, openai: v.o })).sort((x, y) => x.day.localeCompare(y.day));
    usage = { total, last7, perWriter: writers ? total / writers : 0, anthropic, openai, byKind: Object.entries(bk).map(([kind, cents]) => ({ kind, cents })).sort((a, b) => b.cents - a.cents), byDay };
  } catch {}

  // Обратная связь (если запущен feedback.sql).
  let feedback: { kind: string; text: string; created_at: string; name: string }[] = [];
  try {
    const { data: fb } = await db.from("feedback").select("user_id, kind, text, created_at").order("created_at", { ascending: false }).limit(40);
    feedback = (fb || []).map((f: any) => ({ kind: f.kind || "other", text: f.text, created_at: f.created_at, name: userMap[f.user_id]?.name || "—" }));
  } catch {}

  return {
    totalUsers, activeUsers, active30, inactiveUsers: totalUsers - activeUsers,
    totalEntries, writers, returning, avgPerWriter,
    entriesSeries, newUsersSeries, voice, textEntries, avgMood, avgEnergy, catDist,
    featureAdoption, engagement: buckets,
    list, topReferrers, tree, usage, feedback,
  };
}
