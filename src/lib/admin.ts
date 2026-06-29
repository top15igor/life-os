import { supabaseAdmin } from "./supabaseAdmin";

const dayStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export async function getAdminData() {
  const db = supabaseAdmin();

  // referred_by/plan могут ещё не существовать (миграции не запущены) — мягкий фолбэк по убыванию.
  let users: any[] | null = null;
  const rA = await db.from("users").select("id, name, chat_id, created_at, referred_by, plan");
  if (!rA.error) {
    users = rA.data;
  } else {
    const r1 = await db.from("users").select("id, name, chat_id, created_at, referred_by");
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

  // Дерево приглашений: кто кого позвал, ветки от корня.
  const userMap: Record<string, any> = {};
  for (const u of users || []) userMap[u.id] = u;
  const childrenOf: Record<string, any[]> = {};
  for (const u of users || []) {
    if (u.referred_by && userMap[u.referred_by]) (childrenOf[u.referred_by] ||= []).push(u);
  }
  const buildNode = (u: any, depth: number, seen: Set<string>): any => {
    if (seen.has(u.id) || depth > 12) return { id: u.id, name: u.name || "—", entries: byUser[u.id]?.count || 0, children: [] };
    seen.add(u.id);
    const children = (childrenOf[u.id] || []).map((c) => buildNode(c, depth + 1, seen));
    return { id: u.id, name: u.name || "—", entries: byUser[u.id]?.count || 0, children };
  };
  const roots = (users || []).filter((u: any) => !u.referred_by || !userMap[u.referred_by]);
  const tree = roots.map((u: any) => buildNode(u, 0, new Set<string>())).filter((n: any) => n.children.length > 0);

  // Расход AI (если запущен usage.sql).
  let usage: { total: number; last7: number; perWriter: number; byKind: { kind: string; cents: number }[] } = { total: 0, last7: 0, perWriter: 0, byKind: [] };
  try {
    const since7 = dayStr(Date.now() - 7 * 86400000);
    const { data: ev } = await db.from("usage").select("kind, cost_cents, created_at");
    const rows = ev || [];
    let total = 0, last7 = 0;
    const bk: Record<string, number> = {};
    for (const r of rows) {
      const c = Number(r.cost_cents) || 0;
      total += c;
      if ((r.created_at || "").slice(0, 10) >= since7) last7 += c;
      bk[r.kind] = (bk[r.kind] || 0) + c;
    }
    usage = { total, last7, perWriter: writers ? total / writers : 0, byKind: Object.entries(bk).map(([kind, cents]) => ({ kind, cents })).sort((a, b) => b.cents - a.cents) };
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
    list, topReferrers, tree, usage, feedback,
  };
}
