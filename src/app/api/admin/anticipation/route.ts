import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAnticipation } from "@/lib/anticipation";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Owner-only тест антиципации: сбрасывает кэш и пересчитывает по текущей логике,
// возвращает результат (без секрета в URL — авторизация по сессии). НЕ шлёт в Telegram.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  try { await supabaseAdmin().from("anticipations").delete().eq("user_id", user.id); } catch {}
  const text = await getAnticipation(user.id, "ru");
  return NextResponse.json({ ok: true, found: !!text, anticipation: text });
}
