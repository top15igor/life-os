import { supabaseAdmin } from "./supabaseAdmin";
import { getEntries, getGoodDeeds, getDreams, getStreak } from "./queries";

export const DEFAULT_BLOCKS = ["deeds", "dreams", "streak"];
export type PublicConfig = { slug: string; enabled: boolean; bio: string; blocks: string[] };
export type PublicStats = { entries: number; days: number; voice: number; deeds: number; dreamsDone: number; streak: number; memberSince: string | null };

// Конфиг публичной страницы текущего пользователя (для редактора).
export async function getPublicConfig(userId: string): Promise<PublicConfig> {
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("slug, enabled, bio, blocks").eq("user_id", userId).maybeSingle();
    if (data) return { slug: data.slug || "", enabled: !!data.enabled, bio: data.bio || "", blocks: Array.isArray(data.blocks) ? data.blocks : DEFAULT_BLOCKS };
  } catch {
    // таблицы ещё нет
  }
  return { slug: "", enabled: false, bio: "", blocks: DEFAULT_BLOCKS };
}

// Профиль по slug (для публичной страницы) — только включённый.
export async function getPublicBySlug(slug: string): Promise<{ userId: string; name: string; bio: string; blocks: string[] } | null> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("public_profile").select("user_id, bio, blocks, enabled").eq("slug", slug).maybeSingle();
    if (!data || !data.enabled) return null;
    const { data: u } = await db.from("users").select("name").eq("id", data.user_id).maybeSingle();
    return { userId: data.user_id, name: u?.name || "", bio: data.bio || "", blocks: Array.isArray(data.blocks) ? data.blocks : DEFAULT_BLOCKS };
  } catch {
    return null;
  }
}

// Агрегаты за всё время для публичной страницы (без содержимого записей).
export async function getPublicStats(userId: string): Promise<PublicStats> {
  const [all, deeds, dreams, streak] = await Promise.all([
    getEntries(userId, 300),
    getGoodDeeds(userId, 300),
    getDreams(userId),
    getStreak(userId),
  ]);
  const days = new Set(all.map((e: any) => e.entry_date)).size;
  const voice = all.filter((e: any) => e.source === "telegram_voice").length;
  const dates = all.map((e: any) => e.entry_date).filter(Boolean).sort();
  return {
    entries: all.length,
    days,
    voice,
    deeds: deeds.length,
    dreamsDone: dreams.filter((d: any) => d.status === "done").length,
    streak,
    memberSince: dates[0] || null,
  };
}
