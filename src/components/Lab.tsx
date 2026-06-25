"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STR: Record<string, any> = {
  ru: {
    tagline: "AI замечает закономерности и предлагает гипотезы. Ты проверяешь их экспериментами над собственной жизнью.",
    active: "Активные эксперименты", hypotheses: "Гипотезы AI", history: "Открытия и история", custom: "Свой эксперимент",
    loading: "AI ищет закономерности…", noHyp: "Пока недостаточно данных для гипотез — пиши дальше, и AI начнёт замечать связи.",
    noExp: "Активных экспериментов нет. Запусти гипотезу или свой эксперимент.", noHist: "Завершённых экспериментов пока нет.",
    check: "Проверить", disagree: "Не согласен", finish: "Завершить и подвести итог", del: "Удалить", start: "Запустить", cancel: "Отмена",
    days: "дн.", dayOf: "день", of: "из", obs: "наблюдений", basis: "на основе", durationLabel: "Длительность (дней)",
    titlePh: "Что проверяешь? Напр. «ложиться до 22:30»", delConfirm: "Удалить эксперимент?",
    conf: { low: "гипотеза", medium: "вероятно", high: "есть признаки" },
    result: "Итог", enoughNo: "Данных пока мало — вывод предварительный. Продолжай записывать.",
    before: "до", after: "во время", noChange: "без изменений",
    metrics: { mood: "Настроение", energy: "Энергия", health: "Здоровье", sleep_hours: "Сон" },
  },
  en: {
    tagline: "AI spots patterns and suggests hypotheses. You test them with experiments on your own life.",
    active: "Active experiments", hypotheses: "AI hypotheses", history: "Discoveries & history", custom: "Custom experiment",
    loading: "AI is looking for patterns…", noHyp: "Not enough data for hypotheses yet — keep writing and AI will spot links.",
    noExp: "No active experiments. Start a hypothesis or your own experiment.", noHist: "No finished experiments yet.",
    check: "Test it", disagree: "Disagree", finish: "Finish & conclude", del: "Delete", start: "Start", cancel: "Cancel",
    days: "d", dayOf: "day", of: "of", obs: "observations", basis: "based on", durationLabel: "Duration (days)",
    titlePh: "What are you testing? E.g. \"bed before 22:30\"", delConfirm: "Delete experiment?",
    conf: { low: "hypothesis", medium: "likely", high: "signs of it" },
    result: "Conclusion", enoughNo: "Not much data yet — preliminary. Keep journaling.",
    before: "before", after: "during", noChange: "no change",
    metrics: { mood: "Mood", energy: "Energy", health: "Health", sleep_hours: "Sleep" },
  },
  uk: {
    tagline: "AI помічає закономірності й пропонує гіпотези. Ти перевіряєш їх експериментами над власним життям.",
    active: "Активні експерименти", hypotheses: "Гіпотези AI", history: "Відкриття та історія", custom: "Свій експеримент",
    loading: "AI шукає закономірності…", noHyp: "Поки недостатньо даних для гіпотез — пиши далі, і AI почне помічати зв'язки.",
    noExp: "Активних експериментів немає. Запусти гіпотезу або свій експеримент.", noHist: "Завершених експериментів поки немає.",
    check: "Перевірити", disagree: "Не згоден", finish: "Завершити й підбити підсумок", del: "Видалити", start: "Запустити", cancel: "Скасувати",
    days: "дн.", dayOf: "день", of: "з", obs: "спостережень", basis: "на основі", durationLabel: "Тривалість (днів)",
    titlePh: "Що перевіряєш? Напр. «лягати до 22:30»", delConfirm: "Видалити експеримент?",
    conf: { low: "гіпотеза", medium: "ймовірно", high: "є ознаки" },
    result: "Підсумок", enoughNo: "Даних поки мало — висновок попередній. Продовжуй записувати.",
    before: "до", after: "під час", noChange: "без змін",
    metrics: { mood: "Настрій", energy: "Енергія", health: "Здоров'я", sleep_hours: "Сон" },
  },
  fr: {
    tagline: "L'IA repère des schémas et propose des hypothèses. Tu les testes par des expériences sur ta propre vie.",
    active: "Expériences actives", hypotheses: "Hypothèses de l'IA", history: "Découvertes & historique", custom: "Expérience personnalisée",
    loading: "L'IA cherche des schémas…", noHyp: "Pas encore assez de données pour des hypothèses — continue d'écrire.",
    noExp: "Aucune expérience active. Lance une hypothèse ou la tienne.", noHist: "Pas encore d'expériences terminées.",
    check: "Tester", disagree: "Pas d'accord", finish: "Terminer & conclure", del: "Supprimer", start: "Lancer", cancel: "Annuler",
    days: "j", dayOf: "jour", of: "sur", obs: "observations", basis: "d'après", durationLabel: "Durée (jours)",
    titlePh: "Que testes-tu ? Ex. « au lit avant 22:30 »", delConfirm: "Supprimer l'expérience ?",
    conf: { low: "hypothèse", medium: "probable", high: "des signes" },
    result: "Conclusion", enoughNo: "Peu de données — préliminaire. Continue le journal.",
    before: "avant", after: "pendant", noChange: "aucun changement",
    metrics: { mood: "Humeur", energy: "Énergie", health: "Santé", sleep_hours: "Sommeil" },
  },
};

function Conf({ level, s }: any) {
  const c = level === "high" ? "var(--positive)" : level === "medium" ? "#f59e0b" : "var(--text-3)";
  return <span style={{ fontSize: 11, color: c, background: "var(--surface-2)", padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.conf[level] || s.conf.low}</span>;
}

function H({ children }: any) {
  return <div style={{ fontSize: 16, fontWeight: 600, margin: "22px 0 12px", letterSpacing: "-0.01em" }}>{children}</div>;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
function daysSince(d: string) {
  return Math.max(1, Math.round((Date.now() - new Date(d + "T00:00:00Z").getTime()) / 86400000) + 1);
}

export default function Lab({ experiments, locale }: { experiments: any[]; locale: string }) {
  const s = STR[locale] || STR.ru;
  const [exps] = useState<any[]>(experiments);
  const [hyp, setHyp] = useState<any[] | null>(null);
  const [loadingHyp, setLoadingHyp] = useState(true);
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});
  const [form, setForm] = useState<{ title: string; hypothesis?: string } | null>(null);
  const [duration, setDuration] = useState(21);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/life-overview", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
      .then((r) => r.json())
      .then((j) => setHyp(j.data?.hypotheses || []))
      .catch(() => setHyp([]))
      .finally(() => setLoadingHyp(false));
  }, []);

  async function create(title: string, hypothesis?: string) {
    if (!title.trim() || busy) return;
    setBusy(true);
    await fetch("/api/experiment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", title: title.trim(), hypothesis, duration }) }).catch(() => {});
    setBusy(false); setForm(null); setDuration(21); router.refresh();
  }
  async function finish(id: string) {
    if (busy) return; setBusy(true);
    await fetch("/api/experiment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "finish", id }) }).catch(() => {});
    setBusy(false); router.refresh();
  }
  async function del(id: string) {
    if (!confirm(s.delConfirm)) return;
    await fetch("/api/experiment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }).catch(() => {});
    router.refresh();
  }

  const active = exps.filter((e) => e.status === "active");
  const done = exps.filter((e) => e.status === "done");

  const Form = (
    <div className="card" style={{ marginBottom: 12, border: "1px solid var(--accent)" }}>
      {form?.hypothesis && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 8, fontStyle: "italic" }}>“{form.hypothesis}”</div>}
      <input
        autoFocus
        defaultValue={form?.title || ""}
        onChange={(e) => setForm((f) => ({ ...(f || {}), title: e.target.value }))}
        placeholder={s.titlePh}
        style={{ width: "100%", fontSize: 14, padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", marginBottom: 9, boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{s.durationLabel}:</span>
        <input type="number" min={1} max={365} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 21)} style={{ width: 70, fontSize: 13.5, padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} />
        <button onClick={() => create(form?.title || "", form?.hypothesis)} disabled={busy || !(form?.title || "").trim()} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", opacity: busy || !(form?.title || "").trim() ? 0.6 : 1 }}>{s.start}</button>
        <button onClick={() => { setForm(null); setDuration(21); }} style={{ fontSize: 13, padding: "8px 12px", borderRadius: 9, border: "none", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>{s.cancel}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 8, maxWidth: 620 }}>{s.tagline}</div>

      {/* Активные эксперименты */}
      <H>🧪 {s.active}</H>
      {form && !form.hypothesis && Form}
      {active.length === 0 && !(form && !form.hypothesis) ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.noExp}</div>
      ) : (
        active.map((e) => {
          const elapsed = Math.min(e.duration_days, daysSince(e.start_date));
          const pct = Math.round((elapsed / e.duration_days) * 100);
          return (
            <div key={e.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: e.hypothesis ? 3 : 8 }}>{e.title}</div>
              {e.hypothesis && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8, fontStyle: "italic" }}>“{e.hypothesis}”</div>}
              <div style={{ height: 7, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", marginBottom: 5 }}><div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-3)" }}>
                <span>{s.dayOf} {elapsed} {s.of} {e.duration_days}</span>
                <button onClick={() => finish(e.id)} disabled={busy} style={{ marginLeft: "auto", fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>{s.finish}</button>
                <button onClick={() => del(e.id)} style={{ border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-trash" style={{ fontSize: 15 }} /></button>
              </div>
            </div>
          );
        })
      )}
      {!form && (
        <button onClick={() => setForm({ title: "" })} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, border: "1px dashed var(--border)", background: "transparent", color: "var(--accent)", cursor: "pointer", marginTop: 4 }}>
          <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.custom}
        </button>
      )}

      {/* Гипотезы AI */}
      <H>🔬 {s.hypotheses}</H>
      {loadingHyp ? (
        <div className="card" style={{ color: "var(--text-3)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-sparkles" style={{ color: "var(--insight)" }} />{s.loading}</div>
      ) : !hyp || hyp.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.noHyp}</div>
      ) : (
        hyp.map((h: any, i: number) => dismissed[i] ? null : (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{h.text}</div>
                {h.why && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, lineHeight: 1.45 }}>{h.why}</div>}
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Conf level={h.confidence} s={s} />
                  {h.observations ? <span>· {h.observations} {s.obs}</span> : null}
                  {h.refs?.length ? <span>· {s.basis} {h.refs.slice(0, 4).join(", ")}</span> : null}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 9 }}>
              <button onClick={() => setForm({ title: h.text, hypothesis: h.text })} style={{ fontSize: 12.5, fontWeight: 500, padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>🧪 {s.check}</button>
              <button onClick={() => setDismissed((d) => ({ ...d, [i]: true }))} style={{ fontSize: 12.5, padding: "7px 12px", borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer" }}>{s.disagree}</button>
            </div>
          </div>
        ))
      )}
      {form && form.hypothesis && Form}

      {/* История */}
      <H>💡 {s.history}</H>
      {done.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>{s.noHist}</div>
      ) : (
        done.map((e) => (
          <div key={e.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <i className="ti ti-circle-check-filled" style={{ color: "var(--positive)", fontSize: 17 }} />
              <span style={{ fontSize: 14.5, fontWeight: 500, flex: 1 }}>{e.title}</span>
              <button onClick={() => del(e.id)} style={{ border: "none", background: "none", color: "var(--text-3)", cursor: "pointer", padding: 2 }}><i className="ti ti-trash" style={{ fontSize: 15 }} /></button>
            </div>
            {e.result?.deltas && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                {e.result.deltas.filter((d: any) => d.delta != null).map((d: any) => {
                  const up = d.delta > 0, down = d.delta < 0;
                  const col = up ? "var(--positive)" : down ? "#ef4444" : "var(--text-3)";
                  return (
                    <div key={d.metric} style={{ background: "var(--surface-2)", borderRadius: 9, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11.5, color: "var(--text-2)" }}>{s.metrics[d.metric] || d.metric}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: col }}>{d.delta > 0 ? "+" : ""}{d.delta === 0 ? s.noChange : d.delta}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{s.before} {d.before ?? "—"} → {s.after} {d.after ?? "—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {e.result && !e.result.enough && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 8 }}>⚠️ {s.enoughNo}</div>}
          </div>
        ))
      )}
    </div>
  );
}
