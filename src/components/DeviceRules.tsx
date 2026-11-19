"use client";

import { useState, useEffect } from "react";

// Правила для всегда-слушающего устройства (Omi): оно присылает весь день
// подряд, а в дневник должно попадать только нужное. Здесь это и настраивается,
// здесь же видно, что отсеялось и почему.

type Device = {
  id: string;
  filter_mode?: string | null;
  trigger_phrases?: string | null;
  min_words?: number | null;
  only_me?: boolean | null;
  quiet_from?: number | null;
  quiet_to?: number | null;
};

type Row = {
  id: string;
  text: string | null;
  spoken_at: string | null;
  decision: string;
  reason: string | null;
  created_at: string | null;
};

const STR: Record<string, any> = {
  ru: {
    title: "Что попадает в дневник",
    lead: "Кулон слушает весь день и присылает всё подряд. Эти правила решают, что из присланного станет записью, а что будет выброшено.",
    mode: "Правило отбора",
    modeTrigger: "По ключевой фразе", modeAi: "AI решает", modeAll: "Сохранять всё",
    modeTriggerH: "В дневник попадёт только то, что сказано после ключевой фразы. Остальное выбрасывается, даже не доходя до AI. Самый предсказуемый и самый дешёвый режим.",
    modeAiH: "Модель читает каждый кусок и решает сама: мысль это или болтовня. Ничего помнить не надо, но иногда ошибается в обе стороны, и каждый кусок стоит денег.",
    modeAllH: "Всё присланное становится записью. Для кулона почти наверняка плохая идея — дневник утонет. Оставлено для кнопки, где каждое нажатие осознанно.",
    phrases: "Ключевые фразы",
    phrasesH: "Через запятую. Скажи фразу вслух и продолжай мысль — в дневник пойдёт то, что после неё.",
    onlyMe: "Только мои слова",
    onlyMeH: "Кулон слышит и собеседников. С этой галочкой чужая речь отбрасывается сразу, без AI.",
    minWords: "Короче — выбрасывать",
    minWordsH: "слов",
    quiet: "Тихие часы",
    quietH: "В эти часы не сохранять ничего. Удобно для рабочего дня или встреч.",
    quietOff: "выключено",
    from: "с", to: "до",
    saved: "Сохранено ✓",
    logT: "Что присылал кулон",
    logOpen: "Показать", logClose: "Скрыть",
    logEmpty: "Пока ничего не приходило.",
    logHint: "Здесь видно всё, что прислало устройство, — и сохранённое, и отброшенное с причиной. По этому списку и настраиваются правила.",
    kept: "в дневник", dropped: "выброшено",
  },
  en: {
    title: "What reaches the diary",
    lead: "The pendant listens all day and sends everything. These rules decide what becomes an entry and what gets dropped.",
    mode: "Selection rule",
    modeTrigger: "By trigger phrase", modeAi: "Let AI decide", modeAll: "Keep everything",
    modeTriggerH: "Only what you say after the trigger phrase reaches the diary. The rest is dropped before any AI runs. The most predictable and cheapest mode.",
    modeAiH: "A model reads each piece and decides: a thought, or small talk? Nothing to remember, but it errs both ways and every piece costs money.",
    modeAllH: "Everything becomes an entry. For a pendant almost certainly a bad idea — the diary drowns. Kept for a button, where every press is deliberate.",
    phrases: "Trigger phrases",
    phrasesH: "Comma separated. Say the phrase out loud and keep going — what follows it goes into the diary.",
    onlyMe: "Only my own words",
    onlyMeH: "The pendant hears other people too. With this on, their speech is dropped immediately, without AI.",
    minWords: "Drop anything shorter than",
    minWordsH: "words",
    quiet: "Quiet hours",
    quietH: "Save nothing during these hours. Handy for the working day or meetings.",
    quietOff: "off",
    from: "from", to: "to",
    saved: "Saved ✓",
    logT: "What the pendant sent",
    logOpen: "Show", logClose: "Hide",
    logEmpty: "Nothing has arrived yet.",
    logHint: "Everything the device sent, kept or dropped with the reason. This list is how you tune the rules.",
    kept: "to diary", dropped: "dropped",
  },
};

const box = {
  fontSize: 13.5, padding: "9px 11px", borderRadius: 9,
  border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)",
} as const;

function Hint({ children }: { children: any }) {
  return <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 5 }}>{children}</div>;
}

export default function DeviceRules({ device, locale }: { device: Device; locale: string }) {
  const s = STR[locale] || STR.en;
  const [mode, setMode] = useState(device.filter_mode || "all");
  const [phrases, setPhrases] = useState(device.trigger_phrases || "");
  const [onlyMe, setOnlyMe] = useState(device.only_me !== false);
  const [minWords, setMinWords] = useState(device.min_words ?? 4);
  const [qFrom, setQFrom] = useState<number | null>(device.quiet_from ?? null);
  const [qTo, setQTo] = useState<number | null>(device.quiet_to ?? null);
  const [flash, setFlash] = useState(false);

  const [logOpen, setLogOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);

  async function save(patch: Record<string, any>) {
    try {
      await fetch("/api/device", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: device.id, ...patch }),
      });
      setFlash(true); setTimeout(() => setFlash(false), 1600);
    } catch {}
  }

  useEffect(() => {
    if (!logOpen || rows) return;
    fetch(`/api/device/inbox?device=${device.id}`)
      .then((r) => r.json())
      .then((j) => setRows(j?.rows || []))
      .catch(() => setRows([]));
  }, [logOpen, rows, device.id]);

  const modes = [
    { k: "trigger", l: s.modeTrigger, h: s.modeTriggerH },
    { k: "ai", l: s.modeAi, h: s.modeAiH },
    { k: "all", l: s.modeAll, h: s.modeAllH },
  ];
  const current = modes.find((m) => m.k === mode) || modes[2];

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
        {flash && <span style={{ fontSize: 11.5, color: "var(--positive, #10b981)" }}>{s.saved}</span>}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>{s.lead}</div>

      {/* Режим отбора */}
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{s.mode}</div>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", borderRadius: 10, padding: 3, gap: 2, flexWrap: "wrap" }}>
        {modes.map((m) => (
          <button key={m.k} onClick={() => { setMode(m.k); save({ filter_mode: m.k }); }}
            style={{
              fontSize: 12.5, fontWeight: 600, padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m.k ? "var(--accent)" : "transparent", color: mode === m.k ? "#fff" : "var(--text-2)",
            }}>
            {m.l}
          </button>
        ))}
      </div>
      <Hint>{current.h}</Hint>

      {/* Ключевые фразы — только когда они что-то решают */}
      {mode === "trigger" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>{s.phrases}</div>
          <input
            value={phrases}
            onChange={(e) => setPhrases(e.target.value)}
            onBlur={() => save({ trigger_phrases: phrases })}
            placeholder="лайф ос, запиши, заметка"
            style={{ ...box, width: "100%", boxSizing: "border-box" }}
          />
          <Hint>{s.phrasesH}</Hint>
        </div>
      )}

      {/* Только мои слова */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={onlyMe}
          onChange={(e) => { setOnlyMe(e.target.checked); save({ only_me: e.target.checked }); }}
          style={{ marginTop: 2, width: 17, height: 17, flexShrink: 0 }} />
        <span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{s.onlyMe}</span>
          <Hint>{s.onlyMeH}</Hint>
        </span>
      </label>

      {/* Минимальная длина */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{s.minWords}</span>
        <input type="number" min={0} max={100} value={minWords}
          onChange={(e) => setMinWords(Number(e.target.value))}
          onBlur={() => save({ min_words: minWords })}
          style={{ ...box, width: 72 }} />
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.minWordsH}</span>
      </div>

      {/* Тихие часы */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.quiet}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.from}</span>
          <HourPick value={qFrom} onChange={(v) => { setQFrom(v); save({ quiet_from: v }); }} off={s.quietOff} />
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.to}</span>
          <HourPick value={qTo} onChange={(v) => { setQTo(v); save({ quiet_to: v }); }} off={s.quietOff} />
        </div>
        <Hint>{s.quietH}</Hint>
      </div>

      {/* Журнал */}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{s.logT}</div>
          <button onClick={() => setLogOpen((v) => !v)}
            style={{ fontSize: 12.5, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", color: "var(--text)" }}>
            {logOpen ? s.logClose : s.logOpen}
          </button>
        </div>
        {logOpen && (
          <div style={{ marginTop: 10 }}>
            <Hint>{s.logHint}</Hint>
            {rows === null ? null : rows.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 10 }}>{s.logEmpty}</div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map((r) => (
                  <div key={r.id} style={{ fontSize: 12.5, lineHeight: 1.5, padding: "9px 11px", borderRadius: 9, background: "var(--surface-2)" }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                        background: r.decision === "saved" ? "var(--positive, #10b981)" : "var(--border)",
                        color: r.decision === "saved" ? "#fff" : "var(--text-3)",
                      }}>
                        {r.decision === "saved" ? s.kept : s.dropped}
                      </span>
                      {r.reason && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{r.reason}</span>}
                      <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>
                        {r.spoken_at ? new Date(r.spoken_at).toLocaleString(locale === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-2)" }}>
                      {(r.text || "").slice(0, 220)}{(r.text || "").length > 220 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HourPick({ value, onChange, off }: { value: number | null; onChange: (v: number | null) => void; off: string }) {
  return (
    <select value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      style={{ ...box, padding: "8px 10px" }}>
      <option value="">{off}</option>
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
      ))}
    </select>
  );
}
