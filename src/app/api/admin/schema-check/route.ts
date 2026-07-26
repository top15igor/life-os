import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Owner-эндпоинт: проверить, применены ли отложенные SQL-миграции.
// Открой /api/admin/schema-check в браузере, где залогинен владелец, —
// по каждой фиче честное ok / missing (без изменения данных).
const CHECKS: { key: string; table: string; column?: string; note: string }[] = [
  { key: "birthday", table: "users", column: "birthday", note: "birthday.sql — поздравление с ДР" },
  { key: "bday_wished_on", table: "users", column: "bday_wished_on", note: "birthday.sql — отметка «уже поздравил»" },
  { key: "trips", table: "trips", note: "trips.sql — дневник путешествий" },
  { key: "trip_entries", table: "trip_entries", note: "trips.sql — связь поездок с записями" },
  { key: "relay_aliases", table: "relay_aliases", note: "relay_aliases.sql — /send по прозвищам" },
  { key: "free_books_used", table: "users", column: "free_books_used", note: "referral_free_book.sql — «3 друга = книга»" },
  { key: "token_at", table: "users", column: "token_at", note: "link_ttl.sql — срок жизни ссылки входа (1 час)" },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false, error: "owner only" }, { status: 403 });

  const db = supabaseAdmin();
  const results: Record<string, string> = {};
  let missing = 0;
  for (const c of CHECKS) {
    try {
      const sel = c.column ? `id, ${c.column}` : "*";
      const { error } = await db.from(c.table).select(sel).limit(1);
      if (error) {
        results[c.key] = `MISSING — ${c.note}`;
        missing++;
      } else {
        results[c.key] = "ok";
      }
    } catch {
      results[c.key] = `MISSING — ${c.note}`;
      missing++;
    }
  }
  return NextResponse.json({ ok: missing === 0, missing, results });
}
