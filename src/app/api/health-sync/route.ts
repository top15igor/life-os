import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertHealthDays } from "@/lib/healthMetrics";

export const runtime = "nodejs";

// Приём данных из Apple «Команды» (Shortcuts).
// Авторизация — личный токен пользователя (тот же, что в ссылке /u/<token>):
//   заголовок  Authorization: Bearer <token>   или   ?token=<token>
//
// Тело — гибкое:
//   { "day":"2026-06-28", "steps":8421, "sleep_hours":7.3, "hr_resting":58, ... }
//   либо  { "days": [ {...}, {...} ] }   для нескольких дней.
// Любое поле можно опустить — обновятся только присланные.

async function userByToken(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const token = bearer || req.nextUrl.searchParams.get("token")?.trim();
  if (!token) return null;
  const db = supabaseAdmin();
  // Ключ Apple Health — это session_secret (стабильный, НЕ ротируется при входе).
  // Старые шорткаты держат значение, которое после миграции равно session_secret. Фолбэк на token.
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", token).maybeSingle();
    if (data) return data as { id: string };
  } catch {}
  const { data: legacy } = await db.from("users").select("id").eq("token", token).maybeSingle();
  return (legacy as { id: string } | null) || null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const user = await userByToken(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Либо массив days, либо один плоский день (день по умолчанию — сегодня).
  let rawDays: any[];
  if (Array.isArray((body as any).days)) {
    rawDays = (body as any).days;
  } else {
    rawDays = [{ day: (body as any).day || todayISO(), ...body }];
  }

  let saved = 0;
  try {
    saved = await upsertHealthDays(user.id, rawDays, "apple");
  } catch {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved });
}

// Удобно для проверки из браузера: «работает ли мой токен».
export async function GET(req: NextRequest) {
  const user = await userByToken(req);
  return NextResponse.json({ ok: !!user });
}
