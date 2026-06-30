import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";
const dayStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Подробности по пользователю для админ-карточки. ТОЛЬКО агрегаты, без текста записей. Только владельцу.
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = supabaseAdmin();

  // Профиль (без чувствительного).
  let prof: any = null;
  try { prof = (await db.from("users").select("name, email, chat_id, created_at, plan, referred_by").eq("id", id).maybeSingle()).data; }
  catch { prof = (await db.from("users").select("name, chat_id, created_at").eq("id", id).maybeSingle()).data; }

  // Записи — только метаданные.
  const { data: ents } = await db.from("entries").select("entry_date, mood, energy, source").eq("user_id", id);
  const rows = ents || [];
  const total = rows.length;
  let voice = 0, first = "", last = "";
  const moods: number[] = [], energies: number[] = [];
  const byDay: Record<string, number> = {};
  for (const e of rows as any[]) {
    if ((e.source || "").includes("voice")) voice++;
    if (e.entry_date) {
      byDay[e.entry_date] = (byDay[e.entry_date] || 0) + 1;
      if (!first || e.entry_date < first) first = e.entry_date;
      if (!last || e.entry_date > last) last = e.entry_date;
    }
    if (e.mood != null) moods.push(e.mood);
    if (e.energy != null) energies.push(e.energy);
  }
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null);
  const days30: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) { const dd = dayStr(Date.now() - i * 86400000); days30.push({ day: dd, count: byDay[dd] || 0 }); }
  const activeDays = Object.keys(byDay).length;

  // Расход AI по пользователю.
  let costTotal = 0; let byKind: { kind: string; cents: number }[] = [];
  try {
    const { data: ev } = await db.from("usage").select("kind, cost_cents").eq("user_id", id);
    const bk: Record<string, number> = {};
    for (const r of (ev || []) as any[]) { const c = Number(r.cost_cents) || 0; costTotal += c; bk[r.kind] = (bk[r.kind] || 0) + c; }
    byKind = Object.entries(bk).map(([kind, cents]) => ({ kind, cents })).sort((a, b) => b.cents - a.cents).slice(0, 6);
  } catch {}

  // Кто пригласил + кого пригласил.
  let referrer: string | null = null;
  if (prof?.referred_by) {
    try { referrer = ((await db.from("users").select("name").eq("id", prof.referred_by).maybeSingle()).data as any)?.name || null; } catch {}
  }
  let invited: { name: string; entries: number }[] = [];
  try {
    const { data: kids } = await db.from("users").select("id, name").eq("referred_by", id);
    const kidList = (kids || []) as any[];
    if (kidList.length) {
      const counts: Record<string, number> = {};
      const { data: ke } = await db.from("entries").select("user_id").in("user_id", kidList.map((k) => k.id));
      for (const r of (ke || []) as any[]) counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      invited = kidList.map((k) => ({ name: k.name || "—", entries: counts[k.id] || 0 })).sort((a, b) => b.entries - a.entries);
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    name: prof?.name || "—",
    email: prof?.email || null,
    telegram: !!prof?.chat_id,
    plan: prof?.plan === "pro" || prof?.plan === "premium" ? prof.plan : "free",
    joined: (prof?.created_at || "").slice(0, 10),
    total, voice, text: total - voice, first, last, activeDays,
    avgMood: avg(moods), avgEnergy: avg(energies),
    days30, costTotal, byKind, referrer, invited,
  });
}
