import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Сохранить настройку пуш-уведомлений пользователя (вкл/выкл).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const enabled = Boolean(body?.enabled);

  try {
    await supabaseAdmin().from("users").update({ push_enabled: enabled }).eq("id", user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  }
  return NextResponse.json({ ok: true, enabled });
}
