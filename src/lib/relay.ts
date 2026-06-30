import { supabaseAdmin } from "./supabaseAdmin";
import { resolveHandle, getHandle } from "./handle";
import { sendMessage } from "./telegram";

// Сколько сообщений в сутки может разослать один пользователь (анти-спам).
const DAILY_LIMIT = 20;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const norm = (s?: string | null) => (s || "").toLowerCase().replace(/ё/g, "е").trim();

// Разбор «/send <получатель> текст». Получатель — @имя-ссылка ИЛИ имя/прозвище контакта.
export function parseSend(text?: string | null): { handle: string; message: string } | null {
  if (!text) return null;
  const m = text.match(/^\/send\s+@?(\S{1,40})\s+([\s\S]+)/i);
  if (!m) return null;
  const message = m[2].trim();
  if (!message) return null;
  return { handle: m[1], message: message.slice(0, 2000) };
}

// Разбор «/nick <@имя|имя> <прозвище>». Прозвище — одно слово (без пробелов).
export function parseNick(text?: string | null): { recipient: string; alias: string } | null {
  if (!text) return null;
  const m = text.match(/^\/nick\s+@?(\S{1,40})\s+(\S{1,40})\s*$/i);
  if (!m) return null;
  return { recipient: m[1], alias: m[2] };
}

// Разбор «/unnick <прозвище>».
export function parseUnnick(text?: string | null): { alias: string } | null {
  const m = text?.match(/^\/unnick\s+@?(\S{1,40})\s*$/i);
  return m ? { alias: m[1] } : null;
}

// Естественная фраза «передай/скажи/напиши <кому> [что] <текст>» (в т.ч. распознанная с голоса).
export function parseRelayPhrase(text?: string | null): { recipient: string; message: string } | null {
  if (!text) return null;
  const m = text.match(/^\s*(?:передай(?:те)?|перешли(?:те)?|скажи(?:те)?|напиши(?:те)?)\s+@?([^\s,;:.!?]{2,40})[,;:.\s]+(?:что(?:бы)?\s+)?([\s\S]+)/i);
  if (!m) return null;
  const message = m[2].trim();
  if (!message) return null;
  return { recipient: m[1], message: message.slice(0, 2000) };
}

const RELAY: Record<string, any> = {
  ru: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> передаёт тебе через LIFE OS:\n\n«${esc(msg)}»`,
    replyHint: (h: string) => `\n\n↩️ Ответить: <code>/send @${esc(h)} твой текст</code>`,
    sent: (name: string) => `✅ Передал «${esc(name)}».`,
    notFound: "Не нашёл такого человека среди твоих контактов. Можно указать его @имя из LIFE OS (Профиль → имя-ссылка), и он должен пользоваться ботом.",
    notFoundList: (q: string, list: string[]) => `Не нашёл «${esc(q)}». Кому можно написать — нажми команду (скопируется) и допиши сообщение:\n\n${list.join("\n")}`,
    noContacts: "У тебя пока нет контактов в боте, кому можно написать. Пригласи друга (кнопка «Пригласить друга») — или напиши по точному @имени из LIFE OS, если знаешь его. Важно: человек должен пользоваться этим ботом.",
    ambiguous: (opts: string[]) => `Несколько человек с таким именем — нажми команду нужного (скопируется) и допиши текст:\n\n${opts.join("\n")}`,
    self: "Это же ты сам 🙂",
    optedOut: "Этот пользователь отключил приём сообщений.",
    limit: `На сегодня лимит (${DAILY_LIMIT}) исчерпан — попробуй завтра.`,
    fail: "Не удалось отправить, попробуй позже.",
    how: "Чтобы передать сообщение другому человеку:\n<code>/send имя текст</code> — по имени контакта,\n<code>/send @имя текст</code> — по @имени-ссылке.\nНапример: <code>/send Аня буду через 10 минут</code>\n\nЧтобы отключить приём сообщений у себя — /relay.",
    on: "🔔 Приём сообщений включён — твои контакты из LIFE OS могут писать тебе через /send.",
    off: "🔕 Приём сообщений выключен. Включить обратно — /relay.",
    nickHow: "Чтобы называть человека своим именем (как у тебя в контактах):\n<code>/nick @имя прозвище</code>\nНапример: <code>/nick @evgeniya Котик</code>\nПотом просто пиши: <code>/send Котик привет</code>",
    nickSaved: (alias: string, name: string) => `✅ Готово — теперь «${esc(alias)}» это <b>${esc(name)}</b>.\nПиши: <code>/send ${esc(alias)} текст</code>`,
    nicksEmpty: "У тебя пока нет прозвищ. Задать: <code>/nick @имя Прозвище</code>.",
    nicksList: (lines: string[]) => `🏷 Твои прозвища:\n${lines.join("\n")}`,
    nickRemoved: (a: string) => `✅ Удалил прозвище «${esc(a)}».`,
    nickNone: (a: string) => `Прозвища «${esc(a)}» у тебя нет. Список — /nicks.`,
    notReachable: "Этот человек ещё не пользуется ботом — доставить пока некуда.",
  },
  en: {
    incoming: (name: string, msg: string) => `📨 <b>${esc(name)}</b> sends you a message via LIFE OS:\n\n“${esc(msg)}”`,
    replyHint: (h: string) => `\n\n↩️ Reply: <code>/send @${esc(h)} your text</code>`,
    sent: (name: string) => `✅ Sent to “${esc(name)}”.`,
    notFound: "Couldn't find that person among your contacts. You can use their LIFE OS @name (Profile → link name), and they must use the bot.",
    notFoundList: (q: string, list: string[]) => `Couldn't find “${esc(q)}”. People you can message — tap a command (it copies) and add your text:\n\n${list.join("\n")}`,
    noContacts: "You have no contacts in the bot yet. Invite a friend (the “Invite a friend” button) — or use someone's exact LIFE OS @name if you know it. Note: they must use this bot.",
    ambiguous: (opts: string[]) => `Several people match that name — tap the right one's command (it copies) and add your text:\n\n${opts.join("\n")}`,
    self: "That's you 🙂",
    optedOut: "This user has turned off incoming messages.",
    limit: `You've hit today's limit (${DAILY_LIMIT}) — try tomorrow.`,
    fail: "Couldn't send, try again later.",
    how: "To relay a message to someone:\n<code>/send name text</code> — by contact name,\n<code>/send @name text</code> — by @link-name.\nE.g.: <code>/send Anna running 10 min late</code>\n\nTo turn off your own inbox — /relay.",
    on: "🔔 Incoming messages on — your LIFE OS contacts can message you via /send.",
    off: "🔕 Incoming messages off. Turn back on — /relay.",
    nickHow: "To call someone by your own name (like in your contacts):\n<code>/nick @name nickname</code>\nE.g.: <code>/nick @evgeniya Kitty</code>\nThen just write: <code>/send Kitty hi</code>",
    nickSaved: (alias: string, name: string) => `✅ Done — “${esc(alias)}” is now <b>${esc(name)}</b>.\nWrite: <code>/send ${esc(alias)} text</code>`,
    nicksEmpty: "You have no nicknames yet. Set one: <code>/nick @name Nickname</code>.",
    nicksList: (lines: string[]) => `🏷 Your nicknames:\n${lines.join("\n")}`,
    nickRemoved: (a: string) => `✅ Removed nickname “${esc(a)}”.`,
    nickNone: (a: string) => `You have no nickname “${esc(a)}”. List — /nicks.`,
    notReachable: "This person doesn't use the bot yet — nowhere to deliver.",
  },
};

function L(lang?: string | null) { return RELAY[lang || "ru"] || (lang === "en" || lang === "fr" ? RELAY.en : RELAY.ru); }

export function relayHelp(lang: string) { return L(lang).how; }
export function relaySentMsg(lang: string, name: string) { return L(lang).sent(name); }
export function relayToggleMsg(lang: string, nowOff: boolean) { return nowOff ? L(lang).off : L(lang).on; }
export function nickHelp(lang: string) { return L(lang).nickHow; }

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
  return fetchUsers([...ids]);
}

// Выборка пользователей. Устойчиво к отсутствию колонки relay_off (если миграция
// ещё не применена) — тогда повторяем запрос без неё, чтобы контакты всё равно нашлись.
async function fetchUsers(ids: string[]): Promise<Contact[]> {
  const db = supabaseAdmin();
  let q: any = await db.from("users").select("id, name, chat_id, lang, relay_off").in("id", ids);
  if (q.error) q = await db.from("users").select("id, name, chat_id, lang").in("id", ids);
  return (((q.data as any[]) || []).filter((u) => u.chat_id)) as Contact[];
}

async function fetchUser(id: string): Promise<Contact | null> {
  const db = supabaseAdmin();
  let q: any = await db.from("users").select("id, name, chat_id, lang, relay_off").eq("id", id).maybeSingle();
  if (q.error) q = await db.from("users").select("id, name, chat_id, lang").eq("id", id).maybeSingle();
  return (q.data as any) || null;
}

// Сравнение с допуском на склонения: общий префикс ≥3 и почти вся длина
// («котик»/«котику», «евгения»/«евгении»). Точное совпадение — всегда true.
function looseEq(a?: string | null, b?: string | null): boolean {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return i >= 3 && i >= long.length - 2;
}

function nameMatches(full: string | null, query: string): boolean {
  const f = norm(full);
  if (!f) return false;
  if (looseEq(f, query)) return true;
  return looseEq(f.split(/\s+/)[0], query);
}

type Resolved =
  | { ok: true; user: Contact }
  | { ok: false; reason: "ambiguous"; matches: Contact[] }
  | { ok: false; reason: "not_found"; contacts: Contact[] };

const ACT: Record<string, any> = {
  ru: { active: "активно пишет", warm: "пишет иногда", started: "давно не заходил", idle: "ещё не писал", entries: (n: number) => `${n} зап.` },
  en: { active: "active", warm: "writes sometimes", started: "long inactive", idle: "hasn't written", entries: (n: number) => `${n} entr.` },
};

// Обогащённые строки контактов: «@имя — Имя · активность · N записей» — чтобы
// различить тёзок (две «Евгении») и понять, кому именно писать.
async function enrichLines(contacts: Contact[], lang: string): Promise<string[]> {
  const A = ACT[lang] || (lang === "en" || lang === "fr" ? ACT.en : ACT.ru);
  const db = supabaseAdmin();
  const ids = contacts.map((c) => c.id);
  const cnt: Record<string, number> = {};
  const last: Record<string, string> = {};
  try {
    const { data } = await db.from("entries").select("user_id, entry_date").in("user_id", ids);
    for (const r of (data as any[]) || []) {
      const u = r.user_id as string;
      cnt[u] = (cnt[u] || 0) + 1;
      const d = (r.entry_date || "") as string;
      if (d && (!last[u] || d > last[u])) last[u] = d;
    }
  } catch {}
  const today = new Date(Date.now()).toISOString().slice(0, 10);
  const status = (id: string): string => {
    const c = cnt[id] || 0;
    const ds = last[id] ? Math.floor((Date.parse(today) - Date.parse(last[id])) / 86400000) : Infinity;
    if (c === 0) return A.idle;
    if (ds <= 7 && c >= 3) return A.active;
    if (ds <= 30 || c >= 5) return A.warm;
    return A.started;
  };
  return Promise.all(
    contacts.map(async (c) => {
      const h = await getHandle(c.id, c.name).catch(() => "?");
      const n = cnt[c.id] || 0;
      // Команду оборачиваем в <code>: Telegram не превратит @имя в ссылку на чужой
      // аккаунт, а по тапу строка скопируется — останется дописать текст.
      return `<code>/send @${h}</code> — ${esc(c.name || "?")} · ${status(c.id)}${n ? " · " + A.entries(n) : ""}`;
    })
  );
}

// Прозвище, заданное владельцем для контакта (relay_aliases) → id получателя.
async function aliasTarget(ownerId: string, name: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin().from("relay_aliases").select("target_id, alias").eq("owner_id", ownerId);
    const hit = ((data as any[]) || []).find((a) => looseEq(a.alias, name));
    return hit ? (hit.target_id as string) : null;
  } catch {
    return null;
  }
}

// Найти получателя: сначала своё прозвище, затем @имя-ссылка, затем имя среди контактов.
async function resolveRecipient(fromUserId: string, raw: string): Promise<Resolved> {
  const clean = raw.replace(/^@+/, "").trim();

  const aTarget = await aliasTarget(fromUserId, clean);
  if (aTarget) {
    const u = await fetchUser(aTarget);
    if (u?.chat_id) return { ok: true, user: u };
  }

  if (/^[a-z0-9_-]{2,30}$/i.test(clean)) {
    const uid = await resolveHandle(clean.toLowerCase());
    if (uid) {
      const u = await fetchUser(uid);
      if (u?.chat_id) return { ok: true, user: u };
    }
  }

  const contacts = await getContacts(fromUserId);
  const matches = contacts.filter((c) => nameMatches(c.name, clean));
  if (matches.length === 1) return { ok: true, user: matches[0] };
  if (matches.length > 1) return { ok: false, reason: "ambiguous", matches: matches.slice(0, 8) };
  return { ok: false, reason: "not_found", contacts };
}

// Доставка уже найденному получателю (проверки + отправка + лог).
async function deliver(from: { id: string; name: string | null }, rcpt: Contact, message: string, senderLang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const db = supabaseAdmin();
  const SL = L(senderLang);
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
  return { ok: true, toName: rcpt.name || null || undefined };
}

// Передать сообщение получателю (по @имени, имени или прозвищу). Результат для отправителя.
export async function sendRelay(from: { id: string; name: string | null }, recipient: string, message: string, senderLang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const SL = L(senderLang);
  const res = await resolveRecipient(from.id, recipient);
  if (res.ok !== true) {
    if (res.reason === "ambiguous") {
      const lines = await enrichLines(res.matches, senderLang);
      return { ok: false, error: SL.ambiguous(lines) };
    }
    const list = await enrichLines(res.contacts.slice(0, 12), senderLang);
    return { ok: false, error: list.length ? SL.notFoundList(recipient, list) : SL.noContacts };
  }
  const r = await deliver(from, res.user, message, senderLang);
  return { ok: r.ok, toName: r.toName || res.user.name || recipient, error: r.error };
}

// Естественная фраза «передай <кому> …» (голос/текст). handled=false → это НЕ relay
// (получатель не распознан) → пусть обработается как обычная запись дневника.
export async function relayFromPhrase(from: { id: string; name: string | null }, text: string, senderLang: string): Promise<{ handled: boolean; reply?: string }> {
  const p = parseRelayPhrase(text);
  if (!p) return { handled: false };
  const res = await resolveRecipient(from.id, p.recipient);
  if (res.ok !== true) {
    if (res.reason === "ambiguous") {
      const lines = await enrichLines(res.matches, senderLang);
      return { handled: true, reply: L(senderLang).ambiguous(lines) };
    }
    return { handled: false }; // не нашли получателя — не перехватываем, это обычная запись
  }
  const r = await deliver(from, res.user, p.message, senderLang);
  return { handled: true, reply: r.ok ? L(senderLang).sent(r.toName || res.user.name || p.recipient) : r.error! };
}

// Задать своё прозвище для контакта: /nick @имя прозвище. Возвращает имя получателя.
export async function setAlias(ownerId: string, recipient: string, alias: string, lang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const SL = L(lang);
  const res = await resolveRecipient(ownerId, recipient);
  if (res.ok !== true) {
    if (res.reason === "ambiguous") {
      const lines = await enrichLines(res.matches, lang);
      return { ok: false, error: SL.ambiguous(lines) };
    }
    const list = await enrichLines(res.contacts.slice(0, 12), lang);
    return { ok: false, error: list.length ? SL.notFoundList(recipient, list) : SL.noContacts };
  }
  const db = supabaseAdmin();
  try {
    await db.from("relay_aliases").delete().eq("owner_id", ownerId).ilike("alias", alias);
    await db.from("relay_aliases").insert({ owner_id: ownerId, target_id: res.user.id, alias: alias.slice(0, 40) });
  } catch {
    return { ok: false, error: SL.fail };
  }
  return { ok: true, toName: res.user.name || recipient };
}

export function nickSavedMsg(lang: string, alias: string, name: string) { return L(lang).nickSaved(alias, name); }

// Список прозвищ пользователя (с кнопкой-командой удаления).
export async function listAliasesText(ownerId: string, lang: string): Promise<string> {
  const A = L(lang);
  try {
    const { data } = await supabaseAdmin().from("relay_aliases").select("alias, target_id").eq("owner_id", ownerId).order("created_at", { ascending: true });
    const rows = (data as any[]) || [];
    if (!rows.length) return A.nicksEmpty;
    const lines = await Promise.all(rows.map(async (r) => {
      const u = await fetchUser(r.target_id);
      return `• <b>${esc(r.alias)}</b> → ${esc(u?.name || "?")}  (<code>/unnick ${esc(r.alias)}</code>)`;
    }));
    return A.nicksList(lines);
  } catch {
    return A.nicksEmpty;
  }
}

// Удалить прозвище.
export async function removeAlias(ownerId: string, alias: string, lang: string): Promise<string> {
  const A = L(lang);
  try {
    const { data } = await supabaseAdmin().from("relay_aliases").delete().eq("owner_id", ownerId).ilike("alias", alias).select("id");
    return data && data.length ? A.nickRemoved(alias) : A.nickNone(alias);
  } catch {
    return A.fail;
  }
}

// Отправка напрямую по id получателя (для веба — кнопка «написать» у контакта).
export async function sendRelayToUser(from: { id: string; name: string | null }, targetUserId: string, message: string, senderLang: string): Promise<{ ok: boolean; toName?: string; error?: string }> {
  const SL = L(senderLang);
  const msg = String(message || "").trim().slice(0, 2000);
  if (!msg) return { ok: false, error: SL.fail };
  const u = await fetchUser(targetUserId);
  if (!u?.chat_id) return { ok: false, error: SL.notReachable };
  const r = await deliver(from, u, msg, senderLang);
  return { ok: r.ok, toName: r.toName || u.name || undefined, error: r.error };
}

// Переключить приём сообщений. Возвращает новое состояние relay_off (true = выключено).
export async function toggleRelay(userId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db.from("users").select("relay_off").eq("id", userId).maybeSingle();
  const next = !(data as any)?.relay_off;
  try { await db.from("users").update({ relay_off: next }).eq("id", userId); } catch {}
  return next;
}
