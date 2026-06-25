import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Проверка применённых миграций — только факт существования таблиц/колонок, без данных.
async function tableExists(table: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from(table).select("*", { count: "exact", head: true });
    return !error;
  } catch {
    return false;
  }
}
async function columnExists(table: string, col: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from(table).select(col).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function GET() {
  const checks = {
    entries: await tableExists("entries"),
    users: await tableExists("users"),
    biographer_chats: await tableExists("biographer_chats"),
    users_referred_by: await columnExists("users", "referred_by"),
    life_overview: await tableExists("life_overview"),
    experiments: await tableExists("experiments"),
  };
  return NextResponse.json({ ok: true, checks });
}
