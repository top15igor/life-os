import { supabaseAdmin } from "./supabaseAdmin";

// Премиум-подписка (открывает Биографа и другие премиальные фичи).
// Мягко: если колонки plan ещё нет — считаем, что не премиум.
export async function isPremium(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin().from("users").select("plan").eq("id", userId).maybeSingle();
    return (data as any)?.plan === "premium";
  } catch {
    return false;
  }
}
