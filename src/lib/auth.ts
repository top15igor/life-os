import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabaseAdmin";
import { unlockToken } from "./pin";

export type CurrentUser = { id: string; name: string | null; chat_id: number | null };

// Текущий пользователь по cookie-токену (личная ссылка из бота).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get("lifeos_token")?.value;
  if (!token) return null;
  const { data } = await supabaseAdmin()
    .from("users")
    .select("id, name, chat_id")
    .eq("token", token)
    .maybeSingle();
  return (data as CurrentUser) || null;
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
