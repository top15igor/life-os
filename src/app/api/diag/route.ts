import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyze } from "@/lib/ai";

export const runtime = "nodejs";

const OWNER = process.env.OWNER_USER_ID || "00000000-0000-0000-0000-000000000000";

// Диагностика: проверяет переменные, Supabase (чтение + тестовая вставка) и Claude.
// Открыть: https://САЙТ/api/diag?key=СЕКРЕТ
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const out: Record<string, unknown> = {
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
    // JSON.stringify покажет кавычки, пробелы и переводы строк, если они есть.
    supabaseUrlRaw: JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
  };

  // 1) Supabase: чтение
  try {
    const { error, count } = await supabaseAdmin()
      .from("entries")
      .select("*", { count: "exact", head: true });
    out.supabaseRead = error ? { ok: false, error: error.message } : { ok: true, count };
  } catch (e: any) {
    out.supabaseRead = { ok: false, error: e?.message || String(e) };
  }

  // 2) Supabase: тестовая вставка + удаление
  try {
    const { data, error } = await supabaseAdmin()
      .from("entries")
      .insert({ user_id: OWNER, raw_text: "diag test", source: "web", mood: 5 })
      .select()
      .single();
    if (error) {
      out.supabaseInsert = { ok: false, error: error.message, details: (error as any).details };
    } else {
      out.supabaseInsert = { ok: true, id: data.id };
      await supabaseAdmin().from("entries").delete().eq("id", data.id);
    }
  } catch (e: any) {
    out.supabaseInsert = { ok: false, error: e?.message || String(e) };
  }

  // 3) Claude
  try {
    const a = await analyze("Тест. Сегодня хороший день, настроение отличное.");
    out.anthropic = { ok: true, summary: a.summary, categories: a.categories };
  } catch (e: any) {
    out.anthropic = { ok: false, error: e?.message || String(e), status: e?.status };
  }

  return NextResponse.json(out);
}
