import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHealthMetrics } from "@/lib/healthMetrics";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { bandOf } from "@/lib/mood";

export const runtime = "nodejs";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Mood calendar payload for one month: per-day mood (manual override wins over
// the AI-extracted average of that day's entries), month distribution, average,
// and the strongest body <-> mood connections over the recent window.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const db = supabaseAdmin();
  const uid = user.id;

  let off = 0;
  try {
    const { data } = await db.from("users").select("tz_offset").eq("id", uid).maybeSingle();
    if (typeof (data as any)?.tz_offset === "number") off = (data as any).tz_offset;
  } catch {}
  const now = new Date(Date.now() + off * 60000);
  const todayISO = iso(now);

  // Requested month (YYYY-MM), default current.
  const mp = req.nextUrl.searchParams.get("month");
  let year = now.getFullYear(), month = now.getMonth();
  if (mp && /^\d{4}-\d{2}$/.test(mp)) { year = Number(mp.slice(0, 4)); month = Number(mp.slice(5, 7)) - 1; }

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStartISO = iso(first);
  const monthEndISO = iso(new Date(year, month, daysInMonth));

  // Also look back 30 days from today for the connections window.
  const backStart = new Date(now); backStart.setDate(backStart.getDate() - 29);
  const fetchStart = monthStartISO < iso(backStart) ? monthStartISO : iso(backStart);

  const [entriesRes, overridesRes, health] = await Promise.all([
    db.from("entries").select("entry_date, mood").eq("user_id", uid).gte("entry_date", fetchStart).lte("entry_date", monthEndISO > todayISO ? monthEndISO : todayISO).not("mood", "is", null),
    db.from("day_moods").select("day, mood, source").eq("user_id", uid).gte("day", fetchStart),
    getHealthMetrics(uid, 30).catch(() => ({ days: [] as any[], latest: null })),
  ]);

  // AI mood per day = average of that day's entry moods.
  const aiByDay: Record<string, { sum: number; n: number }> = {};
  for (const r of (entriesRes.data || []) as any[]) {
    const d = r.entry_date;
    (aiByDay[d] ||= { sum: 0, n: 0 });
    aiByDay[d].sum += r.mood;
    aiByDay[d].n += 1;
  }
  const overrideByDay: Record<string, { mood: number; source: string }> = {};
  for (const o of (overridesRes.data || []) as any[]) overrideByDay[o.day] = { mood: o.mood, source: o.source };

  // Resolved daily mood: manual/bot override first, else AI average.
  const moodFor = (date: string): { mood: number | null; source: "manual" | "bot" | "ai" | null } => {
    const ov = overrideByDay[date];
    if (ov) return { mood: ov.mood, source: ov.source === "bot" ? "bot" : "manual" };
    const ai = aiByDay[date];
    if (ai) return { mood: Math.round((ai.sum / ai.n) * 10) / 10, source: "ai" };
    return { mood: null, source: null };
  };

  const days = [] as { date: string; day: number; mood: number | null; band: number | null; source: string | null; future: boolean }[];
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let noData = 0, sum = 0, cnt = 0;
  for (let dd = 1; dd <= daysInMonth; dd++) {
    const date = iso(new Date(year, month, dd));
    const future = date > todayISO;
    const { mood, source } = moodFor(date);
    const band = mood != null ? bandOf(mood) : null;
    days.push({ date, day: dd, mood, band, source, future });
    if (!future) {
      if (band) { dist[band]++; sum += mood!; cnt++; } else noData++;
    }
  }
  const average = cnt ? Math.round((sum / cnt) * 10) / 10 : null;

  // Body <-> mood connections over the last 30 days (manual moods count too).
  const healthByDay: Record<string, any> = {};
  for (const h of (health.days || []) as any[]) healthByDay[h.day] = h;
  const win: string[] = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); win.push(iso(d)); }
  const timeline = win.map((date) => {
    const h = healthByDay[date] || {};
    return { mood: moodFor(date).mood, steps: h.steps ?? null, sleep_hours: h.sleep_hours ?? null, hr_resting: h.hr_resting ?? null, active_kcal: h.active_kcal ?? null, hrv: h.hrv ?? null, azm: h.azm ?? null };
  });
  const connections = computeConnections(timeline);

  return NextResponse.json({
    ok: true,
    month: `${year}-${pad(month + 1)}`,
    monthLabel: first.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }),
    firstWeekday: (first.getDay() + 6) % 7, // 0 = Monday
    today: todayISO,
    days,
    distribution: dist,
    noData,
    average,
    connections,
  });
}

const avg = (vals: (number | null)[]) => {
  const xs = vals.filter((v): v is number => typeof v === "number");
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
};
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function computeConnections(timeline: { mood: number | null; [k: string]: number | null }[]): { text: string }[] {
  const BM: { key: string; hi: (v: number) => string; lo: (v: number) => string; f: (v: number) => number }[] = [
    { key: "sleep_hours", hi: (v) => `спишь больше ${v} ч`, lo: (v) => `спишь меньше ${v} ч`, f: (v) => Math.round(v * 10) / 10 },
    { key: "steps", hi: (v) => `проходишь больше ${v} шагов`, lo: (v) => `проходишь меньше ${v} шагов`, f: (v) => Math.round(v / 500) * 500 },
    { key: "hrv", hi: (v) => `HRV выше ${v} мс`, lo: (v) => `HRV ниже ${v} мс`, f: (v) => Math.round(v) },
    { key: "hr_resting", hi: (v) => `пульс покоя выше ${v}`, lo: (v) => `пульс покоя ниже ${v}`, f: (v) => Math.round(v) },
    { key: "active_kcal", hi: (v) => `сжигаешь больше ${v} ккал`, lo: (v) => `сжигаешь меньше ${v} ккал`, f: (v) => Math.round(v / 10) * 10 },
    { key: "azm", hi: (v) => `в зонах активности больше ${v} мин`, lo: (v) => `в зонах активности меньше ${v} мин`, f: (v) => Math.round(v) },
  ];
  const found: { key: string; text: string; score: number }[] = [];
  for (const m of BM) {
    const ps = timeline.filter((d) => d[m.key] != null && d.mood != null).map((d) => ({ x: d[m.key] as number, y: d.mood as number }));
    if (ps.length < 6) continue;
    const med = median(ps.map((p) => p.x));
    const hi = ps.filter((p) => p.x > med).map((p) => p.y);
    const lo = ps.filter((p) => p.x <= med).map((p) => p.y);
    if (hi.length < 3 || lo.length < 3) continue;
    const diff = avg(hi)! - avg(lo)!;
    if (Math.abs(diff) < 0.7) continue;
    const v = m.f(med);
    const phrase = diff > 0 ? m.hi(v) : m.lo(v);
    found.push({ key: m.key, text: `Когда ${phrase} — настроение выше на ${Math.abs(diff).toFixed(1)}`, score: Math.abs(diff) });
  }
  found.sort((a, b) => b.score - a.score);
  return found.slice(0, 2).map((c) => ({ text: c.text }));
}
