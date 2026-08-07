import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runProbes } from "@/lib/probeAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OWNER = "00000000-0000-0000-0000-000000000000";

// Агент-исследователь: сочиняет свежие формулировки и проверяет, понял ли их бот.
//
//   GET /api/probe?key=<CRON_SECRET|REMINDER_KEY>[&n=1][&only=reminder,delete]
//   GET /api/probe                                  — вручную владельцем
//
// n — сколько фраз на каждое семейство (по умолчанию 1: десять семейств = десять проб).
// only — ограничить список семейств, если хочется добить конкретное место.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const ok = (v?: string) => !!v && !!key && key === v;
  let allowed = ok(process.env.CRON_SECRET) || ok(process.env.REMINDER_KEY);
  if (!allowed) {
    const user = await getCurrentUser();
    allowed = !!user && user.id === OWNER;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const nRaw = Number(req.nextUrl.searchParams.get("n"));
  const n = Number.isFinite(nRaw) && nRaw >= 1 && nRaw <= 5 ? Math.floor(nRaw) : 1;
  const only = (req.nextUrl.searchParams.get("only") || "").split(",").map((x) => x.trim()).filter(Boolean);

  const res = await runProbes(req.nextUrl.origin, n, only.length ? only : undefined);
  return NextResponse.json({ ok: res.failed === 0, ...res }, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
