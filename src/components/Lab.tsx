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
    howTitle: "Как это работает",
    how: ["1. 👀 Наблюдения — факты из твоих записей: сон, настроение, шаги, события.", "2. 🔬 Гипотеза — AI предполагает связь: «возможно, прогулки улучшают сон».", "3. 🧪 Эксперимент — ты проверяешь её несколько дней.", "4. 💡 Вывод — AI честно сравнивает «до» и «во время» и говорит, хватило ли данных."],
    examplesTitle: "Примеры",
    examples: [{ title: "Ложиться спать до 22:30", days: 14 }, { title: "21 день без сахара", days: 21 }, { title: "10 000 шагов каждый день", days: 14 }, { title: "Холодный душ по утрам", days: 21 }, { title: "2 литра воды в день", days: 14 }, { title: "Прогулка 40 минут ежедневно", days: 21 }],
    hypExamples: "Например AI заметит: «в дни, когда ты гуляешь, настроение выше» или «после поздних записей сон хуже».",
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
    howTitle: "How it works",
    how: ["1. 👀 Observations — facts from your entries: sleep, mood, steps, events.", "2. 🔬 Hypothesis — AI suggests a link: \"maybe walks improve your sleep\".", "3. 🧪 Experiment — you test it for a few days.", "4. 💡 Conclusion — AI honestly compares \"before\" vs \"during\" and says if there's enough data."],
    examplesTitle: "Examples",
    examples: [{ title: "Bed before 22:30", days: 14 }, { title: "21 days no sugar", days: 21 }, { title: "10,000 steps a day", days: 14 }, { title: "Cold shower in the morning", days: 21 }, { title: "2 liters of water a day", days: 14 }, { title: "40-min walk every day", days: 21 }],
    hypExamples: "E.g. AI might notice: \"on days you walk, your mood is higher\" or \"after late entries your sleep is worse\".",
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
    howTitle: "Як це працює",
    how: ["1. 👀 Спостереження — факти з твоїх записів: сон, настрій, кроки, події.", "2. 🔬 Гіпотеза — AI припускає зв'язок: «можливо, прогулянки покращують сон».", "3. 🧪 Експеримент — ти перевіряєш її кілька днів.", "4. 💡 Висновок — AI чесно порівнює «до» і «під час» і каже, чи вистачило даних."],
    examplesTitle: "Приклади",
    examples: [{ title: "Лягати спати до 22:30", days: 14 }, { title: "21 день без цукру", days: 21 }, { title: "10 000 кроків щодня", days: 14 }, { title: "Холодний душ зранку", days: 21 }, { title: "2 літри води на день", days: 14 }, { title: "Прогулянка 40 хвилин щодня", days: 21 }],
    hypExamples: "Наприклад AI помітить: «у дні, коли ти гуляєш, настрій вищий» або «після пізніх записів сон гірший».",
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
    howTitle: "Comment ça marche",
    how: ["1. 👀 Observations — des faits de tes entrées : sommeil, humeur, pas, événements.", "2. 🔬 Hypothèse — l'IA suggère un lien : « les promenades améliorent peut-être ton sommeil ».", "3. 🧪 Expérience — tu la testes pendant quelques jours.", "4. 💡 Conclusion — l'IA compare honnêtement « avant » et « pendant » et dit s'il y a assez de données."],
    examplesTitle: "Exemples",
    examples: [{ title: "Au lit avant 22:30", days: 14 }, { title: "21 jours sans sucre", days: 21 }, { title: "10 000 pas par jour", days: 14 }, { title: "Douche froide le matin", days: 21 }, { title: "2 litres d'eau par jour", days: 14 }, { title: "Marche de 40 min chaque jour", days: 21 }],
    hypExamples: "Ex. l'IA pourrait remarquer : « les jours où tu marches, ton humeur est meilleure » ou « après des entrées tardives, ton sommeil est pire ».",
    metrics: { mood: "Humeur", energy: "Énergie", health: "Santé", sleep_hours: "Sommeil" },
  },
  es: {
    tagline: "La IA detecta patrones y propone hipótesis. Tú las pones a prueba con experimentos sobre tu propia vida.",
    active: "Experimentos activos", hypotheses: "Hipótesis de la IA", history: "Descubrimientos e historial", custom: "Experimento propio",
    loading: "La IA está buscando patrones…", noHyp: "Aún no hay suficientes datos para hipótesis — sigue escribiendo y la IA empezará a notar conexiones.",
    noExp: "No hay experimentos activos. Lanza una hipótesis o tu propio experimento.", noHist: "Todavía no hay experimentos terminados.",
    check: "Probarlo", disagree: "No estoy de acuerdo", finish: "Terminar y concluir", del: "Eliminar", start: "Empezar", cancel: "Cancelar",
    days: "d", dayOf: "día", of: "de", obs: "observaciones", basis: "según", durationLabel: "Duración (días)",
    titlePh: "¿Qué estás probando? Ej. «acostarme antes de las 22:30»", delConfirm: "¿Eliminar el experimento?",
    conf: { low: "hipótesis", medium: "probable", high: "hay indicios" },
    result: "Conclusión", enoughNo: "Todavía hay pocos datos — es preliminar. Sigue registrando.",
    before: "antes", after: "durante", noChange: "sin cambios",
    howTitle: "Cómo funciona",
    how: ["1. 👀 Observaciones — hechos de tus entradas: sueño, ánimo, pasos, eventos.", "2. 🔬 Hipótesis — la IA sugiere una conexión: «quizá caminar mejora tu sueño».", "3. 🧪 Experimento — lo pruebas durante unos días.", "4. 💡 Conclusión — la IA compara honestamente «antes» y «durante» y dice si hay suficientes datos."],
    examplesTitle: "Ejemplos",
    examples: [{ title: "Acostarse antes de las 22:30", days: 14 }, { title: "21 días sin azúcar", days: 21 }, { title: "10.000 pasos al día", days: 14 }, { title: "Ducha fría por la mañana", days: 21 }, { title: "2 litros de agua al día", days: 14 }, { title: "Caminata de 40 minutos diaria", days: 21 }],
    hypExamples: "Por ejemplo, la IA podría notar: «en los días que caminas, tu ánimo es mejor» o «después de entradas tardías, tu sueño empeora».",
    metrics: { mood: "Ánimo", energy: "Energía", health: "Salud", sleep_hours: "Sueño" },
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
      <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12, maxWidth: 620 }}>{s.tagline}</div>

      <div className="card" style={{ background: "var(--surface-2)", border: "none", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{s.howTitle}</div>
        {s.how.map((step: string, i: number) => (
          <div key={i} style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, padding: "3px 0" }}>{step}</div>
        ))}
      </div>

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
        <div style={{ marginTop: 4 }}>
          <button onClick={() => setForm({ title: "" })} style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, border: "1px dashed var(--border)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
            <i className="ti ti-plus" style={{ fontSize: 14, verticalAlign: "-2px" }} /> {s.custom}
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", marginTop: 11 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{s.examplesTitle}:</span>
            {s.examples.map((ex: any, i: number) => (
              <button key={i} onClick={() => { setForm({ title: ex.title }); setDuration(ex.days); }} style={{ fontSize: 12, padding: "6px 11px", borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer" }}>
                {ex.title} · {ex.days}{s.days}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Гипотезы AI */}
      <H>🔬 {s.hypotheses}</H>
      {loadingHyp ? (
        <div className="card" style={{ color: "var(--text-3)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-sparkles" style={{ color: "var(--insight)" }} />{s.loading}</div>
      ) : !hyp || hyp.length === 0 ? (
        <div className="card" style={{ color: "var(--text-2)", fontSize: 13.5 }}>
          {s.noHyp}
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8, fontStyle: "italic" }}>{s.hypExamples}</div>
        </div>
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
