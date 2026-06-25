import { supabaseAdmin } from "./supabaseAdmin";

export async function getAdminData() {
  const db = supabaseAdmin();

  // referred_by может ещё не существовать (если не запущен referral.sql) — мягкий фолбэк.
  let users: any[] | null = null;
  const r1 = await db.from("users").select("id, name, chat_id, created_at, referred_by");
  if (r1.error) {
    const r2 = await db.from("users").select("id, name, chat_id, created_at");
    users = r2.data;
  } else {
    users = r1.data;
  }
  const { data: entries } = await db.from("entries").select("user_id, entry_date");

  const byUser: Record<string, { count: number; last: string }> = {};
  for (const e of entries || []) {
    const u = (byUser[e.user_id] ||= { count: 0, last: "" });
    u.count++;
    if (e.entry_date && e.entry_date > u.last) u.last = e.entry_date;
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const nameById: Record<string, string> = {};
  for (const u of users || []) nameById[u.id] = u.name || "—";

  const list = (users || []).map((u: any) => {
    const st = byUser[u.id] || { count: 0, last: "" };
    return {
      id: u.id,
      name: u.name || "—",
      chat_id: u.chat_id,
      joined: (u.created_at || "").slice(0, 10),
      entries: st.count,
      last: st.last || null,
      active: Boolean(st.last && st.last >= weekAgo),
      referrer: u.referred_by ? nameById[u.referred_by] || "—" : null,
    };
  });
  list.sort((a, b) => b.entries - a.entries);

  const totalUsers = list.length;
  const activeUsers = list.filter((u) => u.active).length;
  const totalEntries = (entries || []).length;

  const refCount: Record<string, number> = {};
  for (const u of users || []) if (u.referred_by) refCount[u.referred_by] = (refCount[u.referred_by] || 0) + 1;
  const topReferrers = Object.entries(refCount)
    .map(([id, count]) => ({ name: nameById[id] || id, count }))
    .sort((a, b) => b.count - a.count);

  return { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers, totalEntries, list, topReferrers };
}
