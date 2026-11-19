import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { sendMessage } from "@/lib/telegram";
import { deviceByToken, touchDevice, localStampFromEpoch, type Device } from "@/lib/devices";
import { applyFilter } from "@/lib/deviceFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Приём от всегда-слушающих устройств (Omi и совместимые).
//
//   POST /api/device/omi?token=<токен устройства>
//   (Omi сам допишет &uid=... — мы его не используем, узнаём по токену)
//
// Устройство шлёт КАЖДЫЙ разговор за день. В дневник попадает не всё, а то,
// что прошло правила устройства: ключевая фраза, тихие часы, длина, «только я».
// Всё пришедшее, и сохранённое и отброшенное, ложится в device_inbox — чтобы
// было видно, что именно отсеялось и почему.

type Segment = { text?: string; is_user?: boolean; speaker_name?: string };

function tokenOf(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return bearer || req.nextUrl.searchParams.get("token")?.trim() || "";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function deviceLabel(d: Device) {
  return d.name?.trim() || "Кулон";
}

// Склеиваем реплики в связный текст. only_me — берём лишь то, что сказал владелец:
// чужая речь в личный дневник не попадает, и это отсекается без всякого AI.
function textOf(segments: Segment[], onlyMe: boolean): string {
  const use = onlyMe ? segments.filter((s) => s?.is_user) : segments;
  return use.map((s) => (s?.text || "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function epochOf(iso?: string | null): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return isFinite(t) ? Math.floor(t / 1000) : undefined;
}

export async function POST(req: NextRequest) {
  const device = await deviceByToken(tokenOf(req));
  if (!device) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  // Omi помечает так обрывки, которые сам счёл мусором — не спорим с ним.
  if ((body as any).discarded === true) {
    return NextResponse.json({ ok: true, skipped: "discarded" });
  }

  const d = device as Device & {
    only_me?: boolean; filter_mode?: string; trigger_phrases?: string;
    min_words?: number; quiet_from?: number; quiet_to?: number;
  };

  const segments: Segment[] = Array.isArray((body as any).transcript_segments)
    ? (body as any).transcript_segments
    : [];
  const externalId = String((body as any).id || "") || null;

  let text = textOf(segments, d.only_me !== false);
  // Бывает, что реплик нет, а пересказ есть — тогда берём его, чтобы не терять.
  if (!text) text = String((body as any)?.structured?.overview || "").trim();

  const spokenEpoch = epochOf((body as any).started_at) ?? epochOf((body as any).created_at);

  // Часовой пояс владельца: нужен и для тихих часов, и чтобы запись легла в дневник
  // своим временем, а не временем доставки.
  let chatId: number | null = null;
  let tzOffset: number | null = null;
  try {
    const { data: u } = await supabaseAdmin().from("users").select("chat_id").eq("id", device.user_id).maybeSingle();
    chatId = (u as any)?.chat_id ?? null;
  } catch { /* не подтвердим — не страшно */ }
  try {
    const { data: u } = await supabaseAdmin().from("users").select("tz_offset").eq("id", device.user_id).maybeSingle();
    const off = (u as any)?.tz_offset;
    if (typeof off === "number") tzOffset = off;
  } catch { /* нет колонки — время по умолчанию */ }

  const stamp = spokenEpoch ? localStampFromEpoch(spokenEpoch, tzOffset) : null;
  const localHour = stamp ? Number(stamp.entry_time.slice(0, 2)) : undefined;

  const verdict = await applyFilter(text, d, localHour);

  let entryId: string | null = null;
  if (verdict.keep) {
    try {
      const analysis = await analyze(verdict.text, device.user_id);
      const entry = await saveEntry({
        userId: device.user_id,
        raw_text: verdict.text,
        source: "omi",
        analysis,
        ...(stamp || {}),
      });
      entryId = entry.id;
    } catch {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
  }

  // Журнал: видно и что сохранилось, и что отсеялось и почему.
  try {
    await supabaseAdmin().from("device_inbox").insert({
      user_id: device.user_id,
      device_id: device.id,
      external_id: externalId,
      text: (verdict.text || text || "").slice(0, 8000),
      spoken_at: spokenEpoch ? new Date(spokenEpoch * 1000).toISOString() : null,
      decision: verdict.keep ? "saved" : "filtered",
      reason: verdict.reason || null,
      entry_id: entryId,
      raw: body,
    });
  } catch { /* повтор доставки или нет таблицы — не роняем приём */ }

  await touchDevice(device.id, undefined, verdict.keep).catch(() => {});

  if (verdict.keep && chatId) {
    const short = verdict.text.length > 400 ? verdict.text.slice(0, 400) + "…" : verdict.text;
    await sendMessage(chatId, `🎙 ${deviceLabel(device)}: ${esc(short)}`).catch(() => {});
  }

  return NextResponse.json({ ok: true, saved: verdict.keep, id: entryId, reason: verdict.reason });
}

// Проверка токена из браузера.
export async function GET(req: NextRequest) {
  const device = await deviceByToken(tokenOf(req));
  if (!device) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, device: deviceLabel(device) });
}
