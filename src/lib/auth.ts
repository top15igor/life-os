import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabaseAdmin";
import { unlockToken } from "./pin";

export type CurrentUser = { id: string; name: string | null; chat_id: number | null };

// Текущий пользователь по cookie-сессии.
// Cookie хранит session_secret (стабильный ключ сессии). Код входа из URL (users.token)
// одноразовый и ротируется при /u — поэтому он НЕ равен значению cookie после миграции.
// Фолбэк на token — для старых сессий до миграции (там cookie ещё == token), чтобы никого не разлогинить.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const c = (await cookies()).get("lifeos_token")?.value;
  if (!c) return null;
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("id, name, chat_id").eq("session_secret", c).maybeSingle();
    if (data) return data as CurrentUser;
  } catch {
    // колонки session_secret ещё нет (миграция не запущена) — падаем на token ниже
  }
  const { data: legacy } = await db.from("users").select("id, name, chat_id").eq("token", c).maybeSingle();
  return (legacy as CurrentUser) || null;
}

// Требует авторизации: если не вошёл — на страницу входа.
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  // PIN-замок: если PIN задан и нет валидной разблокировки — на экран замка.
  let pinHash: string | null = null;
  try {
    const { data } = await supabaseAdmin().from("users").select("pin_hash").eq("id", u.id).maybeSingle();
    pinHash = (data as any)?.pin_hash || null;
  } catch {
    // колонки pin_hash может не быть — тогда замок не используется
  }
  if (pinHash) {
    const unlocked = (await cookies()).get("lifeos_unlocked")?.value;
    if (unlocked !== unlockToken(pinHash)) redirect("/lock");
  }
  return u;
}
