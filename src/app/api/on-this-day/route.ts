import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "В этот день": entries from a week / month / few months / year ago (whichever
// actually have a note) — a gentle nudge to look back at yourself.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const db = supabaseAdmin();
  let off = 0;
  try {
    const { data } = await db.from("users").select("tz_offset").eq("id", user.id).maybeSingle();
    if (typeof (data as any)?.tz_offset === "number") off = (data as any).tz_offset;
  } catch {}
  const today = new Date(Date.now() + off * 60000);

  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const targets: { label: string; date: string }[] = [
    { label: "Неделю назад", date: iso(weekAgo) },
    { label: "Месяц назад", date: iso(monthAgo) },
    { label: "3 месяца назад", date: iso(threeMonthsAgo) },
    { label: "Год назад", date: iso(yearAgo) },
  ];

  const items: any[] = [];
  for (const t of targets) {
    try {
      const { data } = await db
        .from("entries")
        .select("id, entry_date, summary, raw_text, mood")
        .eq("user_id", user.id)
        .eq("entry_date", t.date)
        .order("importance", { ascending: false })
        .limit(1);
      if (data && data[0]) items.push({ label: t.label, entry: data[0] });
    } catch {}
  }

  return NextResponse.json({ ok: true, items });
}
