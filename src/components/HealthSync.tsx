"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type HealthDay = {
  day: string;
  steps?: number | null;
  active_kcal?: number | null;
  distance_km?: number | null;
  sleep_hours?: number | null;
  hr_avg?: number | null;
  hr_resting?: number | null;
  hrv?: number | null;
};

const STR: Record<string, any> = {
  ru: {
    title: "Apple «Здоровье»",
    steps: "Шаги", sleep: "Сон", resting: "Пульс покоя", hr: "Пульс", kcal: "Активность", bpm: "уд/мин", h: "ч", kcalU: "ккал",
    avg7: "ср. за 7 дн.", noData: "Данных пока нет — подключи синхронизацию ниже.",
    connect: "Подключить Apple «Здоровье»", hide: "Свернуть",
    a_title: "Способ 1 · Автосинхронизация через «Команды» (бесплатно)",
    a_lead: "Это твоя личная ссылка. Команда на айфоне будет отправлять по ней данные. Никому её не показывай.",
    copy: "Скопировать ссылку", copied: "Скопировано ✓",
    steps_list: [
      "На айфоне открой приложение «Команды» → «+» (новая команда).",
      "Добавь действия «Найти образцы здоровья» для шагов, сна и пульса (за сегодня) и собери из них «Словарь».",
      "Добавь действие «Получить содержимое URL»: метод POST, тело — JSON, вставь ссылку выше.",
      "Сохрани. Затем «Автоматизация» → каждый день, например в 23:30 → запускать эту команду.",
      "Готово: каждый вечер данные сами появятся здесь.",
    ],
    a_hint: "Не хочешь возиться с командой — есть приложение Health Auto Export (платное): в нём укажи эту же ссылку как REST API / webhook.",
    b_title: "Способ 2 · Загрузить архив (вся история разом)",
    b_lead: "На айфоне: «Здоровье» → твой профиль вверху → «Экспортировать все данные» → получишь архив export.zip. Загрузи его сюда — файл не покидает браузер, на сервер уходят только итоги по дням.",
    pick: "Выбрать архив export.zip",
    parsing: "Читаю архив… это может занять минуту",
    sending: "Сохраняю…",
    done: (n: number) => `Готово: загружено дней — ${n}`,
    err: "Не удалось прочитать архив. Убедись, что это export.zip из «Здоровья».",
    test: "Проверить ссылку", testing: "Проверяю…", testOk: "Ссылка работает ✓", testFail: "Ссылка не отвечает",
    fb_title: "Fitbit", fb_lead: "Автоматическая синхронизация через аккаунт Google (Google Health): шаги, активность, сон и пульс покоя приходят сами раз в день.",
    fb_connect: "Подключить Fitbit", fb_connected: "Fitbit подключён ✓",
    fb_sync: "Обновить сейчас", fb_syncing: "Обновляю…", fb_disconnect: "Отключить",
    fb_notconfigured: "Fitbit пока не настроен (нужны ключи приложения).",
    fb_ok: "Fitbit подключён — данные загружены ✓", fb_err: "Не удалось подключить Fitbit, попробуй ещё раз.",
    fb_denied: "Доступ к Fitbit не выдан.", fb_synced: (n: number) => `Обновлено дней: ${n}`,
  },
  en: {
    title: "Apple Health",
    steps: "Steps", sleep: "Sleep", resting: "Resting HR", hr: "Heart rate", kcal: "Active", bpm: "bpm", h: "h", kcalU: "kcal",
    avg7: "7-day avg", noData: "No data yet — connect syncing below.",
    connect: "Connect Apple Health", hide: "Collapse",
    a_title: "Option 1 · Auto-sync via Shortcuts (free)",
    a_lead: "This is your personal link. The Shortcut on your iPhone posts data to it. Keep it private.",
    copy: "Copy link", copied: "Copied ✓",
    steps_list: [
      "On iPhone open the Shortcuts app → “+” (new shortcut).",
      "Add “Find Health Samples” for steps, sleep and heart rate (today) and build a Dictionary from them.",
      "Add “Get Contents of URL”: method POST, body JSON, paste the link above.",
      "Save. Then Automation → every day, e.g. 23:30 → run this shortcut.",
      "Done — your data shows up here automatically each evening.",
    ],
    a_hint: "Prefer not to build a shortcut — the Health Auto Export app (paid) can post to this same link as a REST API / webhook.",
    b_title: "Option 2 · Upload archive (full history at once)",
    b_lead: "On iPhone: Health → your profile → “Export All Health Data” → you get export.zip. Upload it here — the file never leaves your browser, only daily totals are sent to the server.",
    pick: "Choose export.zip",
    parsing: "Reading archive… this can take a minute",
    sending: "Saving…",
    done: (n: number) => `Done: ${n} days imported`,
    err: "Could not read the archive. Make sure it is export.zip from Health.",
    test: "Test link", testing: "Testing…", testOk: "Link works ✓", testFail: "Link not responding",
    fb_title: "Fitbit", fb_lead: "Automatic sync via your Google account (Google Health): steps, activity, sleep and resting heart rate arrive once a day on their own.",
    fb_connect: "Connect Fitbit", fb_connected: "Fitbit connected ✓",
    fb_sync: "Sync now", fb_syncing: "Syncing…", fb_disconnect: "Disconnect",
    fb_notconfigured: "Fitbit is not set up yet (app keys required).",
    fb_ok: "Fitbit connected — data loaded ✓", fb_err: "Could not connect Fitbit, please try again.",
    fb_denied: "Fitbit access was not granted.", fb_synced: (n: number) => `${n} days updated`,
  },
};

function round1(n: number) { return Math.round(n * 10) / 10; }

function avgOf(days: HealthDay[], key: keyof HealthDay): number | null {
  const vals = days.slice(-7).map((d) => d[key]).filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Разбор export.xml из архива Apple «Здоровье» в браузере → дневные итоги.
function parseHealthXml(xml: string): HealthDay[] {
  type Acc = { steps?: number; dist?: number; kcal?: number; hrSum?: number; hrN?: number; restSum?: number; restN?: number; hrvSum?: number; hrvN?: number; sleep?: number };
  const by = new Map<string, Acc>();
  const get = (d: string) => { let a = by.get(d); if (!a) { a = {}; by.set(d, a); } return a; };

  const re = /<Record\b([^>]*?)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const attrs = m[1];
    const type = /\btype="([^"]+)"/.exec(attrs)?.[1];
    if (!type) continue;
    const start = /\bstartDate="([^"]+)"/.exec(attrs)?.[1] || "";
    const day = start.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const valStr = /\bvalue="([^"]*)"/.exec(attrs)?.[1] || "";
    const val = Number(valStr);
    const unit = /\bunit="([^"]*)"/.exec(attrs)?.[1] || "";

    switch (type) {
      case "HKQuantityTypeIdentifierStepCount":
        if (isFinite(val)) { const a = get(day); a.steps = (a.steps || 0) + val; } break;
      case "HKQuantityTypeIdentifierDistanceWalkingRunning": {
        if (!isFinite(val)) break;
        const km = /mi/i.test(unit) ? val * 1.60934 : val;
        const a = get(day); a.dist = (a.dist || 0) + km; break;
      }
      case "HKQuantityTypeIdentifierActiveEnergyBurned":
        if (isFinite(val)) { const a = get(day); a.kcal = (a.kcal || 0) + val; } break;
      case "HKQuantityTypeIdentifierHeartRate":
        if (isFinite(val)) { const a = get(day); a.hrSum = (a.hrSum || 0) + val; a.hrN = (a.hrN || 0) + 1; } break;
      case "HKQuantityTypeIdentifierRestingHeartRate":
        if (isFinite(val)) { const a = get(day); a.restSum = (a.restSum || 0) + val; a.restN = (a.restN || 0) + 1; } break;
      case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
        if (isFinite(val)) { const a = get(day); a.hrvSum = (a.hrvSum || 0) + val; a.hrvN = (a.hrvN || 0) + 1; } break;
      case "HKCategoryTypeIdentifierSleepAnalysis": {
        if (!/Asleep/i.test(valStr)) break; // только фазы сна, не «в кровати»/«проснулся»
        const end = /\bendDate="([^"]+)"/.exec(attrs)?.[1] || "";
        const t0 = Date.parse(start.replace(" ", "T")), t1 = Date.parse(end.replace(" ", "T"));
        if (!isFinite(t0) || !isFinite(t1) || t1 <= t0) break;
        const hours = (t1 - t0) / 3600000;
        const endDay = end.slice(0, 10); // сон относим к дню пробуждения
        const a = get(/^\d{4}-\d{2}-\d{2}$/.test(endDay) ? endDay : day);
        a.sleep = (a.sleep || 0) + hours; break;
      }
    }
  }

  const out: HealthDay[] = [];
  for (const [day, a] of by) {
    const d: HealthDay = { day };
    if (a.steps != null) d.steps = Math.round(a.steps);
    if (a.dist != null) d.distance_km = round1(a.dist);
    if (a.kcal != null) d.active_kcal = Math.round(a.kcal);
    if (a.hrN) d.hr_avg = Math.round(a.hrSum! / a.hrN);
    if (a.restN) d.hr_resting = Math.round(a.restSum! / a.restN);
    if (a.hrvN) d.hrv = round1(a.hrvSum! / a.hrvN);
    if (a.sleep != null) d.sleep_hours = round1(a.sleep);
    out.push(d);
  }
  out.sort((a, b) => a.day.localeCompare(b.day));
  return out;
}

function Stat({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <div className="card" style={{ flex: "1 1 120px", minWidth: 110, padding: "12px 14px" }}>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
        {value}{unit && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-3)", marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function HealthSync({ days, token, locale, fitbitConnected, fitbitConfigured, fitbitMsg }: { days: HealthDay[]; token: string; locale: string; fitbitConnected?: boolean; fitbitConfigured?: boolean; fitbitMsg?: string }) {
  const s = STR[locale] || STR.en;
  const router = useRouter();
  const [open, setOpen] = useState(days.length === 0);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState<string>("");
  const [fbBusy, setFbBusy] = useState(false);
  const [fbStatus, setFbStatus] = useState<string>(
    fitbitMsg === "ok" ? s.fb_ok : fitbitMsg === "error" ? s.fb_err : fitbitMsg === "denied" ? s.fb_denied : fitbitMsg === "notconfigured" ? s.fb_notconfigured : ""
  );

  async function fbSync() {
    setFbBusy(true); setFbStatus(s.fb_syncing);
    try {
      const r = await fetch("/api/integrations/google-health/sync", { method: "POST" }).then((x) => x.json());
      setFbStatus(r?.ok ? s.fb_synced(r.saved || 0) : s.fb_err);
      if (r?.ok) router.refresh();
    } catch { setFbStatus(s.fb_err); }
    setFbBusy(false);
    setTimeout(() => setFbStatus(""), 5000);
  }

  async function fbDisconnect() {
    setFbBusy(true);
    try {
      await fetch("/api/integrations/google-health/sync", { method: "DELETE" });
      router.refresh();
    } catch {}
    setFbBusy(false);
  }

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(`${window.location.origin}/api/health-sync?token=${token}`);
  }, [token]);

  const latest = days.length ? days[days.length - 1] : null;
  const dash = "—";

  function copy() {
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  async function checkLink() {
    setTest(s.testing);
    try {
      const r = await fetch(url, { method: "GET" }).then((x) => x.json());
      setTest(r?.ok ? s.testOk : s.testFail);
    } catch { setTest(s.testFail); }
    setTimeout(() => setTest(""), 3000);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setStatus(s.parsing);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(file);
      const entry = Object.values(zip.files).find((f) => /export\.xml$/i.test(f.name) && !f.dir);
      if (!entry) throw new Error("no export.xml");
      const xml = await entry.async("string");
      const parsed = parseHealthXml(xml);
      if (!parsed.length) throw new Error("empty");
      setStatus(s.sending);
      // Шлём чанками, чтобы не упереться в лимит тела запроса.
      let saved = 0;
      for (let i = 0; i < parsed.length; i += 400) {
        const chunk = parsed.slice(i, i + 400);
        const r = await fetch("/api/health-import", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: chunk }),
        }).then((x) => x.json());
        if (r?.ok) saved += r.saved || 0;
      }
      setStatus(s.done(saved));
      router.refresh();
    } catch {
      setStatus(s.err);
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(""), 6000);
    }
  }

  const stepsAvg = avgOf(days, "steps");
  const sleepAvg = avgOf(days, "sleep_hours");
  const restAvg = avgOf(days, "hr_resting");

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <i className="ti ti-brand-apple" style={{ fontSize: 15, color: "var(--text-2)" }} />
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.title}</span>
      </div>

      {latest ? (
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 10 }}>
          <Stat label={s.steps} value={latest.steps != null ? latest.steps.toLocaleString() : dash}
            sub={stepsAvg != null ? `${s.avg7}: ${stepsAvg.toLocaleString()}` : undefined} />
          <Stat label={s.sleep} value={latest.sleep_hours != null ? String(latest.sleep_hours) : dash} unit={latest.sleep_hours != null ? s.h : ""}
            sub={sleepAvg != null ? `${s.avg7}: ${sleepAvg} ${s.h}` : undefined} />
          <Stat label={s.resting} value={latest.hr_resting != null ? String(latest.hr_resting) : dash} unit={latest.hr_resting != null ? s.bpm : ""}
            sub={restAvg != null ? `${s.avg7}: ${restAvg} ${s.bpm}` : undefined} />
          {latest.active_kcal != null && <Stat label={s.kcal} value={String(latest.active_kcal)} unit={s.kcalU} />}
        </div>
      ) : (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5, marginBottom: 10 }}>{s.noData}</div>
      )}

      {/* Fitbit — облачная автосинхронизация */}
      <div className="card" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <i className="ti ti-brand-fitbit" style={{ fontSize: 17, color: "#00b0b9" }} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.fb_title}</span>
          {fitbitConnected && <span style={{ fontSize: 12, color: "#10b981" }}>{s.fb_connected}</span>}
          <span style={{ flex: 1 }} />
          {!fitbitConnected && fitbitConfigured && (
            <a href="/api/integrations/google-health/start" style={{ fontSize: 12.5, padding: "8px 14px", borderRadius: 9, background: "#00b0b9", color: "#fff", textDecoration: "none" }}>{s.fb_connect}</a>
          )}
          {fitbitConnected && (
            <>
              <button onClick={fbSync} disabled={fbBusy} style={{ fontSize: 12.5, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", cursor: fbBusy ? "default" : "pointer", opacity: fbBusy ? 0.6 : 1 }}>{fbBusy ? s.fb_syncing : s.fb_sync}</button>
              <button onClick={fbDisconnect} disabled={fbBusy} style={{ fontSize: 12.5, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "none", color: "var(--text-3)", cursor: "pointer" }}>{s.fb_disconnect}</button>
            </>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginTop: 6 }}>
          {!fitbitConfigured ? s.fb_notconfigured : s.fb_lead}
        </div>
        {fbStatus && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 7 }}>{fbStatus}</div>}
      </div>

      <button onClick={() => setOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
        <i className={`ti ${open ? "ti-chevron-up" : "ti-plug"}`} style={{ fontSize: 15 }} />{open ? s.hide : s.connect}
      </button>

      {open && (
        <div className="card" style={{ marginTop: 8, padding: 16 }}>
          {/* Способ 1 — Команды */}
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{s.a_title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 8 }}>{s.a_lead}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <code style={{ flex: "1 1 240px", minWidth: 0, fontSize: 11.5, background: "var(--surface-2)", padding: "8px 10px", borderRadius: 8, overflowX: "auto", whiteSpace: "nowrap", color: "var(--text-2)" }}>{url || "…"}</code>
            <button onClick={copy} style={{ fontSize: 12.5, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", color: "var(--text)" }}>{copied ? s.copied : s.copy}</button>
            <button onClick={checkLink} style={{ fontSize: 12.5, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", color: "var(--text)" }}>{test || s.test}</button>
          </div>
          <ol style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 18, margin: "0 0 8px" }}>
            {s.steps_list.map((x: string, i: number) => <li key={i}>{x}</li>)}
          </ol>
          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 16 }}>{s.a_hint}</div>

          {/* Способ 2 — Архив */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{s.b_title}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 10 }}>{s.b_lead}</div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, padding: "9px 14px", borderRadius: 9, background: "var(--accent)", color: "#fff", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
              <i className="ti ti-upload" style={{ fontSize: 15 }} />{s.pick}
              <input type="file" accept=".zip,application/zip" onChange={onFile} disabled={busy} style={{ display: "none" }} />
            </label>
            {status && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 9 }}>{status}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
