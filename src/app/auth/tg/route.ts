import { NextRequest, NextResponse } from "next/server";
import crypto, { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setSessionCookie, setThemeCookie } from "@/lib/authCookie";

// Вход через Telegram (кнопка login_url в боте): Telegram передаёт сюда данные
// НАЖАВШЕГО (id, имя, auth_date) с HMAC-подписью секретом бота. Логиним строго
// того, чей Telegram ID пришёл в подписи — чужой человек по пересланному
// сообщению войдёт максимум в СВОЙ аккаунт, а не в аккаунт владельца.
export const runtime = "nodejs";

// Поля, которые подписывает Telegram (наш ?next= в подпись не входит).
const TG_FIELDS = ["auth_date", "first_name", "id", "last_name", "photo_url", "username"];

function destFrom(req: NextRequest): string {
  const next = req.nextUrl.searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dest = destFrom(req);
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const hash = sp.get("hash") || "";

  const checkString = TG_FIELDS.filter((k) => sp.get(k) !== null)
    .map((k) => `${k}=${sp.get(k)}`)
    .sort()
    .join("\n");
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  let valid = false;
  try {
    valid = hash.length === expected.length && crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
  } catch {
    valid = false;
  }
  // Подпись живёт сутки — старую ссылку из истории браузера переиспользовать нельзя.
  const authDate = Number(sp.get("auth_date") || 0);
  const fresh = authDate > 0 && Date.now() / 1000 - authDate < 60 * 60 * 24;

  if (!botToken || !valid || !fresh) {
    return NextResponse.redirect(new URL("/login?e=tg", req.url));
  }

  const tgId = sp.get("id") || "";
  const db = supabaseAdmin();
  const { data: user } = await db.from("users").select("id, session_secret").eq("chat_id", tgId).maybeSingle();
  if (!user) {
    // Telegram подтвердил личность, но аккаунта с таким chat_id нет — пусть начнёт с бота.
    return NextResponse.redirect(new URL("/login?e=tg", req.url));
  }

  let secret: string = (user as any).session_secret || "";
  try {
    if (!secret) {
      const freshSecret = randomUUID();
      const { error } = await db.from("users").update({ session_secret: freshSecret }).eq("id", (user as any).id);
      if (!error) secret = freshSecret;
    }
  } catch {}
  if (!secret) return NextResponse.redirect(new URL("/login?e=tg", req.url));

  const res = NextResponse.redirect(new URL(dest, req.url));
  setSessionCookie(res, secret);
  let theme: string | undefined;
  try {
    const { data: t } = await db.from("users").select("theme").eq("id", (user as any).id).maybeSingle();
    theme = (t as any)?.theme || undefined;
  } catch {}
  setThemeCookie(res, theme);
  return res;
}
