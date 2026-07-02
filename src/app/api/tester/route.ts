import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function todayKyiv(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// GET → { tester, today (отчёт за сегодня или null), history: [...] }
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  let tester = false;
  try {
    const { data } = await db.from("users").select("tester").eq("id", user.id).maybeSingle();
    tester = !!(data as any)?.tester;
  } catch {}
  const today = todayKyiv();
  let todayReport: any = null;
  let history: any[] = [];
  try {
    const { data } = await db.from("tester_reports").select("day, entries, checklist, bugs, notes, updated_at").eq("user_id", user.id).order("day", { ascending: false }).limit(31);
    history = data || [];
    todayReport = history.find((r) => String(r.day).slice(0, 10) === today) || null;
  } catch {}
  let bugs: any[] = [];
  try {
    const { data } = await db.from("tester_bugs").select("id, day, text, status, payout, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    bugs = data || [];
  } catch {}
  return NextResponse.json({ ok: true, tester, today, todayReport, history, bugs });
}

// POST { action: "mode", on }  |  { action: "report", day, entries, checklist, bugs, notes }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = supabaseAdmin();

  if (body?.action === "mode") {
    try {
      await db.from("users").update({ tester: !!body.on }).eq("id", user.id);
    } catch {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, tester: !!body.on });
  }

  if (body?.action === "bug") {
    const text = String(body.text || "").trim().slice(0, 4000);
    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    try {
      const { error } = await db.from("tester_bugs").insert({ user_id: user.id, day: todayKyiv(), text });
      if (error) throw error;
    } catch {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "report") {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(body.day || "")) ? body.day : todayKyiv();
    const entries = Number.isFinite(Number(body.entries)) ? Math.max(0, Math.round(Number(body.entries))) : null;
    const checklist = Array.isArray(body.checklist) ? body.checklist.slice(0, 50) : null;
    const bugs = body.bugs ? String(body.bugs).slice(0, 4000) : null;
    const notes = body.notes ? String(body.notes).slice(0, 4000) : null;
    try {
      const { error } = await db.from("tester_reports").upsert(
        { user_id: user.id, day, entries, checklist, bugs, notes, updated_at: new Date().toISOString() },
        { onConflict: "user_id,day" }
      );
      if (error) throw error;
    } catch {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
