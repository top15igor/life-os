import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { listIdeas, setStatus, type Status } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWNER = "00000000-0000-0000-0000-000000000000";
const STATUSES: Status[] = ["new", "thinking", "queued", "doing", "done", "declined"];

// Идеи: автор видит свои, владелец — все и меняет статусы.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const owner = user.id === OWNER;
  const ideas = await listIdeas(user.id, owner);

  // Владельцу показываем, от кого идея; остальным имена не нужны и не даются.
  let authors: Record<string, string> = {};
  if (owner && ideas.length) {
    try {
      const { data } = await supabaseAdmin().from("users").select("id, name").in("id", [...new Set(ideas.map((i) => i.user_id))]);
      for (const u of ((data as any[]) || [])) authors[String(u.id)] = String(u.name || "");
    } catch {
      /* без имён — не беда */
    }
  }
  return NextResponse.json({ ok: true, owner, ideas, authors });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  // Статус меняет только владелец: это его решение, а не автора.
  if (user.id !== OWNER) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const status = String(body?.status || "") as Status;
  if (!id || !STATUSES.includes(status)) return NextResponse.json({ ok: false }, { status: 400 });

  const ok = await setStatus(id, status, typeof body?.note === "string" ? body.note : undefined);
  return NextResponse.json({ ok });
}
