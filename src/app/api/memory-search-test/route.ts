import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { searchMemories } from "@/lib/semanticMemory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Owner-only smoke test for semantic memory. Remove with the other debug routes.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q") || "семья";
  const chat = req.nextUrl.searchParams.get("chat") || process.env.TELEGRAM_ALLOWED_CHAT_ID;
  const { data: u } = await supabaseAdmin().from("users").select("id").eq("chat_id", Number(chat)).maybeSingle();
  if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
  const hits = await searchMemories((u as any).id, q, 5);
  return NextResponse.json({
    ok: true,
    query: q,
    count: hits.length,
    hits: hits.map((h) => ({ date: h.entry_date, sim: Math.round(h.similarity * 100) / 100, text: (h.raw_text || h.summary || "").slice(0, 100) })),
  });
}
