import { NextRequest, NextResponse } from "next/server";
import { syncBotCommands } from "@/lib/botCommands";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ ok: false, error: "no token" });
  const results = await syncBotCommands();
  return NextResponse.json({ ok: true, results });
}
