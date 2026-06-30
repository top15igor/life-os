import { supabaseAdmin } from "./supabaseAdmin";
import { resolveHandle, getHandle } from "./handle";
import { sendMessage } from "./telegram";

// Сколько сообщений в сутки может разослать один пользователь (анти-спам).
const DAILY_LIMIT = 20;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const norm = (s?: string | null) => (s || "").toLowerCase().replace(/ё/g, "е").trim();

// Разбор «/send <получатель> текст». Получатель — @имя-ссылка ИЛИ просто имя контакта.
export function parseSend(text?: string | null): { handle: string; message: string } | null {
  if (!text) return null;
  const m = text.match(/^\/send\s+@?(\S{1,40})\s+([\s\S]+)/i);
  if (!m) return null;
  const message = m[2].trim();
  if (!message) return null;
  return { handle: m[1], message: message.slice(0, 2000) };
}

const RELAY: Record<string, any> = {
  ru: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> передаёт тебе через LIFE OS:\n\n«${esc(msg)}»`,
    replyHint: (h: string) => `\n\n↩️ Ответить: <code>/send @${esc(h)} твой текст</code>`,
    sent: (name: string) => `✅ Передал «${esc(name)}».`,
    notFound: "Не нашёл такого человека среди твоих контактов. Можно указать его @имя из LIFE OS (Профиль → имя-ссылка), и он должен пользоваться ботом.",
    notFoundList: (q: string, list: string[]) => `Не нашёл «${esc(q)}» среди твоих контактов. Кому можно написать:\n${list.map((o) => "• " + o).join("\n")}\nИли укажи точное @имя из LIFE OS.`,
    noContacts: "У тебя пока нет контактов в боте, кому можно написать. Пригласи друга (кнопка «Пригласить друга») — или напиши по точному @имени из LIFE OS, если знаешь его. Важно: человек должен пользоваться этим ботом.",
    ambiguous: (opts: string[]) => `Под это имя подходят несколько человек — уточни по @имени:\n${opts.map((o) => "• " + o).join("\n")}\nНапример: <code>/send @имя текст</code>`,
    self: "Это же ты сам 🙂",
    optedOut: "Этот пользователь отключил приём сообщений.",
    limit: `На сегодня лимит (${DAILY_LIMIT}) исчерпан — попробуй завтра.`,
    fail: "Не удалось отправить, попробуй позже.",
    how: "Чтобы передать сообщение другому человеку:\n<code>/send имя текст</code> — по имени контакта,\n<code>/send @имя текст</code> — по @имени-ссылке.\nНапример: <code>/send Аня буду через 10 минут</code>\n\nЧтобы отключить приём сообщений у себя — /relay.",
    on: "🔔 Приём сообщений включён — твои контакты из LIFE OS могут писать тебе через /send.",
    off: "🔕 Приём сообщений выключен. Включить обратно — /relay.",
  },
  en: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> sends you a message via LIFE OS:\n\n“${esc(msg)}”`,
    replyHint: (h: string) => `\n\n↩️ Reply: <code>/send @${esc(h)} your text</code>`,
    sent: (name: string) => `✅ Sent to “${esc(name)}”.`,
    notFound: "Couldn't find that person among your contacts. You can use their LIFE OS @name (Profile → link name), and they must use the bot.",
    notFoundList: (q: string, list: string[]) => `Couldn't find “${esc(q)}” among your contacts. People you can message:\n${list.map((o) => "• " + o).join("\n")}\nOr use their exact LIFE OS @name.`,
    noContacts: "You have no contacts in the bot yet. Invite a friend (the “Invite a friend” button) — or use someone's exact LIFE OS @name if you know it. Note: they must use this bot.",
    ambiguous: (opts: string[]) => `Several people match that name — pick by @name:\n${opts.map((o) => "• " + o).join("\n")}\nE.g.: <code>/send @name text</code>`,
    self: "That's you 🙂",
    optedOut: "This user has turned off incoming messages.",
    limit: `You've hit today's limit (${DAILY_LIMIT}) — try tomorrow.`,
    fail: "Couldn't send, try again later.",
    how: "To relay a message to someone:\n<code>/send name text</code> — by contact name,\n<code>/send @name text</code> — by @link-name.\nE.g.: <code>/send Anna running 10 min late</code>\n\nTo turn off your own inbox — /relay.",
    on: "🔔 Incoming messages on — your LIFE OS contacts can message you via /send.",
    off: "🔕 Incoming messages off. Turn back on — /relay.",
  },
};

function L(lang?: string | null) { return RELAY[lang || "ru"] || (lang === "en" || lang === "fr" ? RELAY.en : RELAY.ru); }

export function relayHelp(lang: string) { return L(lang).how; }
export function relaySentMsg(lang: string, name: string) { return L(lang).sent(name); }
export function relayToggleMsg(lang: string, nowOff: boolean) { return nowOff ? L(lang).off : L(lang).on; }

type Contact = { id: string; name: string | null; chat_id: number | null; lang: string | null; relay_off?: boolean };

// Контакты пользователя в LIFE OS: кого он пригласил, кто пригласил его,
// и с кем он уже переписывался через /send (в обе стороны). Только реальные юзеры бота.
async function getContacts(fromUserId: string): Promise<Contact[]> {
  const db = supabaseAdmin();
  const ids = new Set<string>();
  try {
    const { data } = await db.from("users").select("id").eq("referred_by", fromUserId);
    (data || []).forEach((u: any) => ids.add(u.id));
  } catch {}
  try {
    const { data: me } = await db.from("users").select("referred_by").eq("id", fromUserId).maybeSingle();
    if ((me as any)?.referred_by) ids.add((me as any).referred_by);
  } catch {}
  try {
    const { data: sent } = await db.from("message_relays").select("to_user").eq("from_user", fromUserId);
    (sent || []).forEach((r: any) => ids.add(r.to_user));
    const { data: recv } = await db.from("message_relays").select("from_user").eq("to_user", fromUserId);
    (recv || []).forEach((r: any) => ids.add(r.from_user));
  } catch {}
  ids.delete(fromUserId);
  if (!ids.size) return [];
  const { data } = await db.from("users").select("id, name, chat_id, lang, relay_off").in("id", [...ids]);
  return ((data as any[]) || []).filter((u) => u.chat_id) as Contact[];
}

function nameMatches(full: string | null, query: string): boolean {
  const f = norm(full), n = norm(query);
  if (!f || !n) return false;
  if (f === n) return true;
  const first = f.split(/\s+/)[0];
  if (first === n) return true;
  if (n.length >= 3 && first.startsWith(n)) return true; // «Ан» → «Анна»
  return false;
}

type Resolved =
  | { ok: true; user: Contact }
  | { ok: false; reason: "ambiguous"; options: string[] }
  | { ok: false; reason: "not_found"; contacts: Contact[] };

// Найти получателя: сначала как @имя-ссылку, иначе как имя среди контактов.
async function resolveRecipient(fromUserId: string, raw: string): Promise<Resolved> {
  const clean = raw.replace(/^@+/, "").trim();

  if (/^[a-z0-9_-]{2,30}$/i.test(clean)) {
    const uid = await resolveHandle(clean.toLowerCase());
    if (uid) {
      const { data } = await supabaseAdmin().from("users").select("id, name, chat_id, lang, relay_off").eq("id", uid).maybeSingle();
      if ((data as any)?.chat_id) return { ok: true, user: data as Contact };
    }
  }

  const contacts = await getContacts(fromUserId);
  const matches = contacts.filter((c) => nameMatches(c.name, clean));
  if (matches.length === 1) return { ok: true, user: matches[0] };
  if (matches.length > 1) {
    const options = await Promise.all(
      matches.slice(0, 6).map(async (m) => `@${await getHandle(m.id, m.name).catch(() => "?")} (${m.name || "?"})`)
    );
    return { ok: false, reason: "ambiguous", options };
  }
  return { ok: false, reason: "not_found", contacts };
}

// Список контактов «@имя — Имя» (для подсказки, кому можно написать).
async function contactList(contacts: Contact[]): Promise<string[]> {
  return Promise.all(contacts.slice(0, 12).map(async (c) => `@${await getHandle(c.id, c.name).catch(() => "?")} — ${c.name || "?"}`));
}

// Передать сообщение получателю (по @имени или имени контакта). Возвращает результат для отправителя.
export async function sendRelay(from: { id: string; name: string | null }, recipient: string, message: string, senderLang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const db = supabaseAdmin();
  const SL = L(senderLang);

  const res = await resolveRecipient(from.id, recipient);
  if (res.ok !== true) {
    if (res.reason === "ambiguous") return { ok: false, error: SL.ambiguous(res.options) };
    const list = await contactList(res.contacts);
    return { ok: false, error: list.length ? SL.notFoundList(recipient, list) : SL.noContacts };
  }

  const rcpt = res.user;
  if (rcpt.id === from.id) return { ok: false, error: SL.self };
  if ((rcpt as any).relay_off) return { ok: false, error: SL.optedOut };

  // Анти-спам: не больше DAILY_LIMIT сообщений в сутки (мягко, если таблицы ещё нет).
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db.from("message_relays").select("id", { count: "exact", head: true }).eq("from_user", from.id).gte("created_at", since);
    if ((count || 0) >= DAILY_LIMIT) return { ok: false, error: SL.limit };
  } catch {}

  const rl = L(rcpt.lang);
  const fromHandle = await getHandle(from.id, from.name).catch(() => null);
  let body = rl.incoming(from.name || "LIFE OS", message);
  if (fromHandle) body += rl.replyHint(fromHandle);

  try {
    await sendMessage(rcpt.chat_id!, body);
  } catch {
    return { ok: false, error: SL.fail };
  }
  try { await db.from("message_relays").insert({ from_user: from.id, to_user: rcpt.id, body: message }); } catch {}
  return { ok: true, toName: rcpt.name || recipient };
}

// Переключить приём сообщений. Возвращает новое состояние relay_off (true = выключено).
export async function toggleRelay(userId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db.from("users").select("relay_off").eq("id", userId).maybeSingle();
  const next = !(data as any)?.relay_off;
  try { await db.from("users").update({ relay_off: next }).eq("id", userId); } catch {}
  return next;
}
