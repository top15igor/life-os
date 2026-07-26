import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getHandle } from "@/lib/handle";
import { inviteShareUrl } from "@/lib/invitePitch";

// Мини-апп «Позвать друга» (/invite-share) присылает сюда initData от Telegram.
// Проверяем подпись (схема Web App: secret = HMAC("WebAppData", bot_token)),
// находим пользователя по его Telegram ID и отдаём готовую ссылку t.me/share.
export const runtime = "nodejs";

// Запасной путь мини-аппа: identity из сессионной куки (если вебвью делит куки
// с браузером, где пользователь уже входил). Отдаёт ту же готовую ссылку t.me/share.
export async function GET(req: NextRequest) {
  const c = req.cookies.get("lifeos_token")?.value;
  if (!c) return NextResponse.json({ ok: false }, { status: 401 });
  const db = supabaseAdmin();
  let user: any = null;
  try {
    const { data } = await db.from("users").select("id, name, lang").eq("session_secret", c).maybeSingle();
    user = data;
  } catch {}
  if (!user) {
    try {
      const { data } = await db.from("users").select("id, name, lang").eq("token", c).maybeSingle();
      user = data;
    } catch {}
  }
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const handle = await getHandle(user.id, user.name);
  return NextResponse.json({ ok: true, share: inviteShareUrl(req.nextUrl.origin, handle, user.lang || "ru") });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initData = String(body?.initData || "");
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!initData || !botToken) return NextResponse.json({ ok: false }, { status: 400 });

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  const checkString = [...params.entries()]
    .filter(([k]) => k !== "hash")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
  let valid = false;
  try {
    valid = hash.length === expected.length && crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
  } catch {
    valid = false;
  }
  const authDate = Number(params.get("auth_date") || 0);
  const fresh = authDate > 0 && Date.now() / 1000 - authDate < 60 * 60;
  if (!valid || !fresh) return NextResponse.json({ ok: false }, { status: 401 });

  let tgId = 0;
  try {
    tgId = Number(JSON.parse(params.get("user") || "{}")?.id || 0);
  } catch {}
  if (!tgId) return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const { data: user } = await db.from("users").select("id, name, lang").eq("chat_id", tgId).maybeSingle();
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });

  const handle = await getHandle((user as any).id, (user as any).name);
  return NextResponse.json({ ok: true, share: inviteShareUrl(req.nextUrl.origin, handle, (user as any).lang || "ru") });
}
