import { supabaseAdmin } from "./supabaseAdmin";
import { resolveHandle, getHandle } from "./handle";
import { sendMessage } from "./telegram";

// Сколько сообщений в сутки может разослать один пользователь (анти-спам).
const DAILY_LIMIT = 20;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Разбор команды «/send @handle текст» (собака необязательна).
export function parseSend(text?: string | null): { handle: string; message: string } | null {
  if (!text) return null;
  const m = text.match(/^\/send\s+@?([a-zA-Z0-9_-]{2,30})\s+([\s\S]+)/);
  if (!m) return null;
  const message = m[2].trim();
  if (!message) return null;
  return { handle: m[1].toLowerCase(), message: message.slice(0, 2000) };
}

const RELAY: Record<string, any> = {
  ru: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> передаёт тебе через LIFE OS:\n\n«${esc(msg)}»`,
    replyHint: (h: string) => `\n\n↩️ Ответить: <code>/send @${esc(h)} твой текст</code>`,
    sent: (name: string) => `✅ Передал «${esc(name)}».`,
    notFound: "Не нашёл такого пользователя. Нужно его @имя из LIFE OS, и он должен пользоваться ботом.",
    self: "Это же ты сам 🙂",
    optedOut: "Этот пользователь отключил приём сообщений.",
    limit: `На сегодня лимит (${DAILY_LIMIT}) исчерпан — попробуй завтра.`,
    fail: "Не удалось отправить, попробуй позже.",
    how: "Чтобы передать сообщение другому человеку:\n<code>/send @имя текст</code>\nНапример: <code>/send @anna буду через 10 минут</code>\n\nЧтобы отключить приём сообщений у себя — /relay.",
    on: "🔔 Приём сообщений включён — друзья из LIFE OS могут писать тебе через /send.",
    off: "🔕 Приём сообщений выключен. Включить обратно — /relay.",
  },
  en: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> sends you a message via LIFE OS:\n\n“${esc(msg)}”`,
    replyHint: (h: string) => `\n\n↩️ Reply: <code>/send @${esc(h)} your text</code>`,
    sent: (name: string) => `✅ Sent to “${esc(name)}”.`,
    notFound: "Couldn't find that user. You need their LIFE OS @name, and they must use the bot.",
    self: "That's you 🙂",
    optedOut: "This user has turned off incoming messages.",
    limit: `You've hit today's limit (${DAILY_LIMIT}) — try tomorrow.`,
    fail: "Couldn't send, try again later.",
    how: "To relay a message to someone:\n<code>/send @name text</code>\nE.g.: <code>/send @anna running 10 min late</code>\n\nTo turn off your own inbox — /relay.",
    on: "🔔 Incoming messages on — LIFE OS friends can message you via /send.",
    off: "🔕 Incoming messages off. Turn back on — /relay.",
  },
};

function L(lang?: string | null) { return RELAY[lang || "ru"] || (lang === "en" || lang === "fr" ? RELAY.en : RELAY.ru); }

export function relayHelp(lang: string) { return L(lang).how; }
export function relaySentMsg(lang: string, name: string) { return L(lang).sent(name); }
export function relayToggleMsg(lang: string, nowOff: boolean) { return nowOff ? L(lang).off : L(lang).on; }

// Передать сообщение получателю по его @handle. Возвращает результат для отправителя.
export async function sendRelay(from: { id: string; name: string | null }, handle: string, message: string, senderLang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const db = supabaseAdmin();
  const SL = L(senderLang);

  const toUserId = await resolveHandle(handle);
  if (!toUserId) return { ok: false, error: SL.notFound };
  if (toUserId === from.id) return { ok: false, error: SL.self };

  const { data: rcpt } = await db.from("users").select("chat_id, name, lang, relay_off").eq("id", toUserId).maybeSingle();
  if (!(rcpt as any)?.chat_id) return { ok: false, error: SL.notFound };
  if ((rcpt as any).relay_off) return { ok: false, error: SL.optedOut };

  // Анти-спам: не больше DAILY_LIMIT сообщений в сутки (мягко, если таблицы ещё нет).
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from("message_relays").select("id", { count: "exact", head: true }).eq("from_user", from.id).gte("created_at", since);
    if ((count || 0) >= DAILY_LIMIT) return { ok: false, error: SL.limit };
  } catch {}

  const rl = L((rcpt as any).lang);
  const fromHandle = await getHandle(from.id, from.name).catch(() => null);
  let body = rl.incoming(from.name || "LIFE OS", message);
  if (fromHandle) body += rl.replyHint(fromHandle);

  try {
    await sendMessage((rcpt as any).chat_id, body);
  } catch {
    return { ok: false, error: SL.fail };
  }
  try { await db.from("message_relays").insert({ from_user: from.id, to_user: toUserId, body: message }); } catch {}
  return { ok: true, toName: (rcpt as any).name || handle };
}

// Переключить приём сообщений. Возвращает новое состояние relay_off (true = выключено).
export async function toggleRelay(userId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db.from("users").select("relay_off").eq("id", userId).maybeSingle();
  const next = !(data as any)?.relay_off;
  try { await db.from("users").update({ relay_off: next }).eq("id", userId); } catch {}
  return next;
}
