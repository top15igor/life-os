import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

const OWNER = "00000000-0000-0000-0000-000000000000";

export type User = { id: string; token: string; name: string | null; chat_id?: number; isNew?: boolean };

// Находит пользователя по chat_id или создаёт нового (при первом сообщении).
export async function getOrCreateUser(chatId: number, name?: string, referredBy?: string, lang?: string): Promise<User> {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("users")
    .select("id, token, name, lang")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (existing) {
    // Подхватываем актуальные имя/язык из Telegram (имя чинит «кракозябры» из seed).
    const upd: any = {};
    if (name && existing.name !== name) upd.name = name;
    if (lang && (existing as any).lang !== lang) upd.lang = lang;
    if (Object.keys(upd).length) {
      await db.from("users").update(upd).eq("chat_id", chatId);
      return { ...existing, ...upd, isNew: false } as User;
    }
    return { ...existing, isNew: false } as User;
  }

  const id = chatId === 115629292 ? OWNER : randomUUID();
  const token = randomUUID();
  const ref = referredBy && /^[0-9a-f-]{36}$/i.test(referredBy) && referredBy !== id ? referredBy : null;
  const { data, error } = await db
    .from("users")
    .insert({ id, chat_id: chatId, name: name || null, token, referred_by: ref, lang: lang || null })
    .select("id, token, name")
    .single();

  if (error) {
    // Гонка: возможно, пользователь только что создан параллельно.
    const { data: again } = await db.from("users").select("id, token, name").eq("chat_id", chatId).maybeSingle();
    if (again) return { ...again, isNew: false } as User;
    throw error;
  }
  return { ...data, isNew: true } as User;
}
