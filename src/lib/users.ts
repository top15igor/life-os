import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

const OWNER = "00000000-0000-0000-0000-000000000000";

export type User = { id: string; token: string; name: string | null; chat_id?: number };

// Находит пользователя по chat_id или создаёт нового (при первом сообщении).
export async function getOrCreateUser(chatId: number, name?: string): Promise<User> {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("users")
    .select("id, token, name")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (existing) {
    // Подхватываем актуальное имя из Telegram (чинит «кракозябры» из seed).
    if (name && existing.name !== name) {
      await db.from("users").update({ name }).eq("chat_id", chatId);
      return { ...existing, name } as User;
    }
    return existing as User;
  }

  const id = chatId === 115629292 ? OWNER : randomUUID();
  const token = randomUUID();
  const { data, error } = await db
    .from("users")
    .insert({ id, chat_id: chatId, name: name || null, token })
    .select("id, token, name")
    .single();

  if (error) {
    // Гонка: возможно, пользователь только что создан параллельно.
    const { data: again } = await db.from("users").select("id, token, name").eq("chat_id", chatId).maybeSingle();
    if (again) return again as User;
    throw error;
  }
  return data as User;
}
