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
};

export const DEVICE_KINDS = ["watch", "keyfob", "phone", "other"] as const;

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
    .insert({ user_id: userId, name: name.slice(0, 60) || null, kind: safeKind, token: newToken() })
    .select()
    .single();
  if (error) return null;
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
