import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHabit } from "@/lib/queries";
import { getHealthMetrics } from "@/lib/healthMetrics";
import { isGoogleHealthConnected } from "@/lib/googleHealth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// One payload for the native dashboard: 14-day timeline of mood + health, plus
// streak, week averages, top themes, and a sleep↔mood correlation.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const db = supabaseAdmin();
  const uid = user.id;

  let off = 0;
  try {
    const { data } = await db.from("users").select("tz_offset").eq("id", uid).maybeSingle();
    if (typeof (data as any)?.tz_offset === "number") off = (data as any).tz_offset;
  } catch {}
  const today = new Date(Date.now() + off * 60000);

  const N = 14;
  const dates: string[] = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(iso(d));
  }
  const startISO = dates[0];

  const [habit, countRes, moodRows, health, googleConnected, tagData] = await Promise.all([
    getHabit(uid, iso(today), N).catch(() => ({ wroteToday: false, streak: 0, chain: [] as any[], totalDays: 0 })),
    db.from("entries").select("id", { count: "exact", head: true }).eq("user_id", uid),
    db.from("entries").select("entry_date, mood, energy").eq("user_id", uid).gte("entry_date", startISO),
    getHealthMetrics(uid, N).catch(() => ({ days: [] as any[], latest: null })),
    isGoogleHealthConnected(uid).catch(() => false),
    (async () => {
      const { data: recent } = await db.from("entries").select("id").eq("user_id", uid).order("entry_date", { ascending: false }).limit(200);
      const ids = (recent || []).map((r: any) => r.id);
      if (!ids.length) return [] as { name: string; count: number }[];
      const { data: et } = await db.from("entry_tags").select("tags(name)").in("entry_id", ids);
      const counts: Record<string, number> = {};
      for (const row of et || []) {
        const name = (row as any).tags?.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
    })().catch(() => []),
  ]);

  // Average mood + energy per day (each counted only where present).
  const moodByDay: Record<string, { sum: number; n: number }> = {};
  const energyByDay: Record<string, { sum: number; n: number }> = {};
  for (const r of (moodRows.data || []) as any[]) {
    const d = r.entry_date;
    if (r.mood != null) { (moodByDay[d] ||= { sum: 0, n: 0 }); moodByDay[d].sum += r.mood; moodByDay[d].n += 1; }
    if (r.energy != null) { (energyByDay[d] ||= { sum: 0, n: 0 }); energyByDay[d].sum += r.energy; energyByDay[d].n += 1; }
  }
  const healthByDay: Record<string, any> = {};
  for (const h of (health.days || []) as any[]) healthByDay[h.day] = h;

  const timeline = dates.map((date) => {
    const m = moodByDay[date];
    const en = energyByDay[date];
    const h = healthByDay[date] || {};
    return {
      date,
      mood: m ? Math.round((m.sum / m.n) * 10) / 10 : null,
      energy: en ? Math.round((en.sum / en.n) * 10) / 10 : null,
      steps: h.steps ?? null,
      sleep_hours: h.sleep_hours ?? null,
      hr_resting: h.hr_resting ?? null,
      active_kcal: h.active_kcal ?? null,
      hrv: h.hrv ?? null,
      azm: h.azm ?? null,
    };
  });

  const avg = (vals: (number | null)[]) => {
    const xs = vals.filter((v): v is number => typeof v === "number");
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const round = (v: number | null, p = 0) => (v == null ? null : Math.round(v * 10 ** p) / 10 ** p);

  const last7 = timeline.slice(-7);
  const weekAvg = {
    mood: round(avg(last7.map((d) => d.mood)), 1),
    steps: round(avg(last7.map((d) => d.steps)), 0),
    sleep: round(avg(last7.map((d) => d.sleep_hours)), 1),
    hr_resting: round(avg(last7.map((d) => d.hr_resting)), 0),
    active_kcal: round(avg(last7.map((d) => d.active_kcal)), 0),
    hrv: round(avg(last7.map((d) => d.hrv)), 0),
    azm: round(avg(last7.map((d) => d.azm)), 0),
  };

  // Sleep ↔ mood correlation (Pearson) over days where both exist.
  const pairs = timeline.filter((d) => d.sleep_hours != null && d.mood != null) as { sleep_hours: number; mood: number }[];
  let sleepMood: { r: number; n: number } | null = null;
  if (pairs.length >= 4) {
    const mx = avg(pairs.map((p) => p.sleep_hours))!;
    const my = avg(pairs.map((p) => p.mood))!;
    let num = 0, dx = 0, dy = 0;
    for (const p of pairs) {
      num += (p.sleep_hours - mx) * (p.mood - my);
      dx += (p.sleep_hours - mx) ** 2;
      dy += (p.mood - my) ** 2;
    }
    const denom = Math.sqrt(dx * dy);
    if (denom > 0) sleepMood = { r: Math.round((num / denom) * 100) / 100, n: pairs.length };
  }

  // Body ↔ mind connections: for each health metric, split days into "high" vs
  // "low" (by median) and compare average mood / energy. Surface the 1–2 strongest,
  // human-readable — the thing only LIFE OS can do (wearable + diary in one place).
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const BM: { key: keyof (typeof timeline)[number]; hi: (v: number) => string; lo: (v: number) => string; f: (v: number) => number }[] = [
    { key: "sleep_hours", hi: (v) => `спишь больше ${v} ч`, lo: (v) => `спишь меньше ${v} ч`, f: (v) => Math.round(v * 10) / 10 },
    { key: "steps", hi: (v) => `проходишь больше ${v} шагов`, lo: (v) => `проходишь меньше ${v} шагов`, f: (v) => Math.round(v / 500) * 500 },
    { key: "hrv", hi: (v) => `HRV выше ${v} мс`, lo: (v) => `HRV ниже ${v} мс`, f: (v) => Math.round(v) },
    { key: "hr_resting", hi: (v) => `пульс покоя выше ${v}`, lo: (v) => `пульс покоя ниже ${v}`, f: (v) => Math.round(v) },
    { key: "active_kcal", hi: (v) => `сжигаешь больше ${v} ккал`, lo: (v) => `сжигаешь меньше ${v} ккал`, f: (v) => Math.round(v / 10) * 10 },
    { key: "azm", hi: (v) => `в зонах активности больше ${v} мин`, lo: (v) => `в зонах активности меньше ${v} мин`, f: (v) => Math.round(v) },
  ];
  const targets: { k: "mood" | "energy"; w: string }[] = [{ k: "mood", w: "настроение" }, { k: "energy", w: "энергия" }];
  const found: { key: string; text: string; score: number }[] = [];
  for (const t of targets) {
    for (const m of BM) {
      const ps = timeline
        .filter((d) => (d as any)[m.key] != null && (d as any)[t.k] != null)
        .map((d) => ({ x: (d as any)[m.key] as number, y: (d as any)[t.k] as number }));
      if (ps.length < 6) continue;
      const med = median(ps.map((p) => p.x));
      const hi = ps.filter((p) => p.x > med).map((p) => p.y);
      const lo = ps.filter((p) => p.x <= med).map((p) => p.y);
      if (hi.length < 3 || lo.length < 3) continue;
      const diff = avg(hi)! - avg(lo)!;
      if (Math.abs(diff) < 0.7) continue;
      const v = m.f(med);
      const phrase = diff > 0 ? m.hi(v) : m.lo(v);
      found.push({ key: String(m.key), text: `Когда ${phrase} — ${t.w} выше на ${Math.abs(diff).toFixed(1)}`, score: Math.abs(diff) });
    }
  }
  found.sort((a, b) => b.score - a.score);
  const seenBM = new Set<string>();
  const bodyMind: { text: string }[] = [];
  for (const c of found) {
    if (seenBM.has(c.key)) continue;
    seenBM.add(c.key);
    bodyMind.push({ text: c.text });
    if (bodyMind.length >= 2) break;
  }

  return NextResponse.json({
    ok: true,
    name: user.name,
    streak: habit.streak,
    totalDays: habit.totalDays,
    totalEntries: countRes.count || 0,
    wroteToday: habit.wroteToday,
    timeline,
    weekAvg,
    latestHealth: health.latest,
    sleepMood,
    bodyMind,
    topTags: tagData,
    googleConnected,
    healthConnected: googleConnected || !!health.latest,
  });
}
