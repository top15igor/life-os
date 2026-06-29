"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/nav";
import { getDict, isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { assistantStrings, pageGuide, searchDestinations } from "@/lib/assistant";

// Публичные роуты, где помощник не нужен (гость, без логина).
const PUBLIC = /^\/(welcome|login|privacy|lock|u|p|path|i)(\/|$)/;

function readLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "";
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

const HIT_ICON: Record<string, string> = {
  entry: "ti-notebook",
  dream: "ti-cloud",
  goal: "ti-target",
  task: "ti-checkbox",
  insight: "ti-bulb",
  person: "ti-user",
  place: "ti-map-pin",
  project: "ti-briefcase",
  path: "ti-route",
  deed: "ti-heart-handshake",
  promise: "ti-flag",
  gratitude: "ti-heart",
  knowledge: "ti-bookmark",
  memory: "ti-camera",
  finance: "ti-wallet",
};

export default function Assistant() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [fbKind, setFbKind] = useState("idea");
  const [fbText, setFbText] = useState("");
  const [fbState, setFbState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    setLocale(readLocale());
  }, []);

  // Сбросить вопрос/ответ при смене страницы.
  useEffect(() => {
    setAnswer(null);
    setErr(false);
    setQuery("");
    setFbState("idle");
    setFbText("");
  }, [path]);

  const t = useMemo(() => getDict(locale), [locale]);
  const s = useMemo(() => assistantStrings(locale), [locale]);
  const nav = t.nav;

  const navHref = (key: string) => (key.startsWith("/") ? key : NAV.find((n) => n.key === key)?.href || "/");
  const navLabel = (key: string) => nav[key] || key;

  // Заголовок текущей страницы — по самому длинному совпавшему href из NAV.
  const pageKey = useMemo(() => {
    let best: { key: string; len: number } | null = null;
    for (const n of NAV) {
      if (n.href === "/") { if (path === "/" && (!best || best.len < 1)) best = { key: n.key, len: 1 }; continue; }
      if (path === n.href || path.startsWith(n.href + "/") || path.startsWith(n.href)) {
        if (!best || n.href.length > best.len) best = { key: n.key, len: n.href.length };
      }
    }
    return best?.key || null;
  }, [path]);

  const guide = useMemo(() => pageGuide(locale, path), [locale, path]);

  // Разделы + вкладки/под-разделы для поиска (мгновенно, по названию).
  const results = useMemo(() => {
    const ql = query.trim().toLowerCase();
    if (!ql) return [];
    const navHits = NAV.filter((n) => (nav[n.key] || n.key).toLowerCase().includes(ql)).map((n) => ({ label: navLabel(n.key), href: n.href, icon: n.icon }));
    const destHits = searchDestinations(locale)
      .filter((d) => d.label.toLowerCase().includes(ql) || d.keys.some((k) => k.includes(ql)))
      .map((d) => ({ label: d.label, href: d.href, icon: d.icon }));
    const seen = new Set<string>();
    return [...navHits, ...destHits].filter((x) => (seen.has(x.href) ? false : (seen.add(x.href), true))).slice(0, 8);
  }, [query, nav, locale]);

  // Полный поиск по содержимому (записи, люди, места, цели, инсайты, знания, память).
  const [hits, setHits] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const ql = query.trim();
    if (ql.length < 2) { setHits([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(ql)}`);
        const d = await r.json().catch(() => null);
        setHits(Array.isArray(d?.results) ? d.results : []);
      } catch { setHits([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function sendWish() {
    const text = fbText.trim();
    if (!text || fbState === "sending") return;
    setFbState("sending");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: fbKind, text }),
      });
      const d = await r.json().catch(() => null);
      if (d?.ok) { setFbState("done"); setFbText(""); }
      else setFbState("error");
    } catch {
      setFbState("error");
    }
  }

  async function ask() {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setErr(false);
    setAnswer(null);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: question, path, locale }),
      });
      const d = await r.json();
      if (d?.ok && d.answer) setAnswer(d.answer);
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || PUBLIC.test(path)) return null;

  const node = (
    <>
      {/* Плавающая кнопка */}
      <button
        className="asst-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={s.bubble}
        title={s.bubble}
      >
        <i className={`ti ${open ? "ti-x" : "ti-help"}`} />
      </button>

      {open && (
        <>
          <div className="asst-backdrop" onClick={() => setOpen(false)} />
          <div className="asst-panel" role="dialog" aria-label={s.title}>
            {/* Шапка */}
            <div className="asst-head">
              <div className="asst-ava"><i className="ti ti-sparkles" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{s.greet}</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label={s.close} className="asst-x"><i className="ti ti-x" /></button>
            </div>

            <div className="asst-body">
              {/* Где ты сейчас */}
              {guide && (
                <div className="asst-card">
                  <div className="asst-lbl">{s.hereNow}{pageKey ? ` · ${navLabel(pageKey)}` : ""}</div>
                  <ul className="asst-ul">
                    {guide.can.map((c, i) => (
                      <li key={i}><i className="ti ti-point" />{c}</li>
                    ))}
                  </ul>
                  {guide.go && guide.go.length > 0 && (
                    <>
                      <div className="asst-lbl" style={{ marginTop: 10 }}>{s.goNext}</div>
                      <div className="asst-chips">
                        {guide.go.map((g, i) => (
                          <button key={i} className="asst-chip" onClick={() => go(navHref(g.key))}>
                            {g.label}<i className="ti ti-chevron-right" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Поиск раздела */}
              <div className="asst-search">
                <i className="ti ti-search" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={s.searchPh}
                  aria-label={s.searchPh}
                />
                {query && <button onClick={() => setQuery("")} aria-label={s.close} className="asst-clear"><i className="ti ti-x" /></button>}
              </div>
              {query && (
                <div className="asst-results">
                  {results.map((n, i) => (
                    <button key={`s${i}`} className="asst-res" onClick={() => go(n.href)}>
                      <i className={`ti ${n.icon}`} />
                      <span>{n.label}</span>
                      <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)" }} />
                    </button>
                  ))}
                  {hits.map((h, i) => (
                    <button key={`h${i}`} className="asst-res" onClick={() => go(h.href)}>
                      <i className={`ti ${HIT_ICON[h.type] || "ti-search"}`} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.title}{h.sub ? <span style={{ color: "var(--text-3)", marginLeft: 6, fontSize: 11 }}>{h.sub}</span> : null}
                      </span>
                      <i className="ti ti-arrow-right" style={{ marginLeft: "auto", color: "var(--text-3)" }} />
                    </button>
                  ))}
                  {results.length === 0 && hits.length === 0 && (
                    <div className="asst-none">{searching ? "…" : s.searchNone}</div>
                  )}
                </div>
              )}

              {/* Спросить AI */}
              <div className="asst-card">
                <div className="asst-lbl"><i className="ti ti-sparkles" style={{ marginRight: 5, color: "var(--accent)" }} />{s.askTitle}</div>
                <textarea
                  ref={taRef}
                  className="asst-ta"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }}
                  placeholder={s.askPh}
                  rows={2}
                />
                <button className="asst-ask" onClick={ask} disabled={loading || !q.trim()}>
                  {loading ? s.asking : s.askBtn}
                </button>
                {answer && (
                  <div className="asst-answer">{answer}</div>
                )}
                {err && <div className="asst-err">{s.askError}</div>}
                {!answer && !err && <div className="asst-hint">{s.askHint}</div>}
              </div>

              {/* Оставить пожелание (идёт владельцу в Telegram) */}
              <div className="asst-card">
                <div className="asst-lbl"><i className="ti ti-message-circle-heart" style={{ marginRight: 5, color: "var(--accent)" }} />{s.fbTitle}</div>
                {fbState === "done" ? (
                  <div className="asst-fbdone"><i className="ti ti-circle-check" />{s.fbThanks}</div>
                ) : (
                  <>
                    <div className="asst-fbsub">{s.fbSub}</div>
                    <div className="asst-fbchips">
                      {[["idea", s.fbIdea], ["sync", s.fbSync], ["other", s.fbOther]].map(([k, label]) => (
                        <button
                          key={k}
                          className={`asst-fbchip${fbKind === k ? " on" : ""}`}
                          onClick={() => setFbKind(k)}
                        >{label}</button>
                      ))}
                    </div>
                    <textarea
                      className="asst-ta"
                      value={fbText}
                      onChange={(e) => setFbText(e.target.value)}
                      placeholder={s.fbPh}
                      rows={2}
                    />
                    <button className="asst-ask" onClick={sendWish} disabled={fbState === "sending" || !fbText.trim()}>
                      {fbState === "sending" ? s.fbSending : s.fbSend}
                    </button>
                    {fbState === "error" && <div className="asst-err">{s.fbError}</div>}
                  </>
                )}
              </div>

              {/* Полная инструкция */}
              <button className="asst-guide" onClick={() => go("/guide")}>
                <i className="ti ti-book" />{s.fullGuide}<i className="ti ti-chevron-right" style={{ marginLeft: "auto" }} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );

  return createPortal(node, document.body);
}
