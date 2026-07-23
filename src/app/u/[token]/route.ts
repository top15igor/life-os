import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setThemeCookie } from "@/lib/authCookie";

export const runtime = "nodejs";

function destFrom(req: NextRequest): string {
  const next = req.nextUrl.searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// id пользователя текущей сессии в cookie (session_secret или legacy token), либо null.
async function sessionUserId(req: NextRequest): Promise<string | null> {
  const c = req.cookies.get("lifeos_token")?.value;
  if (!c) return null;
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id").eq("session_secret", c).maybeSingle();
    if (data) return (data as any).id;
  } catch {}
  try {
    const { data: legacy } = await db.from("users").select("id").eq("token", c).maybeSingle();
    return (legacy as any)?.id || null;
  } catch {
    return null;
  }
}

// Вход по ОДНОРАЗОВОЙ ссылке из бота: /u/<token>.
// - cookie получает session_secret (стабильный ключ сессии, НЕ равен коду из URL);
// - сам код входа (users.token) РОТИРУЕТСЯ → этот URL больше никого не пустит
//   (переслал ссылку — она уже «сгорела»). Свежий вход — кнопка /link в боте.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: user } = await db.from("users").select("id, token, session_secret").eq("token", token).maybeSingle();

  // id текущей сессии в браузере (нужно и для guard'а, и для ветки «токен сгорел»).
  const curId = await sessionUserId(req);

  if (!user) {
    // Токен «сгорел» (уже использован) или неверен. Если человек уже вошёл — просто ведём по next,
    // чтобы старые ссылки из истории бота не выкидывали на экран входа.
    if (curId) {
      return NextResponse.redirect(new URL(destFrom(req), req.url));
    }
    return NextResponse.redirect(new URL("/login?e=link", req.url));
  }

  // Защита от «переслал ссылку — чужой молча зашёл в твой аккаунт»: если в браузере
  // уже есть сессия ДРУГОГО пользователя, не переключаем тихо — просим подтвердить.
  // (?sw=1 приходит со страницы подтверждения — тогда переключаем.)
  const confirmed = req.nextUrl.searchParams.get("sw") === "1";
  if (curId && curId !== user.id && !confirmed) {
    return NextResponse.redirect(new URL(`/switch?t=${encodeURIComponent(token)}`, req.url));
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
  // Тема аккаунта → кука (best-effort; если колонки нет, вход не ломается).
  let theme: string | undefined;
  try {
    const { data: t } = await db.from("users").select("theme").eq("id", user.id).maybeSingle();
    theme = (t as any)?.theme || undefined;
  } catch {}
  setThemeCookie(res, theme);
  return res;
}
