import { supabaseAdmin } from "./supabaseAdmin";

async function plan(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin().from("users").select("plan").eq("id", userId).maybeSingle();
    return (data as any)?.plan || "free";
  } catch {
    return "free";
  }
}

// Премиум-подписка (Биограф, Лаборатория). Мягко: нет колонки plan → не премиум.
export async function isPremium(userId: string): Promise<boolean> {
  return (await plan(userId)) === "premium";
}

// Pro и выше (Pro включает «Что заметил AI»; Премиум включает всё, что Pro).
export async function isPro(userId: string): Promise<boolean> {
  const p = await plan(userId);
  return p === "pro" || p === "premium";
}
