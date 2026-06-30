"use client";

import { useMemo, useState } from "react";
import { computeStats, type Book, type Quote, type BookHit, type Recommendation } from "@/lib/books";

const T: Record<string, any> = {
  ru: {
    lead: "Твоя библиотека: что читаешь, что хочешь и что прочитал. Ставь оценку, пиши мини-ревью «зашла или нет» и сохраняй цитаты.",
    add: "Добавить книгу", addPh: "Название книги или автор…", searching: "Ищу…", noHits: "Ничего не нашлось — попробуй иначе или добавь вручную.",
    rec: "Что почитать дальше", recLoading: "AI подбирает…", recHead: "AI советует тебе", recAdd: "В «Хочу»", recEmpty: "Оцени несколько прочитанных книг — и AI подберёт, что почитать дальше.",
    tabs: { all: "Все", want: "Хочу прочитать", reading: "Читаю", read: "Прочитал" },
    status: { want: "Хочу прочитать", reading: "Читаю", read: "Прочитал" },
    empty: "Пока пусто. Добавь первую книгу 📚",
    goalTitle: "Цель года", goalSet: "Сколько книг прочитать за год?", booksY: "книг в этом году",
    statTotal: "Всего", statReading: "Читаю", statAvg: "Средняя оценка", statPages: "Страниц",
    review: "Мини-ревью", reviewPh: "Зашла или нет? Пара слов от себя…", notes: "Заметки и размышления", notesPh: "Мысли, что зацепило, выводы…",
    liked: "Зашла", notLiked: "Не зашла", rating: "Оценка", pages: "Страниц", curPage: "Сейчас на странице",
    quotes: "Цитаты", quotePh: "Любимая цитата из книги…", quoteAdd: "Добавить цитату", page: "стр.",
    fav: "В любимые", del: "Удалить из библиотеки",
    shareOn: "Поделиться библиотекой", shareOff: "Библиотека открыта по ссылке", copy: "Скопировать", copied: "Скопировано ✓", openPub: "Открыть как друг",
    shareHint: "Друзья откроют по ссылке и увидят, что ты читаешь и советуешь, с твоими оценками и ревью.",
    save: "Сохранить", manual: "Добавить вручную", manualTitle: "Название", manualAuthor: "Автор",
  },
  en: {
    lead: "Your library: what you're reading, want to read, and have read. Rate books, write a quick “loved it or not” review and save quotes.",
    add: "Add a book", addPh: "Book title or author…", searching: "Searching…", noHits: "Nothing found — try differently or add manually.",
    rec: "What to read next", recLoading: "AI is picking…", recHead: "AI suggests for you", recAdd: "To “Want”", recEmpty: "Rate a few books you've read — and AI will suggest what to read next.",
    tabs: { all: "All", want: "Want to read", reading: "Reading", read: "Read" },
    status: { want: "Want to read", reading: "Reading", read: "Read" },
    empty: "Empty for now. Add your first book 📚",
    goalTitle: "Year goal", goalSet: "How many books to read this year?", booksY: "books this year",
    statTotal: "Total", statReading: "Reading", statAvg: "Avg rating", statPages: "Pages",
    review: "Mini review", reviewPh: "Loved it or not? A few words…", notes: "Notes & reflections", notesPh: "Thoughts, what struck you, takeaways…",
    liked: "Loved it", notLiked: "Not for me", rating: "Rating", pages: "Pages", curPage: "Current page",
    quotes: "Quotes", quotePh: "A favorite quote…", quoteAdd: "Add quote", page: "p.",
    fav: "Favorite", del: "Remove from library",
    shareOn: "Share library", shareOff: "Library is public by link", copy: "Copy", copied: "Copied ✓", openPub: "Open as a friend",
    shareHint: "Friends open it by link and see what you read and recommend, with your ratings and reviews.",
    save: "Save", manual: "Add manually", manualTitle: "Title", manualAuthor: "Author",
  },
};

function Stars({ value, onSet }: { value: number | null; onSet: (n: number) => void }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onSet(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <i className={`ti ${n <= (value || 0) ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 20, color: n <= (value || 0) ? "#f59e0b" : "var(--text-3)" }} />
        </button>
      ))}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = { want: "#6366f1", reading: "#0ea5e9", read: "#10b981" };

export default function Books({ locale, initial, quotes: initialQuotes, goal: initialGoal, share }: { locale: string; initial: Book[]; quotes: Quote[]; goal: number; share: { slug: string | null; isPublic: boolean } }) {
  const t = locale === "en" || locale === "fr" ? T.en : T.ru;
  const [books, setBooks] = useState<Book[]>(initial);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [goal, setGoal] = useState(initialGoal);
  const [tab, setTab] = useState<"all" | "want" | "reading" | "read">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<BookHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(false);
  const [mTitle, setMTitle] = useState(""); const [mAuthor, setMAuthor] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(share.isPublic);
  const [slug, setSlug] = useState(share.slug);
  const [copied, setCopied] = useState(false);

  const year = new Date().getFullYear();
  const stats = useMemo(() => computeStats(books, goal, year), [books, goal, year]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pubUrl = slug ? `${origin}/b/${slug}` : "";

  const counts = { all: books.length, want: 0, reading: 0, read: 0 } as any;
  books.forEach((b) => (counts[b.status] = (counts[b.status] || 0) + 1));
  const shown = tab === "all" ? books : books.filter((b) => b.status === tab);
  const detail = books.find((b) => b.id === detailId) || null;
  const detailQuotes = quotes.filter((x) => x.book_id === detailId);

  async function api(payload: any) {
    return fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => ({ ok: false }));
  }

  async function runSearch(query: string) {
    setQ(query);
    if (query.trim().length < 2) { setHits([]); return; }
    setSearching(true);
    const r = await api({ action: "search", q: query });
    setSearching(false);
    if (r?.ok) setHits(r.hits || []);
  }

  async function addHit(h: BookHit, status = "want") {
    const r = await api({ action: "add", title: h.title, author: h.author, coverUrl: h.coverUrl, year: h.year, isbn: h.isbn, olKey: h.olKey, genre: h.genre, status });
    if (r?.ok && r.book) { setBooks((b) => [r.book, ...b]); setAddOpen(false); setQ(""); setHits([]); }
  }

  async function addManual() {
    if (!mTitle.trim()) return;
    const r = await api({ action: "add", title: mTitle, author: mAuthor || null, status: "want" });
    if (r?.ok && r.book) { setBooks((b) => [r.book, ...b]); setAddOpen(false); setManual(false); setMTitle(""); setMAuthor(""); }
  }

  function patch(id: string, fields: any) {
    setBooks((b) => b.map((x) => (x.id === id ? { ...x, ...fields } : x)));
    api({ action: "update", id, fields });
  }

  async function del(id: string) {
    setBooks((b) => b.filter((x) => x.id !== id));
    setDetailId(null);
    await api({ action: "delete", id });
  }

  async function addRecToWant(r: Recommendation) {
    const res = await api({ action: "addByTitle", title: r.title, author: r.author });
    if (res?.ok && res.book) { setBooks((b) => [res.book, ...b]); setRecs((rs) => (rs || []).filter((x) => x.title !== r.title)); }
  }

  async function loadRecs() {
    setRecLoading(true);
    const r = await api({ action: "recommend" });
    setRecLoading(false);
    setRecs(r?.recs || []);
  }

  async function toggleShare() {
    const next = !isPublic; setIsPublic(next);
    const r = await api({ action: "setPublic", value: next });
    if (r?.ok) setSlug(r.slug);
  }

  async function addQuote(bookId: string, text: string) {
    if (!text.trim()) return;
    const r = await api({ action: "addQuote", bookId, text });
    if (r?.ok && r.quote) setQuotes((qs) => [r.quote, ...qs]);
  }
  async function delQuote(id: string) {
    setQuotes((qs) => qs.filter((x) => x.id !== id));
    await api({ action: "deleteQuote", id });
  }

  function saveGoal(v: number) { setGoal(v); api({ action: "setGoal", goal: v }); }
  function copy() { navigator.clipboard?.writeText(pubUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }

  const pct = goal > 0 ? Math.min(100, Math.round((stats.readThisYear / goal) * 100)) : 0;

  return (
    <div>
      <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 14, maxWidth: 640 }}>{t.lead}</div>

      {/* Цель года + статистика */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: 54, height: 54, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pct * 0.974} 100`} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{stats.readThisYear}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{t.goalTitle} {year}</div>
            <input type="number" min={0} value={goal || ""} onChange={(e) => saveGoal(Number(e.target.value) || 0)} placeholder="—" style={{ width: 54, fontSize: 15, fontWeight: 600, border: "none", borderBottom: "1px solid var(--border)", background: "none", color: "var(--text)", padding: "1px 2px" }} />
            <span style={{ fontSize: 12, color: "var(--text-3)" }}> {t.booksY}</span>
          </div>
        </div>
        <Stat n={stats.total} label={t.statTotal} />
        <Stat n={stats.reading} label={t.statReading} />
        <Stat n={stats.avgRating ?? "—"} label={t.statAvg} icon="ti-star-filled" />
      </div>

      {/* Кнопки */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setAddOpen(true)} style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-plus" style={{ fontSize: 16, verticalAlign: "-2px" }} /> {t.add}
        </button>
        <button onClick={loadRecs} disabled={recLoading} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--accent)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          <i className="ti ti-sparkles" style={{ fontSize: 16, verticalAlign: "-2px" }} /> {recLoading ? t.recLoading : t.rec}
        </button>
      </div>

      {/* AI рекомендации */}
      {recs && (
        <div className="card" style={{ marginBottom: 16, background: "var(--accent-bg)" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}><i className="ti ti-sparkles" style={{ color: "var(--accent)" }} /> {t.recHead}</div>
          {recs.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>{t.recEmpty}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {recs.map((r, i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{r.author}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.45, margin: "5px 0 8px" }}>{r.why}</div>
                  <button onClick={() => addRecToWant(r)} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>+ {t.recAdd}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Поделиться */}
      <div className="card" style={{ marginBottom: 18, background: isPublic ? "var(--accent-bg)" : "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={toggleShare} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: "none", background: isPublic ? "var(--accent)" : "var(--surface-2)", color: isPublic ? "#fff" : "var(--text)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            <i className={`ti ${isPublic ? "ti-check" : "ti-share-2"}`} style={{ fontSize: 16 }} />{isPublic ? t.shareOff : t.shareOn}
          </button>
          {isPublic && pubUrl && (
            <>
              <code style={{ fontSize: 12.5, color: "var(--text-2)", background: "var(--surface-2)", padding: "6px 10px", borderRadius: 8 }}>{pubUrl.replace(/^https?:\/\//, "")}</code>
              <button onClick={copy} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--accent)", fontSize: 12.5, cursor: "pointer" }}>{copied ? t.copied : t.copy}</button>
              <a href={pubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--text-3)" }}>{t.openPub} →</a>
            </>
          )}
        </div>
        {isPublic && <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, marginTop: 9 }}>{t.shareHint}</div>}
      </div>

      {/* Полки */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {(["all", "want", "reading", "read"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 13px", borderRadius: 999, border: "1px solid var(--border)", background: tab === k ? "var(--accent)" : "var(--surface)", color: tab === k ? "#fff" : "var(--text-2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            {t.tabs[k]} {counts[k] ? <span style={{ opacity: 0.7 }}>{counts[k]}</span> : ""}
          </button>
        ))}
      </div>

      {/* Сетка книг */}
      {shown.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-2)", padding: "30px 20px" }}>{t.empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
          {shown.map((b) => (
            <div key={b.id} onClick={() => setDetailId(b.id)} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}>
              <div style={{ aspectRatio: "2 / 3", background: "var(--surface-2)", position: "relative" }}>
                {b.cover_url ? <img src={b.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-book-2" style={{ fontSize: 34, color: "var(--text-3)" }} /></div>}
                {b.favorite && <i className="ti ti-heart-filled" style={{ position: "absolute", top: 7, right: 7, fontSize: 16, color: "#ec4899" }} />}
                <span style={{ position: "absolute", left: 7, bottom: 7, fontSize: 10.5, fontWeight: 600, color: "#fff", background: STATUS_COLOR[b.status], borderRadius: 6, padding: "2px 7px" }}>{t.status[b.status]}</span>
              </div>
              <div style={{ padding: "9px 10px 11px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{b.title}</div>
                {b.author && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{b.author}</div>}
                {b.status === "read" && (b.rating || b.liked != null) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                    {b.rating ? <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}><i className="ti ti-star-filled" style={{ fontSize: 12 }} /> {b.rating}</span> : null}
                    {b.liked === true && <i className="ti ti-thumb-up-filled" style={{ fontSize: 13, color: "#10b981" }} />}
                    {b.liked === false && <i className="ti ti-thumb-down-filled" style={{ fontSize: 13, color: "#ef4444" }} />}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления */}
      {addOpen && (
        <Modal onClose={() => { setAddOpen(false); setManual(false); }}>
          {!manual ? (
            <>
              <input autoFocus value={q} onChange={(e) => runSearch(e.target.value)} placeholder={t.addPh} style={inp} />
              <div style={{ minHeight: 40, marginTop: 10 }}>
                {searching && <div style={{ fontSize: 13, color: "var(--text-3)" }}>{t.searching}</div>}
                {!searching && q.length >= 2 && hits.length === 0 && <div style={{ fontSize: 13, color: "var(--text-3)" }}>{t.noHits}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {hits.map((h, i) => (
                    <button key={i} onClick={() => addHit(h)} style={{ display: "flex", gap: 10, alignItems: "center", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border)", padding: "8px 2px", cursor: "pointer" }}>
                      <div style={{ width: 34, height: 50, flexShrink: 0, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>{h.coverUrl && <img src={h.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{h.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{[h.author, h.year].filter(Boolean).join(" · ")}</div>
                      </div>
                      <i className="ti ti-plus" style={{ color: "var(--accent)" }} />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setManual(true)} style={{ marginTop: 8, background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", padding: 0 }}>{t.manual}</button>
            </>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <input autoFocus value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder={t.manualTitle} style={inp} />
              <input value={mAuthor} onChange={(e) => setMAuthor(e.target.value)} placeholder={t.manualAuthor} style={inp} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addManual} disabled={!mTitle.trim()} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>{t.save}</button>
                <button onClick={() => setManual(false)} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--text-2)", fontSize: 13.5, cursor: "pointer" }}>←</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Модалка книги */}
      {detail && (
        <Modal onClose={() => setDetailId(null)} wide>
          <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 84, flexShrink: 0, aspectRatio: "2 / 3", background: "var(--surface-2)", borderRadius: 8, overflow: "hidden" }}>{detail.cover_url && <img src={detail.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{detail.title}</div>
              {detail.author && <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{[detail.author, detail.year].filter(Boolean).join(" · ")}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {(["want", "reading", "read"] as const).map((s) => (
                  <button key={s} onClick={() => patch(detail.id, { status: s })} style={{ padding: "6px 11px", borderRadius: 8, border: "1px solid var(--border)", background: detail.status === s ? STATUS_COLOR[s] : "var(--surface)", color: detail.status === s ? "#fff" : "var(--text-2)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>{t.status[s]}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Оценка + зашла/не зашла + любимое */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
            <div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 3 }}>{t.rating}</div><Stars value={detail.rating} onSet={(n) => patch(detail.id, { rating: n })} /></div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => patch(detail.id, { liked: detail.liked === true ? null : true })} style={chip(detail.liked === true, "#10b981")}><i className="ti ti-thumb-up" /> {t.liked}</button>
              <button onClick={() => patch(detail.id, { liked: detail.liked === false ? null : false })} style={chip(detail.liked === false, "#ef4444")}><i className="ti ti-thumb-down" /> {t.notLiked}</button>
            </div>
            <button onClick={() => patch(detail.id, { favorite: !detail.favorite })} style={chip(detail.favorite, "#ec4899")}><i className={`ti ${detail.favorite ? "ti-heart-filled" : "ti-heart"}`} /> {t.fav}</button>
          </div>

          <Field label={t.review} value={detail.review} ph={t.reviewPh} onSave={(v) => patch(detail.id, { review: v })} rows={2} />
          <Field label={t.notes} value={detail.notes} ph={t.notesPh} onSave={(v) => patch(detail.id, { notes: v })} rows={4} />

          {/* Цитаты */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 7 }}><i className="ti ti-quote" /> {t.quotes}</div>
            {detailQuotes.map((qt) => (
              <div key={qt.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, padding: "7px 10px", background: "var(--surface-2)", borderRadius: 8, borderLeft: "3px solid var(--accent)", marginBottom: 6 }}>
                <span style={{ flex: 1 }}>«{qt.text}»</span>
                <button onClick={() => delQuote(qt.id)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 13 }}><i className="ti ti-x" /></button>
              </div>
            ))}
            <QuoteAdd ph={t.quotePh} add={t.quoteAdd} onAdd={(text) => addQuote(detail.id, text)} />
          </div>

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <button onClick={() => del(detail.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 12.5, cursor: "pointer" }}><i className="ti ti-trash" /> {t.del}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ n, label, icon }: { n: any; label: string; icon?: string }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{icon && n !== "—" ? <i className={`ti ${icon}`} style={{ fontSize: 17, color: "#f59e0b" }} /> : null} {n}</div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

function Field({ label, value, ph, onSave, rows }: { label: string; value: string | null; ph: string; onSave: (v: string) => void; rows: number }) {
  const [v, setV] = useState(value || "");
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <textarea value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value || "") && onSave(v)} placeholder={ph} rows={rows} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}

function QuoteAdd({ ph, add, onAdd }: { ph: string; add: string; onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v); setV(""); } }} placeholder={ph} style={{ ...inp, padding: "8px 10px", fontSize: 13 }} />
      <button onClick={() => { if (v.trim()) { onAdd(v); setV(""); } }} style={{ border: "none", background: "var(--accent)", color: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12.5, whiteSpace: "nowrap" }}>{add}</button>
    </div>
  );
}

function Modal({ children, onClose, wide }: { children: any; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "5vh 12px" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ background: "var(--bg)", width: wide ? "min(560px, 100%)" : "min(440px, 100%)", borderRadius: 16, boxShadow: "0 12px 50px rgba(0,0,0,0.28)", padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 14, color: "var(--text)" };
function chip(active: boolean, color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: `1px solid ${active ? color : "var(--border)"}`, background: active ? color : "var(--surface)", color: active ? "#fff" : "var(--text-2)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" };
}
