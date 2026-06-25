import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { summarize } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Перегенерировать резюме своих записей в новом тоне (от первого лица).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const db = supabaseAdmin();
  const { data: entries } = await db
    .from("entries")
    .select("id, raw_text, summary")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(60);

  const list = entries || [];
  let updated = 0;

  // Небольшими пачками, чтобы не упереться в лимиты.
  for (let i = 0; i < list.length; i += 5) {
    const chunk = list.slice(i, i + 5);
    await Promise.all(chunk.map(async (e) => {
      const src = e.raw_text || e.summary;
      if (!src) return;
      try {
        const s = await summarize(src);
        if (s) { await db.from("entries").update({ summary: s }).eq("id", e.id); updated++; }
      } catch {}
    }));
  }

  // Сбросить кэш Life Intelligence — резюме изменились.
  try { await db.from("life_overview").delete().eq("user_id", user.id); } catch {}

  return NextResponse.json({ ok: true, updated });
}
