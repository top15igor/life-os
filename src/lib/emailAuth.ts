import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import { resolveRefToId } from "./users";

const OWNER = "00000000-0000-0000-0000-000000000000";

export type AuthError = "invalid_email" | "weak_password" | "exists" | "no_user" | "bad_password" | "server";
export type AuthResult = { ok: boolean; token?: string; error?: AuthError };

// ===== Пароли: соль + scrypt (сам пароль не храним) =====
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const orig = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  return orig.length === test.length && timingSafeEqual(orig, test);
}

export function normalizeEmail(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "";
  const clean = local.replace(/[._-]+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

// ===== Регистрация по почте + паролю =====
export async function registerWithEmail(
  rawEmail: string,
  password: string,
  name?: string,
  ref?: string | null
): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false, error: "invalid_email" };
  if (!password || password.length < 6) return { ok: false, error: "weak_password" };

  const db = supabaseAdmin();
  const { data: existing } = await db.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) return { ok: false, error: "exists" };

  const id = randomUUID();
  const token = randomUUID();
  let refId = await resolveRefToId(ref);
  if (refId === id) refId = null;

  const { error } = await db.from("users").insert({
    id,
    email,
    password_hash: hashPassword(password),
    name: (name || "").trim() || nameFromEmail(email) || null,
    token,
    referred_by: refId,
  });

  if (error) {
    // Гонка: почту могли занять параллельно.
    const { data: again } = await db.from("users").select("token").eq("email", email).maybeSingle();
    if (again?.token) return { ok: false, error: "exists" };
    console.error("registerWithEmail", error);
    return { ok: false, error: "server" };
  }
  return { ok: true, token };
}

// ===== Вход по почте + паролю =====
export async function loginWithEmail(rawEmail: string, password: string): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false, error: "invalid_email" };

  const db = supabaseAdmin();
  const { data } = await db
    .from("users")
    .select("token, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (!data) return { ok: false, error: "no_user" };
  if (!verifyPassword(password, (data as any).password_hash)) return { ok: false, error: "bad_password" };
  return { ok: true, token: (data as any).token };
}

// ===== Вход/регистрация через Google (почта уже проверена Google) =====
// Находит аккаунт по почте или создаёт новый (без пароля). Возвращает token-сессию.
export async function findOrCreateGoogleUser(
  rawEmail: string,
  name?: string,
  ref?: string | null
): Promise<{ token: string } | null> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return null;

  const db = supabaseAdmin();
  const { data: existing } = await db.from("users").select("token, name").eq("email", email).maybeSingle();
  if (existing?.token) {
    // Подхватываем имя из Google, если у аккаунта его не было.
    if (name && !(existing as any).name) {
      await db.from("users").update({ name }).eq("email", email);
    }
    return { token: (existing as any).token };
  }

  const id = randomUUID();
  const token = randomUUID();
  let refId = await resolveRefToId(ref);
  if (refId === id) refId = null;

  const { error } = await db.from("users").insert({
    id,
    email,
    name: (name || "").trim() || nameFromEmail(email) || null,
    token,
    referred_by: refId,
  });

  if (error) {
    const { data: again } = await db.from("users").select("token").eq("email", email).maybeSingle();
    if (again?.token) return { token: (again as any).token };
    console.error("findOrCreateGoogleUser", error);
    return null;
  }
  return { token };
}

// ===== Привязка почты/Google к УЖЕ существующему аккаунту (связывание входов) =====
// Если password задан — ставит и пароль (привязка «почта+пароль»); иначе только email (привязка Google).
// Если email занят ДРУГИМ аккаунтом: освобождаем его, только если тот пустой (0 записей) и не владелец.
export async function attachLoginToUser(
  userId: string,
  rawEmail: string,
  password?: string
): Promise<{ ok: boolean; error?: AuthError }> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { ok: false, error: "invalid_email" };
  if (password !== undefined && password.length < 6) return { ok: false, error: "weak_password" };

  const db = supabaseAdmin();
  const { data: other } = await db.from("users").select("id").eq("email", email).maybeSingle();
  if (other && (other as any).id !== userId) {
    const otherId = (other as any).id;
    const { count } = await db
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", otherId);
    if ((count || 0) > 0 || otherId === OWNER) return { ok: false, error: "exists" };
    // Пустой дубль — убираем, чтобы освободить почту.
    await db.from("users").delete().eq("id", otherId);
  }

  const patch: any = { email };
  if (password) patch.password_hash = hashPassword(password);
  const { error } = await db.from("users").update(patch).eq("id", userId);
  if (error) {
    console.error("attachLoginToUser", error);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

export { OWNER };
