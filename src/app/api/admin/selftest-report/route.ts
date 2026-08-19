import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Отчёт о работе агентов-тестировщиков: сколько прогонов, что и когда они
// поймали. Появился из честного вопроса владельца «а был ли от них смысл?» —
// на такой вопрос нельзя отвечать по памяти, только по их же журналу.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const db = supabaseAdmin();
  const { data } = await db.from("selftest_runs")
    .select("mode, ok, failed, failures, started_at")
    .order("started_at", { ascending: true })
    .limit(5000);
  const rows = (data as any[]) || [];

  const modes: Record<string, number> = {};
  const days = new Set<string>();
  const byName: Record<string, { count: number; first: string; last: string; why: string }> = {};
  let runsWithFail = 0;

  for (const r of rows) {
    modes[r.mode] = (modes[r.mode] || 0) + 1;
    days.add(String(r.started_at).slice(0, 10));
    if ((r.failed || 0) > 0) runsWithFail++;
    for (const f of (r.failures as any[]) || []) {
      const n = String(f?.name || "?");
      const at = String(r.started_at).slice(0, 16);
      if (!byName[n]) byName[n] = { count: 0, first: at, last: at, why: String(f?.why || "").slice(0, 180) };
      byName[n].count++;
      byName[n].last = at;
    }
  }

  const failures = Object.entries(byName)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    ok: true,
    runs: rows.length,
    modes,
    daysCovered: days.size,
    firstRun: rows[0]?.started_at || null,
    lastRun: rows[rows.length - 1]?.started_at || null,
    runsWithFail,
    uniqueFailures: failures.length,
    failures,
  }, { headers: { "content-type": "application/json; charset=utf-8" } });
}
