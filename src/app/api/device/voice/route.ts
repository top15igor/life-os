import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";
import { transcribeFile } from "@/lib/transcribe";
import { logUsage } from "@/lib/usage";
import { sendMessage } from "@/lib/telegram";
import { deviceByToken, touchDevice, localStampFromEpoch, type Device } from "@/lib/devices";
import { routeMessage, runAction } from "@/lib/botActions";
import { askLife } from "@/lib/biographer";
import { mdToTelegram } from "@/lib/telegram";
import { logError } from "@/lib/errorLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Единый вход для носимых устройств: часы, кнопка-брелок, будущий LTE-брелок.
// Нажал кнопку — мысль ушла в дневник, телефон в руках не нужен.
//
//   POST /api/device/voice?token=<токен устройства>
//   Authorization: Bearer <токен>            — можно и так
//
// Тело — что удобнее устройству:
//   • multipart/form-data, поле audio  — файл записи (часы, приложения)
//   • сырой звук в теле (Content-Type: audio/wav и т.п.) — так проще прошивке
//   • application/json  { "text": "…" }      — если распознавание уже сделано
//                                              (диктовка на Apple Watch — бесплатно)
//   • ?text=…                                — совсем простой вариант
//
// Необязательно:
//   ?at=<epoch>      когда мысль записана (у брелка с офлайн-буфером запись
//                    сделана на велике, а залилась вечером из дома)
//   ?battery=<0..100>  заряд устройства — виден в «Мои устройства»

const EXT: Record<string, string> = {
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
  "audio/mpeg": "mp3", "audio/mp3": "mp3",
  "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "m4a",
  "audio/ogg": "ogg", "audio/opus": "ogg", "application/ogg": "ogg",
  "audio/webm": "webm", "audio/flac": "flac",
};

function tokenOf(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return bearer || req.nextUrl.searchParams.get("token")?.trim() || "";
}

function numParam(v: string | null | undefined) {
  const n = Number(v);
  return isFinite(n) ? n : undefined;
}

// Сообщения бота уходят с parse_mode=HTML: угловые скобки в речи ломают отправку.
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function deviceLabel(d: Device) {
  return d.name?.trim() || (d.kind === "watch" ? "Часы" : d.kind === "phone" ? "Айфон" : d.kind === "keyfob" ? "Брелок" : "Устройство");
}

export async function POST(req: NextRequest) {
  const device = await deviceByToken(tokenOf(req));
  if (!device) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const ctype = (req.headers.get("content-type") || "").toLowerCase();

  let text = "";
  let audio: { buf: Buffer; filename: string } | null = null;
  let at = numParam(q.get("at"));
  let battery = numParam(q.get("battery"));

  try {
    if (ctype.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = (form.get("audio") || form.get("file") || form.get("voice")) as File | null;
      if (file && typeof (file as any).arrayBuffer === "function") {
        audio = { buf: Buffer.from(await file.arrayBuffer()), filename: (file as any).name || "voice.m4a" };
      }
      const t = form.get("text");
      if (typeof t === "string") text = t;
      at = at ?? numParam(String(form.get("at") ?? ""));
      battery = battery ?? numParam(String(form.get("battery") ?? ""));
    } else if (ctype.includes("application/json")) {
      const body = await req.json().catch(() => null);
      text = String(body?.text || "");
      at = at ?? numParam(body?.at);
      battery = battery ?? numParam(body?.battery);
    } else if (ctype.startsWith("audio/") || ctype.includes("octet-stream")) {
      const buf = Buffer.from(await req.arrayBuffer());
      const ext = EXT[ctype.split(";")[0].trim()] || q.get("ext") || "wav";
      if (buf.length) audio = { buf, filename: `voice.${ext}` };
    } else {
      // ни то ни другое — берём текст из адреса или из голого тела
      text = q.get("text") || (await req.text().catch(() => "")) || "";
    }
    if (!text) text = q.get("text") || "";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }

  // Голос → текст (если устройство прислало звук, а не готовую расшифровку).
  if (!text.trim() && audio) {
    if (audio.buf.length > 24 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "too_big" }, { status: 413 });
    }
    try {
      text = await transcribeFile(audio.buf, audio.filename, { userId: device.user_id });
      logUsage(device.user_id, "transcribe", 0, 0, 0.5);
    } catch {
      return NextResponse.json({ ok: false, error: "transcribe_failed" }, { status: 502 });
    }
  }

  if (!text.trim()) {
    // Кнопку нажали, но записи нет — не молчим: устройство должно понять, что пусто.
    touchDevice(device.id, battery, false);
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }

  // Когда мысль была записана: брелок с офлайн-буфером заливает её позже.
  let stamp: { entry_date: string; entry_time: string } | null = null;
  let chatId: number | null = null;
  let lang = "ru";
  let tzOffset: number | null = null;
  // Двумя запросами нарочно: если колонки tz_offset нет, единый select падает
  // целиком и вместе с ним теряется chat_id — то есть и подтверждение в Telegram.
  try {
    const { data: u } = await supabaseAdmin().from("users").select("chat_id, lang").eq("id", device.user_id).maybeSingle();
    chatId = (u as any)?.chat_id ?? null;
    if ((u as any)?.lang) lang = String((u as any).lang);
  } catch { /* нет пользователя — просто не подтверждаем */ }
  try {
    const { data: u } = await supabaseAdmin().from("users").select("tz_offset").eq("id", device.user_id).maybeSingle();
    tzOffset = (u as any)?.tz_offset ?? null;
    if (at) stamp = localStampFromEpoch(at, tzOffset);
  } catch { /* нет колонки tz_offset — время по умолчанию */ }

  // Что человек имел в виду: действие («напомни завтра про стрижку»), вопрос
  // («что у меня сегодня?») или мысль в дневник. Раньше с устройства ВСЁ падало
  // записью — сказанное в телефон вело себя не так, как сказанное боту, хотя
  // человек не видит между ними разницы: он просто говорит.
  //
  // Порядок гарантий: если роутер недоступен или сбоит — сохраняем записью.
  // Мысль, сказанная в телефон, не имеет права пропасть.
  let entryId: string | null = null;
  let kind: "entry" | "action" | "answer" = "entry";
  let reply = "";

  let route: any = null;
  if (at) {
    // Офлайн-буфер брелка: запись сделана давно, а залилась сейчас. Ставить по
    // ней напоминания и отвечать на вопросы поздно — это всегда запись в дневник.
    route = { kind: "save_entry" };
  } else {
    try {
      route = await routeMessage(text, device.user_id, tzOffset);
    } catch (e) {
      await logError("device:route", e, { userId: device.user_id });
    }
  }

  if (route?.kind === "action") {
    try {
      const res = await runAction(device.user_id, route.name, route.input, lang as any, tzOffset);
      reply = res.html ? res.text : (mdToTelegram(res.text) || res.text);
      for (const m of route.more || []) {
        try {
          const r = await runAction(device.user_id, m.name, m.input, lang as any, tzOffset);
          reply += "\n" + (r.html ? r.text : (mdToTelegram(r.text) || r.text));
        } catch { /* дополнительное действие не вышло — основное уже сделано */ }
      }
      kind = "action";
    } catch (e) {
      await logError("device:action", e, { userId: device.user_id });
      route = null; // не вышло — падаем в запись, чтобы сказанное не потерялось
    }
  } else if (route?.kind === "question") {
    try {
      reply = mdToTelegram(await askLife(device.user_id, text, lang)) || "";
      kind = "answer";
    } catch (e) {
      await logError("device:question", e, { userId: device.user_id });
      route = null;
    }
  }

  if (kind === "entry") {
    try {
      const analysis = await analyze(text, device.user_id);
      const entry = await saveEntry({
        userId: device.user_id,
        raw_text: text,
        source: "device",
        analysis,
        ...(stamp || {}),
      });
      entryId = entry.id;
      // Коротко про то, что бот вычленил из сказанного. Особенно важно для трат:
      // без этой строки человек не понимает, учлась ли покупка, и идёт проверять
      // в приложение — то есть ради этого и доставал телефон, которого не хотел.
      const bits: string[] = [];
      if ((entry as any).financeSaved > 0) {
        bits.push(...(analysis.finance || []).slice(0, 3).map((f) =>
          `${f.kind === "income" ? "💰 Доход" : "💸 Расход"}: ${f.amount}${f.currency ? " " + f.currency : ""}${f.category || f.note ? " · " + esc(String(f.category || f.note)) : ""}`));
      }
      if (analysis.tasks?.length) bits.push(`✅ Задач: ${analysis.tasks.length}`);
      if (analysis.promises?.length) bits.push(`🤝 Обещаний: ${analysis.promises.length}`);
      if (bits.length) reply = bits.join("\n");
    } catch (e) {
      await logError("device:save", e, { userId: device.user_id });
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }
  }

  // Ждём оба: на Vercel функция замирает сразу после ответа, и «отправлю потом»
  // означает «не отправлю никогда» — подтверждение в Telegram не доходило.
  await touchDevice(device.id, battery).catch(() => {});

  // Подтверждение в Telegram — чтобы ты видел, что мысль дошла и как её услышали.
  // Если это было действие или вопрос, показываем и результат: иначе человек не
  // узнает, поставилось ли напоминание, пока не откроет приложение.
  if (chatId) {
    const short = text.length > 400 ? text.slice(0, 400) + "…" : text;
    const head = `🎙 ${deviceLabel(device)}: ${esc(short)}`;
    await sendMessage(chatId, reply ? `${head}\n\n${reply}` : head).catch(() => {});
  }

  return NextResponse.json({ ok: true, text, kind, id: entryId });
}

// Проверка «работает ли мой токен» — прямо из браузера или из прошивки.
export async function GET(req: NextRequest) {
  const device = await deviceByToken(tokenOf(req));
  if (!device) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, device: deviceLabel(device) });
}
