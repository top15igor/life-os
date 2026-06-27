import { supabaseAdmin } from "./supabaseAdmin";

export type Path = { id: string; title: string; description: string; emoji: string; accent: string; status: string; public: boolean; pages: number };
export type PathPage = { id: string; title: string; text: string; created_at: string };

// Пути пользователя + число привязанных страниц (для редактора).
export async function getPaths(userId: string): Promise<Path[]> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("paths").select("id, title, description, emoji, accent, status, public").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    const list = (data as any[]) || [];
    if (!list.length) return [];
    const { data: counts } = await db.from("public_pages").select("path_id").eq("user_id", userId);
    const byPath: Record<string, number> = {};
    for (const c of counts || []) if (c.path_id) byPath[c.path_id] = (byPath[c.path_id] || 0) + 1;
    return list.map((p) => ({ id: p.id, title: p.title, description: p.description || "", emoji: p.emoji || "", accent: p.accent || "indigo", status: p.status || "active", public: !!p.public, pages: byPath[p.id] || 0 }));
  } catch {
    return [];
  }
}

// Путь по id для публичной страницы (только если публичный) + имя автора.
export async function getPublicPath(id: string): Promise<{ id: string; userId: string; title: string; description: string; emoji: string; accent: string; status: string; name: string } | null> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("paths").select("id, user_id, title, description, emoji, accent, status, public").eq("id", id).maybeSingle();
    if (!data || !data.public) return null;
    const { data: u } = await db.from("users").select("name").eq("id", data.user_id).maybeSingle();
    return { id: data.id, userId: data.user_id, title: data.title, description: data.description || "", emoji: data.emoji || "", accent: data.accent || "indigo", status: data.status || "active", name: u?.name || "" };
  } catch {
    return null;
  }
}

// Страницы пути в хронологическом порядке (таймлайн). Только публичные.
export async function getPathPages(pathId: string): Promise<PathPage[]> {
  try {
    const { data } = await supabaseAdmin().from("public_pages").select("id, title, text, created_at").eq("path_id", pathId).eq("privacy", "public").order("created_at", { ascending: true }).limit(200);
    return (data as PathPage[]) || [];
  } catch {
    return [];
  }
}
