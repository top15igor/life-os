"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Device = {
  id: string;
  name: string | null;
  kind: string;
  token: string;
  battery: number | null;
  last_seen: string | null;
  sent_count: number;
};

const STR: Record<string, any> = {
  ru: {
    empty: "Пока ни одного устройства. Начни с Apple Watch — это 5 минут и без всякого железа.",
    addWatch: "Добавить Apple Watch",
    addFob: "Добавить брелок",
    kindWatch: "Часы", kindFob: "Брелок", kindOther: "Устройство",
    namePh: "Название (например, «Мои часы»)",
    add: "Добавить", cancel: "Отмена",
    link: "Личная ссылка устройства",
    linkHint: "Никому её не показывай: у кого ссылка — тот может писать в твой дневник.",
    copy: "Скопировать", copied: "Скопировано ✓",
    test: "Проверить", testing: "Проверяю…", testOk: "Работает ✓", testFail: "Не отвечает",
    rotate: "Сменить ключ", rotateAsk: "Сменить ключ? Старая настройка на устройстве перестанет работать — её придётся вставить заново.",
    del: "Удалить", delAsk: "Удалить устройство? Оно больше не сможет присылать записи.",
    never: "ещё не выходило на связь",
    sent: (n: number) => `записей прислано: ${n}`,
    batt: (n: number) => `заряд ${n}%`,
    howWatch: "Как настроить Apple Watch",
    watchSteps: [
      "На айфоне открой приложение «Команды» → «+» (новая команда).",
      "Добавь действие «Диктовать текст».",
      "Добавь действие «Получить содержимое URL»: вставь ссылку выше, метод — POST, тело — JSON, добавь поле text и подставь в него «Продиктованный текст».",
      "Назови команду «В LIFE OS» и в настройках команды включи «Показывать на Apple Watch».",
      "На часах: приложение «Команды» → «В LIFE OS». Добавь её в «Смарт-стопку» или на циферблат — и она в одно касание.",
    ],
    watchTip: "На айфоне ту же команду можно повесить на «Кнопку действия» (iPhone 15 Pro и новее) или на постукивание по задней крышке — Настройки → Универсальный доступ → Касание → Касание задней панели.",
    howFob: "Для своего брелка (железо)",
    fobLead: "Устройство шлёт запись одним запросом. Если интернета в этот момент нет — пусть сохранит у себя и отправит позже, а в параметре at укажет момент записи: мысль ляжет в дневник тем временем, когда ты её наговорил.",
    fobTip: "Можно прислать и готовый текст: тело {\"text\":\"…\"} — тогда расшифровка не нужна.",
    note: "Запись проходит тот же путь, что и голосовое боту: расшифровка → AI-разбор → дневник. В Telegram придёт подтверждение с текстом — чтобы ты видел, что мысль дошла.",
    sqlNote: "Раздел ещё не готов к работе: нужно применить devices.sql в базе.",
  },
  en: {
    empty: "No devices yet. Start with Apple Watch — 5 minutes, no hardware needed.",
    addWatch: "Add Apple Watch",
    addFob: "Add keyfob",
    kindWatch: "Watch", kindFob: "Keyfob", kindOther: "Device",
    namePh: "Name (e.g. “My watch”)",
    add: "Add", cancel: "Cancel",
    link: "Personal device link",
    linkHint: "Keep it private: whoever has the link can write into your diary.",
    copy: "Copy", copied: "Copied ✓",
    test: "Test", testing: "Testing…", testOk: "Works ✓", testFail: "No response",
    rotate: "New key", rotateAsk: "Issue a new key? The current setup on the device will stop working and must be pasted again.",
    del: "Delete", delAsk: "Delete this device? It will no longer be able to send entries.",
    never: "never connected",
    sent: (n: number) => `entries sent: ${n}`,
    batt: (n: number) => `battery ${n}%`,
    howWatch: "How to set up Apple Watch",
    watchSteps: [
      "On iPhone open the Shortcuts app → “+” (new shortcut).",
      "Add the “Dictate Text” action.",
      "Add “Get Contents of URL”: paste the link above, method POST, body JSON, add a field text and set it to “Dictated Text”.",
      "Name it “To LIFE OS” and turn on “Show on Apple Watch” in the shortcut settings.",
      "On the watch: Shortcuts app → “To LIFE OS”. Add it to the Smart Stack or a watch face for one-tap access.",
    ],
    watchTip: "On iPhone you can also bind the same shortcut to the Action Button (iPhone 15 Pro and newer) or to Back Tap — Settings → Accessibility → Touch → Back Tap.",
    howFob: "For your own keyfob (hardware)",
    fobLead: "The device sends a recording in a single request. With no connection at that moment it can store the clip and upload it later, passing at with the moment of recording — the entry lands in the diary at the time you actually spoke it.",
    fobTip: "Plain text works too: body {\"text\":\"…\"} — no transcription needed.",
    note: "The recording goes the same way as a voice note to the bot: transcription → AI analysis → diary. Telegram sends you a confirmation with the text, so you can see it arrived.",
    sqlNote: "Not ready yet: devices.sql has to be applied to the database.",
  },
};

function kindIcon(kind: string) {
  return kind === "watch" ? "ti-device-watch" : kind === "keyfob" ? "ti-circle-dot" : "ti-device-mobile";
}

function ago(iso: string | null, locale: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DeviceCard({ d, s, locale, origin }: { d: Device; s: any; locale: string; origin: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [test, setTest] = useState("");
  const url = `${origin}/api/device/voice?token=${d.token}`;
  const name = d.name?.trim() || (d.kind === "watch" ? s.kindWatch : d.kind === "keyfob" ? s.kindFob : s.kindOther);

  const meta = [
    ago(d.last_seen, locale) || s.never,
    d.sent_count ? s.sent(d.sent_count) : null,
    typeof d.battery === "number" ? s.batt(d.battery) : null,
  ].filter(Boolean).join(" · ");

  function copy() {
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  async function check() {
    setTest(s.testing);
    try {
      const r = await fetch(url, { method: "GET" }).then((x) => x.json());
      setTest(r?.ok ? s.testOk : s.testFail);
    } catch { setTest(s.testFail); }
    setTimeout(() => setTest(""), 3000);
  }

  async function rotate() {
    if (!confirm(s.rotateAsk)) return;
    await fetch("/api/device", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.id }) });
    router.refresh();
  }

  async function remove() {
    if (!confirm(s.delAsk)) return;
    await fetch(`/api/device?id=${d.id}`, { method: "DELETE" });
    router.refresh();
  }

  const btn = { fontSize: 12.5, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", color: "var(--text)" } as const;

  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <i className={`ti ${kindIcon(d.kind)}`} style={{ fontSize: 20, color: "var(--accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{meta}</div>
        </div>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{s.link}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
        <code style={{ flex: "1 1 240px", minWidth: 0, fontSize: 11.5, background: "var(--surface-2)", padding: "8px 10px", borderRadius: 8, overflowX: "auto", whiteSpace: "nowrap", color: "var(--text-2)" }}>{url}</code>
        <button onClick={copy} style={btn}>{copied ? s.copied : s.copy}</button>
        <button onClick={check} style={btn}>{test || s.test}</button>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 12 }}>{s.linkHint}</div>

      {d.kind === "watch" ? (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.howWatch}</div>
          <ol style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 18, margin: "0 0 8px" }}>
            {s.watchSteps.map((x: string, i: number) => <li key={i}>{x}</li>)}
          </ol>
          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{s.watchTip}</div>
        </div>
      ) : (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.howFob}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 8 }}>{s.fobLead}</div>
          <pre style={{ fontSize: 11, background: "var(--surface-2)", padding: "10px 12px", borderRadius: 8, overflowX: "auto", color: "var(--text-2)", margin: "0 0 6px", lineHeight: 1.5 }}>
{`POST ${url}&at=<unixtime>&battery=<0..100>
Content-Type: audio/wav

<...байты записи...>`}
          </pre>
          <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{s.fobTip}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button onClick={rotate} style={{ ...btn, background: "none", color: "var(--text-3)" }}>{s.rotate}</button>
        <button onClick={remove} style={{ ...btn, background: "none", color: "var(--negative, #ef4444)" }}>{s.del}</button>
      </div>
    </div>
  );
}

export default function DevicesManager({ devices, locale, origin, ready }: { devices: Device[]; locale: string; origin: string; ready: boolean }) {
  const s = STR[locale] || STR.en;
  const router = useRouter();
  const [adding, setAdding] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(kind: string) {
    setBusy(true);
    try {
      await fetch("/api/device", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: name.trim() }),
      });
      setAdding(null); setName("");
      router.refresh();
    } catch {}
    setBusy(false);
  }

  const addBtn = { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer" } as const;

  return (
    <div>
      {!ready && (
        <div className="card" style={{ padding: 14, marginBottom: 14, fontSize: 12.5, color: "var(--text-2)" }}>{s.sqlNote}</div>
      )}

      {devices.length === 0 && (
        <div className="card" style={{ padding: 14, marginBottom: 14, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{s.empty}</div>
      )}

      {devices.map((d) => <DeviceCard key={d.id} d={d} s={s} locale={locale} origin={origin} />)}

      {adding ? (
        <div className="card" style={{ padding: 14 }}>
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder={s.namePh} autoFocus
            style={{ width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => add(adding)} disabled={busy} style={{ ...addBtn, background: "var(--accent)", color: "#fff", opacity: busy ? 0.6 : 1 }}>{s.add}</button>
            <button onClick={() => { setAdding(null); setName(""); }} style={{ ...addBtn, background: "var(--surface-2)", color: "var(--text-2)" }}>{s.cancel}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setAdding("watch")} style={{ ...addBtn, background: "var(--accent)", color: "#fff" }}>
            <i className="ti ti-device-watch" style={{ fontSize: 17 }} />{s.addWatch}
          </button>
          <button onClick={() => setAdding("keyfob")} style={{ ...addBtn, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}>
            <i className="ti ti-circle-dot" style={{ fontSize: 17 }} />{s.addFob}
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55, marginTop: 18 }}>{s.note}</div>
    </div>
  );
}
