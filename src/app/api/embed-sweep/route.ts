import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { backfillShelves } from "@/lib/vaultIndex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Подметает то, что осталось без смыслового указателя.
//
// При сохранении вещь индексируется сразу, но путей сохранения много — бот,
// сайт, импорты, перекладывание с полки на полку, — и какой-нибудь однажды
// забудут. Плюс всё, что человек сложил ДО включения этой памяти. Поэтому раз
// в час проходим и досчитываем: это страховка, а не основной путь.
//
// Ручной запуск владельцем: просто открыть /api/embed-sweep в браузере, где
// он вошёл, — как самопроверка и диагност. Секрет искать не нужно.
// Расписание: Bearer CRON_SECRET (workflow morning-hourly.yml).

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let allowed = !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // ?reindex=memories|notes|saved_items|books|all — пересобрать указатель
  // заново (нужно, когда поменялся рецепт текста для вектора).
  const rq = req.nextUrl.searchParams.get("reindex");
  const reindex = rq && ["memories", "notes", "saved_items", "books", "all"].includes(rq) ? (rq as any) : undefined;

  // По сотне на полку за раз: укладываемся в минуту и не жжём лимиты OpenAI.
  const rows = await backfillShelves(100, reindex);
  const done = rows.reduce((s, r) => s + r.done, 0);
  const left = rows.reduce((s, r) => s + r.left, 0);
  return NextResponse.json({ ok: true, done, left, shelves: rows });
}
