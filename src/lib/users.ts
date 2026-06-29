import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import { resolveHandle } from "./handle";

const OWNER = "00000000-0000-0000-0000-000000000000";

export type User = { id: string; token: string; name: string | null; lang?: string | null; chat_id?: number; isNew?: boolean };

// ===== Короткий код-приглашение (для аккуратных реф-ссылок /i/<code>) =====
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // без похожих 0/o/1/l
function genCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

// Возвращает короткий код пользователя; генерирует и сохраняет при отсутствии.
// Фолбэк (если колонки ref_code ещё нет) — сам userId, старый формат продолжит работать.
export async function getInviteCode(userId: string): Promise<string> {
  const db = supabaseAdmin();
  try {
    const { data } = await db.from("users").select("ref_code").eq("id", userId).maybeSingle();
    if (data?.ref_code) return data.ref_code;
    for (let i = 0; i < 6; i++) {
      const code = genCode();
      const { error } = await db.from("users").update({ ref_code: code }).eq("id", userId);
      if (!error) {
        const { data: chk } = await db.from("users").select("ref_code").eq("id", userId).maybeSingle();
        if (chk?.ref_code) return chk.ref_code;
      }
    }
  } catch {}
  return userId;
}

// Преобразует @username, короткий код ИЛИ legacy-UUID из ссылки в id пригласившего.
export async function resolveRefToId(raw?: string | null): Promise<string | null> {
  if (!raw) return null;
  const db = supabaseAdmin();
  // 1) короткий случайный ref_code
  if (/^[a-z0-9]{4,12}$/i.test(raw)) {
    try {
      const { data } = await db.from("users").select("id").eq("ref_code", raw).maybeSingle();
      if (data?.id) return data.id;
    } catch {}
  }
  // 2) человекочитаемый @username (public_profile.slug) — /i/igor
  const viaHandle = await resolveHandle(raw);
  if (viaHandle) return viaHandle;
  // 3) legacy: ссылка со старым ?ref=<UUID>
  if (/^[0-9a-f-]{36}$/i.test(raw)) return raw;
  return null;
}

// Находит пользователя по chat_id или создаёт нового (при первом сообщении).
export async function getOrCreateUser(chatId: number, name?: string, referredBy?: string, lang?: string): Promise<User> {
  const db = supabaseAdmin();

  const { data: existing } = await db
    .from("users")
    .select("id, token, name, lang")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (existing) {
    // Подхватываем актуальное имя из Telegram (чинит «кракозябры» из seed).
    // Язык из Telegram ставим ТОЛЬКО как первый дефолт (если ещё не задан) —
    // НЕ перетираем выбор пользователя (через /lang в боте или в Профиле).
    const upd: any = {};
    if (name && existing.name !== name) upd.name = name;
    if (lang && !(existing as any).lang) upd.lang = lang;
    if (Object.keys(upd).length) {
      await db.from("users").update(upd).eq("chat_id", chatId);
      return { ...existing, ...upd, isNew: false } as User;
    }
    return { ...existing, isNew: false } as User;
  }

  const id = chatId === 115629292 ? OWNER : randomUUID();
  const token = randomUUID();
  let ref = await resolveRefToId(referredBy);
  if (ref === id) ref = null;
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
  return { ...data, lang: lang || null, isNew: true } as User;
}
