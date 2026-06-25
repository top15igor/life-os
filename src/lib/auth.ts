import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabaseAdmin";

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
  return u;
}
