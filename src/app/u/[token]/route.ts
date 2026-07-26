import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setThemeCookie } from "@/lib/authCookie";
import { sendMessage } from "@/lib/telegram";

// Предупреждение владельцу, когда его ссылку входа открыл кто-то другой.
const LEAK_WARN: Record<string, string> = {
  ru: "⚠️ Твою ссылку входа только что открыл кто-то другой — обычно так бывает, когда пересылают сообщение бота с кнопкой. Я погасил ссылку: по ней никто не вошёл, твои данные в порядке. Свежую ссылку даст команда /link.",
  en: "⚠️ Someone else just opened your sign-in link — this usually happens when a bot message with a button gets forwarded. I've burned the link: nobody got in, your data is safe. Get a fresh one with /link.",
  uk: "⚠️ Твоє посилання входу щойно відкрив хтось інший — зазвичай так буває, коли пересилають повідомлення бота з кнопкою. Я погасив посилання: ніхто не увійшов, твої дані в порядку. Свіже посилання дасть команда /link.",
  fr: "⚠️ Quelqu'un d'autre vient d'ouvrir ton lien de connexion — cela arrive souvent quand un message du bot avec un bouton est transféré. J'ai désactivé le lien : personne n'est entré, tes données sont en sécurité. Obtiens-en un nouveau avec /link.",
  es: "⚠️ Alguien más acaba de abrir tu enlace de acceso — suele pasar cuando se reenvía un mensaje del bot con un botón. He anulado el enlace: nadie entró, tus datos están a salvo. Consigue uno nuevo con /link.",
};

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
  // token_at может ещё не существовать (link_ttl.sql не применён) — мягкий фолбэк без TTL.
  let hasTokenAt = true;
  let q = await db.from("users").select("id, token, session_secret, name, chat_id, lang, token_at").eq("token", token).maybeSingle();
  if (q.error) {
    hasTokenAt = false;
    q = await db.from("users").select("id, token, session_secret, name, chat_id, lang").eq("token", token).maybeSingle();
  }
  let user = q.data as any;

  // TTL: ссылка входа живёт 1 час с выдачи (/link ротирует токен и ставит token_at).
  // token_at = null (старые строки) считаем истёкшим — свежую ссылку даст /link.
  if (user && hasTokenAt) {
    const issued = user.token_at ? Date.parse(String(user.token_at)) : 0;
    if (!issued || Date.now() - issued > 60 * 60 * 1000) user = null;
  }

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

  // Защита от «переслал ссылку — чужой зашёл в твой аккаунт»: если в браузере уже
  // есть сессия ДРУГОГО пользователя — значит, ссылка ушла из рук владельца
  // (обычно переслали сообщение бота с кнопкой). Раньше здесь была страница с
  // кнопкой «всё равно войти» — теперь входа нет вовсе: ссылку СЖИГАЕМ на месте,
  // владельца предупреждаем в боте, открывшего оставляем в его аккаунте.
  if (curId && curId !== user.id) {
    // Ротация токена безопасна, только если сессии живут на session_secret
    // (иначе legacy-cookie владельца = token, и ротация разлогинит его самого).
    if ((user as any).session_secret) {
      try {
        const rot = { token: randomUUID(), token_at: new Date().toISOString() };
        const { error } = await db.from("users").update(rot).eq("id", user.id);
        if (error) await db.from("users").update({ token: rot.token }).eq("id", user.id);
      } catch {}
    }
    if ((user as any).chat_id) {
      const warn = LEAK_WARN[(user as any).lang] || LEAK_WARN.ru;
      sendMessage(Number((user as any).chat_id), warn).catch(() => {});
    }
    const who = encodeURIComponent(String((user as any).name || ""));
    return NextResponse.redirect(new URL(`/switch?burned=1&who=${who}`, req.url));
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
      const rot = { token: randomUUID(), token_at: new Date().toISOString() };
      const { error } = await db.from("users").update(rot).eq("id", user.id);
      if (error) await db.from("users").update({ token: rot.token }).eq("id", user.id);
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
