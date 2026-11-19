import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

// Носимые устройства: кнопка на руке/на шее, «Команда» на Apple Watch,
// будущий LTE-брелок. Нажал — голосовое улетело в LIFE OS, даже если телефона
// нет под рукой (едешь на велике, руки заняты, телефон в рюкзаке).
//
// У каждого устройства свой токен: потерянный брелок отзывается отдельно,
// личная ссылка входа в аккаунт при этом не меняется.

export type Device = {
  id: string;
  user_id: string;
  name: string | null;
  kind: string;
  token: string;
  battery: number | null;
  last_seen: string | null;
  sent_count: number;
  created_at: string | null;
  // Правила для всегда-слушающих устройств (см. lib/deviceFilter).
  filter_mode?: string | null;
  trigger_phrases?: string | null;
  min_words?: number | null;
  only_me?: boolean | null;
  quiet_from?: number | null;
  quiet_to?: number | null;
};

export type InboxRow = {
  id: string;
  device_id: string;
  text: string | null;
  spoken_at: string | null;
  decision: string;
  reason: string | null;
  entry_id: string | null;
  created_at: string | null;
};

export const DEVICE_KINDS = ["watch", "keyfob", "phone", "omi", "other"] as const;

function newToken() {
  return randomBytes(24).toString("hex"); // 48 символов, хватает с запасом
}

export async function listDevices(userId: string): Promise<Device[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("devices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as Device[]) || [];
  } catch {
    return []; // таблицы ещё нет (миграция не применена) — не роняем страницу
  }
}

export async function createDevice(userId: string, name: string, kind: string): Promise<Device | null> {
  const safeKind = (DEVICE_KINDS as readonly string[]).includes(kind) ? kind : "other";
  const { data, error } = await supabaseAdmin()
    .from("devices")
    // Всегда-слушающему устройству строгое правило с порога: иначе первый же день
    // носки зальёт дневник разговорами в магазине и телевизором на фоне.
    .insert({
      user_id: userId, name: name.slice(0, 60) || null, kind: safeKind, token: newToken(),
      ...(safeKind === "omi" ? { filter_mode: "trigger" } : {}),
    })
    .select()
    .single();
  if (error) {
    // Колонок правил может ещё не быть (device_filters.sql не применён) —
    // заводим устройство без них, правила настроятся после миграции.
    const { data: plain, error: e2 } = await supabaseAdmin()
      .from("devices")
      .insert({ user_id: userId, name: name.slice(0, 60) || null, kind: safeKind, token: newToken() })
      .select()
      .single();
    if (e2) return null;
    return plain as Device;
  }
  return data as Device;
}

export async function deleteDevice(userId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("devices").delete().eq("id", id).eq("user_id", userId);
  return !error;
}

// Смена токена: старый брелок/шорткат сразу перестаёт работать.
export async function rotateDevice(userId: string, id: string): Promise<Device | null> {
  const { data, error } = await supabaseAdmin()
    .from("devices")
    .update({ token: newToken() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return data as Device;
}

export async function deviceByToken(token: string): Promise<Device | null> {
  if (!token || token.length < 16) return null;
  try {
    const { data } = await supabaseAdmin().from("devices").select("*").eq("token", token).maybeSingle();
    return (data as Device | null) || null;
  } catch {
    return null;
  }
}

// Отметить, что устройство вышло на связь (и сколько в нём осталось заряда).
export async function touchDevice(id: string, battery?: number | null, counted = true) {
  const patch: Record<string, any> = { last_seen: new Date().toISOString() };
  if (typeof battery === "number" && isFinite(battery)) patch.battery = Math.max(0, Math.min(100, Math.round(battery)));
  try {
    await supabaseAdmin().from("devices").update(patch).eq("id", id);
    if (counted) {
      // счётчик отдельно и мягко: rpc может не быть, просто +1 чтением
      const { data } = await supabaseAdmin().from("devices").select("sent_count").eq("id", id).maybeSingle();
      const n = Number((data as any)?.sent_count || 0) + 1;
      await supabaseAdmin().from("devices").update({ sent_count: n }).eq("id", id);
    }
  } catch { /* не критично */ }
}

// Локальные дата/время записи для устройства с офлайн-буфером:
// брелок мог записать мысль в 14:20 на велике, а залить её вечером из дома.
// at — секунды epoch (или миллисекунды), tzOffset — минуты к UTC у пользователя.
export function localStampFromEpoch(at: number, tzOffset: number | null | undefined): { entry_date: string; entry_time: string } | null {
  if (!isFinite(at) || at <= 0) return null;
  const ms = at > 1e12 ? at : at * 1000; // приняли и секунды, и миллисекунды
  if (Math.abs(Date.now() - ms) > 400 * 24 * 3600 * 1000) return null; // мусорные часы устройства
  const off = typeof tzOffset === "number" ? tzOffset : 0;
  const local = new Date(ms + off * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    entry_date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    entry_time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`,
  };
}

// Правила отбора для всегда-слушающего устройства.
export async function updateDeviceRules(
  userId: string,
  id: string,
  rules: Partial<Pick<Device, "filter_mode" | "trigger_phrases" | "min_words" | "only_me" | "quiet_from" | "quiet_to">>
): Promise<boolean> {
  const patch: Record<string, any> = {};
  if (typeof rules.filter_mode === "string" && ["all", "trigger", "ai"].includes(rules.filter_mode)) {
    patch.filter_mode = rules.filter_mode;
  }
  if (rules.trigger_phrases !== undefined) patch.trigger_phrases = String(rules.trigger_phrases || "").slice(0, 300) || null;
  if (rules.min_words !== undefined) patch.min_words = Math.max(0, Math.min(100, Number(rules.min_words) || 0));
  if (rules.only_me !== undefined) patch.only_me = !!rules.only_me;
  if (rules.quiet_from !== undefined) patch.quiet_from = rules.quiet_from === null ? null : Math.max(0, Math.min(23, Number(rules.quiet_from) || 0));
  if (rules.quiet_to !== undefined) patch.quiet_to = rules.quiet_to === null ? null : Math.max(0, Math.min(23, Number(rules.quiet_to) || 0));
  if (!Object.keys(patch).length) return false;
  const { error } = await supabaseAdmin().from("devices").update(patch).eq("id", id).eq("user_id", userId);
  return !error;
}

// Что присылало устройство: и сохранённое, и отсеянное — с причиной.
export async function listInbox(userId: string, deviceId?: string, limit = 40): Promise<InboxRow[]> {
  try {
    let q = supabaseAdmin()
      .from("device_inbox")
      .select("id, device_id, text, spoken_at, decision, reason, entry_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (deviceId) q = q.eq("device_id", deviceId);
    const { data } = await q;
    return (data as InboxRow[]) || [];
  } catch {
    return []; // миграции ещё нет — страница всё равно должна открыться
  }
}
