import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Отправить сообщение пользователю в Telegram от имени LIFE OS. Только владельцу.
// body: { id, text }
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const text = String(body?.text || "").trim();
  if (!id || !text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const { data } = await supabaseAdmin().from("users").select("chat_id").eq("id", id).maybeSingle();
  const chatId = (data as any)?.chat_id;
  if (!chatId) return NextResponse.json({ ok: false, error: "no_telegram" }, { status: 400 });

  try {
    await sendMessage(Number(chatId), text);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("admin message", e);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }
}
