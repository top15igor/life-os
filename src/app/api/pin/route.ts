import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPin, unlockToken } from "@/lib/pin";

export const runtime = "nodejs";

const COOKIE_OPTS = { httpOnly: true, path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const db = supabaseAdmin();

  let currentHash: string | null = null;
  try {
    const { data } = await db.from("users").select("pin_hash").eq("id", user.id).maybeSingle();
    currentHash = data?.pin_hash || null;
  } catch {
    return NextResponse.json({ ok: false, error: "no_column" }, { status: 200 });
  }

  if (action === "verify") {
    const pin = String(body?.pin || "");
    if (!currentHash || hashPin(pin) !== currentHash) return NextResponse.json({ ok: false });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("lifeos_unlocked", unlockToken(currentHash), COOKIE_OPTS);
    return res;
  }

  if (action === "set") {
    const pin = String(body?.pin || "").trim();
    if (!/^\d{4,8}$/.test(pin)) return NextResponse.json({ ok: false, error: "bad" }, { status: 400 });
    if (currentHash) {
      if (hashPin(String(body?.current || "")) !== currentHash) return NextResponse.json({ ok: false, error: "wrong" });
    }
    const newHash = hashPin(pin);
    await db.from("users").update({ pin_hash: newHash }).eq("id", user.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("lifeos_unlocked", unlockToken(newHash), COOKIE_OPTS);
    return res;
  }

  if (action === "remove") {
    if (currentHash && hashPin(String(body?.current || "")) !== currentHash) return NextResponse.json({ ok: false, error: "wrong" });
    await db.from("users").update({ pin_hash: null }).eq("id", user.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("lifeos_unlocked", "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
