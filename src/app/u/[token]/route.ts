import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function destFrom(req: NextRequest): string {
  const next = req.nextUrl.searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Есть ли уже валидная сессия в cookie (session_secret или legacy token)?
async function hasSession(req: NextRequest): Promise<boolean> {
  const c = req.cookies.get("lifeos_token")?.value;
  if (!c) return false;
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", c).maybeSingle();
    if (data) return true;
  } catch {}
  const { data: legacy } = await db.from("users").select("id").eq("token", c).maybeSingle();
  return !!legacy;
}

// Вход по ОДНОРАЗОВОЙ ссылке из бота: /u/<token>.
// - cookie получает session_secret (стабильный ключ сессии, НЕ равен коду из URL);
// - сам код входа (users.token) РОТИРУЕТСЯ → этот URL больше никого не пустит
//   (переслал ссылку — она уже «сгорела»). Свежий вход — кнопка /link в боте.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: user } = await db.from("users").select("id, token, session_secret").eq("token", token).maybeSingle();

  if (!user) {
    // Токен «сгорел» (уже использован) или неверен. Если человек уже вошёл — просто ведём по next,
    // чтобы старые ссылки из истории бота не выкидывали на экран входа.
    if (await hasSession(req)) {
      return NextResponse.redirect(new URL(destFrom(req), req.url));
    }
    return NextResponse.redirect(new URL("/login?e=link", req.url));
  }

  // Cookie = session_secret (стабильный ключ сессии). Если колонки нет (миграция не запущена) —
  // мягко откатываемся к старому поведению (cookie = token, без ротации), чтобы ничего не сломать.
  let secret: string = (user as any).session_secret || "";
  let canRotate = !!secret; // session_secret уже есть → колонка точно есть → ротировать безопасно
  try {
    if (!secret) {
      const fresh = randomUUID();
      const { error } = await db.from("users").update({ session_secret: fresh }).eq("id", user.id);
      if (error) { secret = token; canRotate = false; }
      else { secret = fresh; canRotate = true; }
    }
    if (canRotate) {
      // Одноразовость: код входа (token) из URL заменяем на новый — старый URL «сгорает».
      await db.from("users").update({ token: randomUUID() }).eq("id", user.id);
    }
  } catch {
    if (!secret) secret = token;
  }

  const res = NextResponse.redirect(new URL(destFrom(req), req.url));
  res.cookies.set("lifeos_token", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
