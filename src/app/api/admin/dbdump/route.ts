import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendDbDumpToOwner } from "@/lib/dbDump";

export const runtime = "nodejs";
// Сбор всех таблиц + отправка архива — даём запас времени.
export const maxDuration = 60;

const OWNER = "00000000-0000-0000-0000-000000000000";

// Owner-only ручной запуск дампа всей базы: открыть /api/admin/dbdump будучи
// залогиненным владельцем — архив придёт в Telegram. Автозапуск — крон по
// воскресеньям (/api/cron), там же самотест по секрету (?dbdump=).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false, error: "owner only" }, { status: 403 });
  try {
    const r = await sendDbDumpToOwner();
    return NextResponse.json({ ok: r.sent, tables: r.tables, rows: r.rows, bytes: r.bytes, skipped: r.skipped });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
