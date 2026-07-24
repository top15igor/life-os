import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import { resolveHandle } from "./handle";

const OWNER = "00000000-0000-0000-0000-000000000000";

export type User = { id: string; token: string; name: string | null; lang?: string | null; chat_id?: number; isNew?: boolean };

// ===== Настройка: показывать полную расшифровку голоса под ответом бота =====
// По умолчанию ВКЛ (помогает поймать кривое распознавание, напр. сумм). Защищённо:
// если колонки show_voice_text ещё нет — считаем, что включено.
export async function getVoiceTextPref(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin().from("users").select("show_voice_text").eq("id", userId).maybeSingle();
    if (error) return true;
    const v = (data as any)?.show_voice_text;
    return v === null || v === undefined ? true : !!v;
  } catch {
    return true;
  }
}

// Меняет настройку и возвращает новое значение (или null, если колонки нет).
export async function setVoiceTextPref(userId: string, on: boolean): Promise<boolean | null> {
  try {
    const { error } = await supabaseAdmin().from("users").update({ show_voice_text: on }).eq("id", userId);
    if (error) return null;
    return on;
  } catch {
    return null;
  }
}

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

// Лучшая попытка сохранить настоящий Telegram-@username (из message.from.username).
// Мягко: если колонки tg_username ещё нет — тихо игнорируем.
export async function noteTgUsername(userId: string, username?: string | null): Promise<void> {
  const u = (username || "").trim();
  if (!u) return;
  try {
    await supabaseAdmin().from("users").update({ tg_username: u }).eq("id", userId);
  } catch {}
}

// Находит пользователя по chat_id или создаёт нового (при первом сообщении).
// source — канал привлечения из помеченной ссылки t.me/<bot>?start=src_<slug>;
// пишется только при создании (существующему пользователю источник не меняем).
export async function getOrCreateUser(chatId: number, name?: string, referredBy?: string, lang?: string, source?: string): Promise<User> {
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
  const row: any = { id, chat_id: chatId, name: name || null, token, referred_by: ref, lang: lang || null };
  if (source) row.source = source;
  let { data, error } = await db.from("users").insert(row).select("id, token, name").single();

  // Защита: если колонки source ещё нет в базе (SQL не применён) —
  // регистрация не должна падать, пробуем без источника.
  if (error && source) {
    delete row.source;
    ({ data, error } = await db.from("users").insert(row).select("id, token, name").single());
  }

  if (error) {
    // Гонка: возможно, пользователь только что создан параллельно.
    const { data: again } = await db.from("users").select("id, token, name").eq("chat_id", chatId).maybeSingle();
    if (again) return { ...again, isNew: false } as User;
    throw error;
  }
  return { ...data, lang: lang || null, isNew: true } as User;
}

// ===== Связка веб-аккаунта с ботом =====
// Веб-аккаунт (почта/Google) кладёт одноразовый tg_link_token в deep-link
// t.me/<bot>?start=link_<token>. Пользователь жмёт → бот вызывает это, привязывая
// свой chat_id к веб-аккаунту. Пустой телеграм-аккаунт, случайно созданный на этот
// chat_id, удаляется; телеграм с реальными записями НЕ трогаем (reason "tg_busy").
export type LinkTgResult =
  | { ok: true; user: { id: string; token: string }; already?: boolean }
  | { ok: false; reason: "expired" | "tg_busy" | "server" };

export async function linkTelegramToWebUser(
  chatId: number,
  linkToken: string,
  from?: { first_name?: string; username?: string; language_code?: string }
): Promise<LinkTgResult> {
  const db = supabaseAdmin();
  if (!linkToken || linkToken.length < 8) return { ok: false, reason: "expired" };

  const { data: web } = await db
    .from("users")
    .select("id, token, name, chat_id, lang")
    .eq("tg_link_token", linkToken)
    .maybeSingle();
  if (!web) return { ok: false, reason: "expired" };
  const webUser = web as any;

  // Уже привязан к этому же телеграму — просто гасим токен.
  if (webUser.chat_id != null && Number(webUser.chat_id) === chatId) {
    await db.from("users").update({ tg_link_token: null }).eq("id", webUser.id);
    return { ok: true, user: { id: webUser.id, token: webUser.token }, already: true };
  }

  // Аккаунт, который сейчас держит этот chat_id (мог быть создан ботом «пустым»).
  const { data: ex } = await db.from("users").select("id").eq("chat_id", chatId).maybeSingle();
  if (ex && (ex as any).id !== webUser.id) {
    const exId = (ex as any).id;
    if (exId === OWNER) return { ok: false, reason: "tg_busy" };
    const { count } = await db.from("entries").select("id", { count: "exact", head: true }).eq("user_id", exId);
    if ((count || 0) > 0) return { ok: false, reason: "tg_busy" }; // в этом телеграме есть свой дневник — не трогаем
    await db.from("users").delete().eq("id", exId); // пустой дубль — освобождаем chat_id
  }

  const patch: Record<string, any> = { chat_id: chatId, tg_link_token: null };
  if (!webUser.name && from?.first_name) patch.name = from.first_name;
  if (!webUser.lang && from?.language_code) patch.lang = String(from.language_code).slice(0, 2).toLowerCase();

  const { error } = await db.from("users").update(patch).eq("id", webUser.id);
  if (error) {
    console.error("linkTelegramToWebUser", error);
    return { ok: false, reason: "server" };
  }
  return { ok: true, user: { id: webUser.id, token: webUser.token } };
}

// Генерирует новый одноразовый токен связки для веб-аккаунта и возвращает его.
export async function issueTgLinkToken(userId: string): Promise<string | null> {
  const token = randomUUID().replace(/-/g, "");
  try {
    const { error } = await supabaseAdmin().from("users").update({ tg_link_token: token }).eq("id", userId);
    if (error) return null;
    return token;
  } catch {
    return null;
  }
}
