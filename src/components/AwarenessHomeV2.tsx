"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GREEN = "#6f8f72";
const CAT_COLOR: Record<string, { c: string; bg: string }> = {
  health: { c: "#5f9a98", bg: "#e3eeed" },
  sport: { c: "#6f8f72", bg: "#e7efe7" },
  food: { c: "#b9824f", bg: "#f4ebe0" },
  emotions: { c: "#bd7d93", bg: "#f3e7ec" },
  event: { c: "#7a8cc2", bg: "#e9ecf6" },
  ideas: { c: "#9683c1", bg: "#ece8f4" },
  insight: { c: "#9683c1", bg: "#ece8f4" },
  family: { c: "#ad8763", bg: "#f1e9df" },
  relationship: { c: "#ad8763", bg: "#f1e9df" },
};
const catMeta = (slug: string) => CAT_COLOR[slug] || { c: "#8b857c", bg: "#efece6" };

const T: Record<string, any> = {
  ru: {
    eyebrow: "Голосовая память твоего дня",
    title: "Просто говори — LIFE OS соберёт твою жизнь в единую книгу",
    sub: "Еда, спорт, самочувствие, эмоции и мысли сами попадут в нужные разделы.",
    micIdle: "Нажми и говори", micIdleSub: "Я сам пойму, куда сохранить",
    micRec: "Слушаю…", micRecSub: "Говори спокойно, я записываю",
    micProc: "Распознаю…", micProcSub: "Раскладываю по разделам",
    micDone: "Готово", micDoneSub: "Сохранено в твой дневник",
    examples: [
      { q: "Съел омлет и салат", c: "food", t: "Питание" },
      { q: "Пробежал 5 километров", c: "sport", t: "Спорт" },
      { q: "Чувствую усталость", c: "health", t: "Самочувствие" },
      { q: "Был продуктивный день", c: "event", t: "События" },
      { q: "Идея для проекта", c: "ideas", t: "Мысли" },
    ],
    trackTitle: "Что можно отслеживать", trackSub: "Просто скажи — попадёт в нужный раздел",
    categories: [
      { slug: "food", name: "Питание", desc: "Еда, вода, витамины", phrases: ["Съел омлет", "Выпил воды"] },
      { slug: "sport", name: "Спорт", desc: "Тренировки, бег, шаги", phrases: ["Пробежал 5 км", "Зарядка"] },
      { slug: "health", name: "Самочувствие", desc: "Энергия, сон, здоровье", phrases: ["Плохо спал", "Много сил"] },
      { slug: "emotions", name: "Эмоции", desc: "Настроение, стресс", phrases: ["Спокоен", "Радостно"] },
      { slug: "event", name: "События", desc: "Дела, встречи, моменты", phrases: ["Встреча", "Поездка"] },
      { slug: "ideas", name: "Мысли", desc: "Идеи, инсайты, решения", phrases: ["Идея", "Понял, что…"] },
    ],
    period: { week: "Неделя", month: "Месяц", year: "Год" },
    periodText: {
      week: "В конце недели соберу твои тренировки, питание и самочувствие в короткий итог.",
      month: "За месяц увижу закономерности: что давало энергию, как менялся сон и настроение.",
      year: "А за год — большая картина: «1 240 км бега, 286 записей о самочувствии, 42 инсайта».",
    },
    later: "LIFE OS ПОКАЖЕТ ПОЗЖЕ",
    todayTitle: "Сегодня уже зафиксировано", todaySub: "Спокойная хроника твоего дня",
    todayEmpty: "Пока тихо. Скажи первую фразу — и твоя история начнётся.",
    aiBadge: "Что заметил AI", aiCta: "Открыть полную аналитику",
    aiEmpty: "Чем больше рассказываешь — тем точнее картина. Загляни сюда через пару дней.",
    countWord: (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "запись" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "записи" : "записей"} сегодня`,
  },
  en: {
    eyebrow: "Voice memory of your day",
    title: "Just speak — LIFE OS turns your life into one book",
    sub: "Food, sport, wellbeing, emotions and thoughts land in the right sections by themselves.",
    micIdle: "Tap and speak", micIdleSub: "I'll figure out where to save it",
    micRec: "Listening…", micRecSub: "Speak calmly, I'm recording",
    micProc: "Transcribing…", micProcSub: "Sorting into sections",
    micDone: "Done", micDoneSub: "Saved to your diary",
    examples: [
      { q: "Had an omelette and salad", c: "food", t: "Food" },
      { q: "Ran 5 kilometers", c: "sport", t: "Sport" },
      { q: "Feeling tired", c: "health", t: "Wellbeing" },
      { q: "A productive day", c: "event", t: "Events" },
      { q: "An idea for a project", c: "ideas", t: "Thoughts" },
    ],
    trackTitle: "What you can track", trackSub: "Just say it — it goes to the right section",
    categories: [
      { slug: "food", name: "Food", desc: "Meals, water, vitamins", phrases: ["Had an omelette", "Drank water"] },
      { slug: "sport", name: "Sport", desc: "Workouts, running, steps", phrases: ["Ran 5 km", "Workout"] },
      { slug: "health", name: "Wellbeing", desc: "Energy, sleep, health", phrases: ["Slept badly", "Lots of energy"] },
      { slug: "emotions", name: "Emotions", desc: "Mood, stress", phrases: ["Calm", "Joyful"] },
      { slug: "event", name: "Events", desc: "Tasks, meetings, moments", phrases: ["Meeting", "Trip"] },
      { slug: "ideas", name: "Thoughts", desc: "Ideas, insights, decisions", phrases: ["An idea", "Realized that…"] },
    ],
    period: { week: "Week", month: "Month", year: "Year" },
    periodText: {
      week: "At week's end I'll sum up your workouts, food and wellbeing.",
      month: "Over a month I'll spot patterns: what gave energy, how sleep and mood shifted.",
      year: "And over a year — the big picture: “1,240 km run, 286 wellbeing notes, 42 insights.”",
    },
    later: "LIFE OS WILL SHOW LATER",
    todayTitle: "Already captured today", todaySub: "A calm chronicle of your day",
    todayEmpty: "Quiet so far. Say your first line — and your story begins.",
    aiBadge: "What AI noticed", aiCta: "Open full analytics",
    aiEmpty: "The more you share, the clearer the picture. Check back in a couple of days.",
    countWord: (n: number) => `${n} ${n === 1 ? "entry" : "entries"} today`,
  },
};

export default function AwarenessHomeV2({ data, locale }: { data: any; locale: string }) {
  const t = T[locale] || T.ru;
  const router = useRouter();
  const [mic, setMic] = useState<"idle" | "recording" | "recognizing" | "sorted">("idle");
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [exIdx, setExIdx] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timersRef = useRef<any[]>([]);

  useEffect(() => {
    const id = setInterval(() => setExIdx((i) => (i + 1) % t.examples.length), 2600);
    return () => clearInterval(id);
  }, [t.examples.length]);

  function clearTimers() { timersRef.current.forEach((x) => clearTimeout(x)); timersRef.current = []; }
  useEffect(() => () => clearTimers(), []);

  async function toggleMic() {
    if (mic === "recording") { try { mediaRef.current?.stop(); } catch {} return; }
    if (mic === "recognizing") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setMic("recognizing");
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
        const fd = new FormData();
        fd.append("audio", blob, `voice.${ext}`);
        try {
          const res = await fetch("/api/capture-voice", { method: "POST", body: fd });
          const j = await res.json().catch(() => null);
          if (res.ok && j?.ok) { setMic("sorted"); router.refresh(); timersRef.current.push(setTimeout(() => setMic("idle"), 2600)); }
          else setMic("idle");
        } catch { setMic("idle"); }
      };
      mr.start();
      mediaRef.current = mr;
      setMic("recording");
    } catch {
      setMic("idle");
    }
  }

  const micLabel = mic === "recording" ? t.micRec : mic === "recognizing" ? t.micProc : mic === "sorted" ? t.micDone : t.micIdle;
  const micSub = mic === "recording" ? t.micRecSub : mic === "recognizing" ? t.micProcSub : mic === "sorted" ? t.micDoneSub : t.micIdleSub;
  const today = data.today || [];
  const insights: string[] = (data.insights || []).slice(0, 3);
  const ex = t.examples[exIdx];

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`@keyframes v2pulse{0%{transform:scale(.72);opacity:.5}100%{transform:scale(1.9);opacity:0}}@keyframes v2breathe{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.12);opacity:.8}}@keyframes v2wave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}@keyframes v2fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes v2spin{to{transform:rotate(360deg)}}`}</style>

      {/* HERO */}
      <section style={{ position: "relative", borderRadius: 26, padding: "26px 22px 22px", background: "linear-gradient(150deg,#eef1ea,#f5efe9 55%,#edf0f5)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 100, background: "rgba(255,255,255,.7)", fontSize: 11.5, fontWeight: 500, color: "#5b7a60", marginBottom: 14 }}>
          <span style={{ width: 5, height: 5, borderRadius: 9, background: GREEN }} />{t.eyebrow}
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#26241f" }}>{t.title}</h1>
        <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.5, color: "#6f6a62", maxWidth: 540 }}>{t.sub}</p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 168, height: 168, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mic === "recording" && <><span style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "rgba(111,143,114,.3)", animation: "v2pulse 2s ease-out infinite" }} /><span style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "rgba(111,143,114,.3)", animation: "v2pulse 2s ease-out infinite 1s" }} /></>}
            {mic === "idle" && <span style={{ position: "absolute", inset: 24, borderRadius: "50%", background: "radial-gradient(circle,rgba(111,143,114,.32),transparent 70%)", animation: "v2breathe 4.5s ease-in-out infinite" }} />}
            <button onClick={toggleMic} aria-label={micLabel} style={{ position: "relative", width: 116, height: 116, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(140deg,#7e9c80,#5b7a60)", boxShadow: "0 16px 34px -12px rgba(91,122,96,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {mic === "recording" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 3.5, height: 36 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ width: 3.5, height: 36, borderRadius: 3, background: "#fff", transformOrigin: "center", animation: `v2wave .9s ease-in-out infinite ${(i * 0.09).toFixed(2)}s` }} />)}
                </span>
              ) : mic === "recognizing" ? (
                <span style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "v2spin .9s linear infinite" }} />
              ) : mic === "sorted" ? (
                <i className="ti ti-check" style={{ fontSize: 46, color: "#fff" }} />
              ) : (
                <i className="ti ti-microphone" style={{ fontSize: 40, color: "#fff" }} />
              )}
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#26241f" }}>{micLabel}</div>
            <div style={{ fontSize: 12.5, color: "#8b857c", marginTop: 2 }}>{micSub}</div>
          </div>
        </div>

        {/* rotating example */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,.72)", border: "1px solid rgba(44,42,38,.05)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span key={exIdx} style={{ fontSize: 14, fontStyle: "italic", color: "#3a372f", animation: "v2fade .4s ease" }}>«{ex.q}»</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 11.5, fontWeight: 500, color: catMeta(ex.c).c }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: catMeta(ex.c).c }} />{ex.t}
          </span>
        </div>
      </section>

      {/* PERIOD PREVIEW */}
      <section style={{ background: "#fff", border: "1px solid rgba(44,42,38,.06)", borderRadius: 20, padding: "18px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: ".04em", color: "#a39d93", marginBottom: 10 }}>{t.later}</div>
        <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f4f2ed", marginBottom: 12 }}>
          {(["week", "month", "year"] as const).map((k) => (
            <button key={k} onClick={() => setPeriod(k)} style={{ border: "none", cursor: "pointer", padding: "7px 15px", borderRadius: 9, fontSize: 13, fontWeight: 500, background: period === k ? "#fff" : "transparent", color: period === k ? "#26241f" : "#8b857c", boxShadow: period === k ? "0 1px 4px rgba(44,42,38,.14)" : "none" }}>{t.period[k]}</button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 15, fontStyle: "italic", lineHeight: 1.5, color: "#46423a", animation: "v2fade .4s ease" }}>{t.periodText[period]}</p>
      </section>

      {/* CATEGORIES */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "4px 2px 12px" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#26241f" }}>{t.trackTitle}</h2>
        <span style={{ fontSize: 12, color: "#a39d93" }}>{t.trackSub}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        {t.categories.map((c: any) => {
          const m = catMeta(c.slug);
          return (
            <div key={c.slug} style={{ background: "#fff", border: "1px solid rgba(44,42,38,.06)", borderRadius: 16, padding: 15 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: m.c }} /></div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#26241f" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#8b857c", marginTop: 2, marginBottom: 9 }}>{c.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {c.phrases.map((p: string, i: number) => <span key={i} style={{ padding: "4px 9px", borderRadius: 100, background: m.bg, fontSize: 11, color: m.c }}>«{p}»</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* TODAY + AI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid rgba(44,42,38,.06)", borderRadius: 20, padding: "20px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#26241f" }}>{t.todayTitle}</h3>
            {today.length > 0 && <span style={{ fontSize: 11.5, fontWeight: 500, color: GREEN, background: "#e7efe7", padding: "3px 10px", borderRadius: 100 }}>{t.countWord(today.length)}</span>}
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "#a39d93" }}>{t.todaySub}</p>
          {today.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "#8b857c", padding: "12px 0 18px", lineHeight: 1.5 }}>{t.todayEmpty}</div>
          ) : (
            today.map((e: any) => {
              const slug = e.cats?.[0]?.slug || "";
              const m = catMeta(slug);
              return (
                <Link key={e.id} href={`/entry/${e.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid rgba(44,42,38,.06)", textDecoration: "none" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 9, background: m.c, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "#33302a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.summary}</div>
                    {e.cats?.[0] && <div style={{ fontSize: 12, color: m.c }}>{e.cats[0].name}</div>}
                  </div>
                  <span style={{ fontSize: 12.5, color: "#b3ada3", flexShrink: 0 }}>{e.time}</span>
                </Link>
              );
            })
          )}
        </div>

        <div style={{ background: "linear-gradient(160deg,#2f3a31,#26302a)", borderRadius: 20, padding: 22, color: "#fff" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 11px", borderRadius: 100, background: "rgba(255,255,255,.1)", fontSize: 11.5, fontWeight: 500, color: "#cfe0cd", marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9, background: "#9fc09c" }} />{t.aiBadge}
          </div>
          {insights.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {insights.map((l, i) => <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,.92)" }}>{l}</p>)}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.85)" }}>{t.aiEmpty}</p>
          )}
          <Link href="/analytics" style={{ display: "block", textAlign: "center", marginTop: 20, padding: 13, borderRadius: 13, background: "rgba(255,255,255,.95)", color: "#26302a", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>{t.aiCta}</Link>
        </div>
      </div>
    </div>
  );
}
