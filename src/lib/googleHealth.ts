import { supabaseAdmin } from "./supabaseAdmin";
import { upsertHealthDays, type HealthDay } from "./healthMetrics";

// Google Health API v4 (преемник Fitbit Web API): OAuth2 через Google +
// чтение дневных метрик пользователя (users/me). Метрики: шаги, активные
// калории, дистанция, сон, пульс покоя → таблица health_metrics.
//
// Авторизуется аккаунтом Google, к которому привязан Fitbit/Pixel.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://health.googleapis.com/v4";

// Все scope «Restricted» (нужен Google-консент). Read-only.
export const GH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
].join(" ");

export function googleHealthConfigured(): boolean {
  return !!(process.env.GOOGLE_HEALTH_CLIENT_ID && process.env.GOOGLE_HEALTH_CLIENT_SECRET);
}

export function googleHealthAuthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_HEALTH_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GH_SCOPES,
    access_type: "offline",   // нужен refresh_token
    prompt: "consent",        // чтобы refresh_token пришёл всегда
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

type TokenResp = { access_token: string; refresh_token?: string; expires_in: number; scope?: string };

async function saveTokens(userId: string, tok: TokenResp, keepRefresh?: string) {
  const refresh = tok.refresh_token || keepRefresh;
  if (!refresh) throw new Error("no refresh token");
  const expires = new Date(Date.now() + (tok.expires_in - 60) * 1000).toISOString();
  await supabaseAdmin().from("googlehealth_tokens").upsert(
    {
      user_id: userId,
      access_token: tok.access_token,
      refresh_token: refresh,
      expires_at: expires,
      scope: tok.scope || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function googleHealthExchangeCode(userId: string, code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: process.env.GOOGLE_HEALTH_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET || "",
  });
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) throw new Error(`google token exchange ${r.status}: ${await r.text()}`);
  const tok = (await r.json()) as TokenResp;
  await saveTokens(userId, tok);
  return tok;
}

async function getAccessToken(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("googlehealth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at as string).getTime() > Date.now()) return data.access_token as string;

  // Обновляем по refresh_token (у Google он постоянный).
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: data.refresh_token as string,
    client_id: process.env.GOOGLE_HEALTH_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_HEALTH_CLIENT_SECRET || "",
  });
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) return null; // доступ отозван
  const tok = (await r.json()) as TokenResp;
  await saveTokens(userId, tok, data.refresh_token as string);
  return tok.access_token;
}

export async function isGoogleHealthConnected(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin().from("googlehealth_tokens").select("user_id").eq("user_id", userId).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function disconnectGoogleHealth(userId: string) {
  try {
    await supabaseAdmin().from("googlehealth_tokens").delete().eq("user_id", userId);
  } catch {
    // нет таблицы — нечего отключать
  }
}

// --- работа с API ---

const dayMs = 86400000;
function isoDay(offset: number): string {
  return new Date(Date.now() - offset * dayMs).toISOString().slice(0, 10);
}
function civil(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { date: { year: y, month: m, day: d } };
}
// Civil-время у Google приходит в двух формах: дневной rollup даёт { date: {year,month,day} },
// а метка сессии (сон) — плоский datetime { year,month,day,hours,minutes,... }. Понимаем оба.
function civilParts(c: any): { year: number; month: number; day: number; hours?: number; minutes?: number; seconds?: number } | null {
  const dt = c?.date ?? c;
  if (!dt?.year) return null;
  return dt;
}
function dayOf(c: any): string | null {
  const dt = civilParts(c);
  if (!dt) return null;
  return `${dt.year}-${String(dt.month).padStart(2, "0")}-${String(dt.day).padStart(2, "0")}`;
}
// Локальный день из ISO-времени + смещение вида "7200s" (сон Google Health отдаёт так).
function localDayFromIso(iso?: string, offset?: string): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!isFinite(ms)) return null;
  const offSec = parseInt(String(offset || "0"), 10) || 0;
  return new Date(ms + offSec * 1000).toISOString().slice(0, 10);
}

async function ghGet(token: string, path: string): Promise<any | null> {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

// Дневная агрегация для interval-типов (steps / distance / active-energy-burned).
async function dailyRollUp(token: string, dataType: string, startIso: string, endExclIso: string): Promise<any[]> {
  const r = await fetch(`${API}/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range: { start: civil(startIso), end: civil(endExclIso) }, windowSizeDays: 1 }),
  });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  return j?.rollupDataPoints || [];
}

// Подтянуть последние N дней из Google Health в health_metrics. -1 если нет связи.
export async function syncGoogleHealth(userId: string, days = 7): Promise<number> {
  const token = await getAccessToken(userId);
  if (!token) return -1;

  const startIso = isoDay(days - 1);     // включительно
  const endExclIso = isoDay(-1);          // завтра (верхняя граница исключается)
  const byDay = new Map<string, HealthDay>();
  const get = (d: string) => { let h = byDay.get(d); if (!h) { h = { day: d }; byDay.set(d, h); } return h; };

  // steps / distance / active-energy-burned — дневные суммы.
  for (const rp of await dailyRollUp(token, "steps", startIso, endExclIso)) {
    const d = dayOf(rp.civilStartTime); const v = Number(rp.steps?.countSum);
    if (d && isFinite(v) && v > 0) get(d).steps = v;
  }
  for (const rp of await dailyRollUp(token, "distance", startIso, endExclIso)) {
    const d = dayOf(rp.civilStartTime); const mm = Number(rp.distance?.millimetersSum);
    if (d && isFinite(mm) && mm > 0) get(d).distance_km = Math.round((mm / 1_000_000) * 10) / 10;
  }
  for (const rp of await dailyRollUp(token, "active-energy-burned", startIso, endExclIso)) {
    const d = dayOf(rp.civilStartTime); const k = Number(rp.activeEnergyBurned?.kcalSum);
    if (d && isFinite(k) && k > 0) get(d).active_kcal = Math.round(k);
  }

  // Пульс покоя — отдельный дневной тип, читаем списком.
  const rhr = await ghGet(token, `/users/me/dataTypes/daily-resting-heart-rate/dataPoints?pageSize=100&filter=${encodeURIComponent(`daily_resting_heart_rate.date >= "${startIso}" AND daily_resting_heart_rate.date < "${endExclIso}"`)}`);
  for (const dp of rhr?.dataPoints || []) {
    const d = dayOf(dp.dailyRestingHeartRate); const bpm = Number(dp.dailyRestingHeartRate?.beatsPerMinute);
    if (d && isFinite(bpm) && bpm > 0) get(d).hr_resting = Math.round(bpm);
  }

  // Сон — сессии. interval.endTime/startTime приходят ISO-строками + endUtcOffset ("7200s").
  // Минуты сна берём из summary.minutesAsleep; день = локальная дата пробуждения.
  const sleep = await ghGet(token, `/users/me/dataTypes/sleep/dataPoints?pageSize=100&filter=${encodeURIComponent(`sleep.interval.civil_end_time >= "${startIso}" AND sleep.interval.civil_end_time < "${endExclIso}"`)}`);
  for (const dp of sleep?.dataPoints || []) {
    const sl = dp.sleep || {};
    const iv = sl.interval || {};
    const d = localDayFromIso(iv.endTime, iv.endUtcOffset);
    let mins = Number(sl.summary?.minutesAsleep);
    if (!(isFinite(mins) && mins > 0)) {
      const startMs = Date.parse(iv.startTime || "");
      const endMs = Date.parse(iv.endTime || "");
      if (isFinite(startMs) && isFinite(endMs) && endMs > startMs) mins = Math.round((endMs - startMs) / 60000);
    }
    if (d && isFinite(mins) && mins > 0) {
      const h = get(d);
      h.sleep_hours = Math.round(((h.sleep_hours || 0) + mins / 60) * 10) / 10;
    }
  }

  return upsertHealthDays(userId, [...byDay.values()], "googlehealth");
}

// Диагностика: компактно показываем, что реально отдаёт Google Health,
// и какие ДОП. типы данных доступны (чтобы добавить максимум метрик).
export async function googleHealthProbe(userId: string): Promise<any> {
  const token = await getAccessToken(userId);
  if (!token) return { connected: false };
  const startIso = isoDay(6);
  const endExclIso = isoDay(-1);
  async function get(path: string) {
    try {
      const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const text = await r.text();
      let body: any = text;
      try { body = JSON.parse(text); } catch {}
      return { status: r.status, body };
    } catch (e: any) {
      return { status: -1, body: String(e?.message || e) };
    }
  }
  // Сон — только интервал и summary (без массива стадий), чтобы ответ читался.
  const sleepFilter = encodeURIComponent(`sleep.interval.civil_end_time >= "${startIso}" AND sleep.interval.civil_end_time < "${endExclIso}"`);
  const sleepRaw = await get(`/users/me/dataTypes/sleep/dataPoints?pageSize=10&filter=${sleepFilter}`);
  const sleepPts = (sleepRaw.body?.dataPoints || []).slice(0, 3).map((dp: any) => ({
    endTime: dp.sleep?.interval?.endTime,
    endUtcOffset: dp.sleep?.interval?.endUtcOffset,
    minutesAsleep: dp.sleep?.summary?.minutesAsleep,
    stagesSummary: dp.sleep?.summary?.stagesSummary,
  }));
  // Кандидаты доп. типов данных — узнаём, что доступно и как называются поля.
  const candidates = [
    "heart-rate", "daily-heart-rate", "oxygen-saturation", "heart-rate-variability",
    "respiratory-rate", "floors-climbed", "elevation-gained", "total-calories-burned",
    "active-zone-minutes", "active-minutes", "weight", "skin-temperature",
  ];
  const results = await Promise.all(
    candidates.map((c) => get(`/users/me/dataTypes/${c}/dataPoints?pageSize=1`))
  );
  const probes: Record<string, any> = {};
  candidates.forEach((c, i) => {
    const r = results[i];
    probes[c] = r.status === 200
      ? { ok: true, sample: r.body?.dataPoints?.[0] ?? "empty" }
      : { status: r.status, msg: r.body?.error?.message || r.body?.error?.status || null };
  });
  return { connected: true, range: { startIso, endExclIso }, sleepStatus: sleepRaw.status, sleepCount: sleepPts.length, sleepPts, probes };
}

// Все пользователи с подключённым Google Health (для крона).
export async function googleHealthUserIds(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin().from("googlehealth_tokens").select("user_id");
    return (data || []).map((r: any) => r.user_id as string);
  } catch {
    return [];
  }
}
