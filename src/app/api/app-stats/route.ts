import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHabit } from "@/lib/queries";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Native "Итоги" screen: streak, 14-day chain, week mood, top tags/themes.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const db = supabaseAdmin();
  const uid = user.id;

  // User's local "today" (tz_offset minutes to UTC), for the streak/chain.
  let off = 0;
  try {
    const { data } = await db.from("users").select("tz_offset").eq("id", uid).maybeSingle();
    if (typeof (data as any)?.tz_offset === "number") off = (data as any).tz_offset;
  } catch {}
  const local = new Date(Date.now() + off * 60000);
  const todayISO = local.toISOString().slice(0, 10);
  const weekAgoISO = new Date(local.getTime() - 6 * 86400000).toISOString().slice(0, 10);

  const habit = await getHabit(uid, todayISO, 14).catch(() => ({
    wroteToday: false, streak: 0, chain: [] as { date: string; active: boolean }[], totalDays: 0,
  }));

  // Average mood over the last 7 days.
  let weekMood: number | null = null;
  try {
    const { data } = await db
      .from("entries")
      .select("mood")
      .eq("user_id", uid)
      .gte("entry_date", weekAgoISO)
      .not("mood", "is", null);
    const moods = (data || []).map((r: any) => r.mood).filter((n: any) => typeof n === "number");
    if (moods.length) weekMood = Math.round((moods.reduce((a: number, b: number) => a + b, 0) / moods.length) * 10) / 10;
  } catch {}

  // Top themes: most frequent tags across recent entries.
  let topTags: { name: string; count: number }[] = [];
  try {
    const { data: recent } = await db
      .from("entries")
      .select("id")
      .eq("user_id", uid)
      .order("entry_date", { ascending: false })
      .limit(200);
    const ids = (recent || []).map((r: any) => r.id);
    if (ids.length) {
      const { data: et } = await db.from("entry_tags").select("tags(name)").in("entry_id", ids);
      const counts: Record<string, number> = {};
      for (const row of et || []) {
        const name = (row as any).tags?.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
      topTags = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    streak: habit.streak,
    totalDays: habit.totalDays,
    wroteToday: habit.wroteToday,
    chain: habit.chain,
    weekMood,
    topTags,
  });
}
