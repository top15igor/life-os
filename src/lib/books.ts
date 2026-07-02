import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { getHandle } from "./handle";

// kind: тип единицы медиатеки — 'book' | 'film' | 'series'. По умолчанию 'book'.
export type MediaKind = "book" | "film" | "series";

export type Book = {
  id: string;
  kind: MediaKind;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
  year: number | null;
  pages: number | null;
  status: string;
  rating: number | null;
  liked: boolean | null;
  review: string | null;
  notes: string | null;
  current_page: number | null;
  started_at: string | null;
  finished_at: string | null;
  favorite: boolean;
  created_at: string;
};

// kind добавлен последним — если колонки ещё нет (до миграции), getBooks мягко деградирует.
const COLS = "id, kind, title, author, cover_url, description, genre, year, pages, status, rating, liked, review, notes, current_page, started_at, finished_at, favorite, created_at";
const COLS_LEGACY = "id, title, author, cover_url, description, genre, year, pages, status, rating, liked, review, notes, current_page, started_at, finished_at, favorite, created_at";

// ---------- Поиск книг (Open Library, без ключа) ----------

export type BookHit = { title: string; author: string | null; year: number | null; coverUrl: string | null; olKey: string | null; isbn: string | null; genre: string | null };

export async function searchBooks(query: string): Promise<BookHit[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,isbn,subject`;
    const data = await fetch(url, { headers: { "user-agent": "LIFE-OS/1.0" } }).then((r) => r.json());
    const docs = (data?.docs || []) as any[];
    return docs.slice(0, 10).map((d) => ({
      title: String(d.title || "").slice(0, 250),
      author: d.author_name?.[0] || null,
      year: d.first_publish_year || null,
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      olKey: d.key || null,
      isbn: d.isbn?.[0] || null,
      genre: d.subject?.[0] ? String(d.subject[0]).slice(0, 60) : null,
    }));
  } catch {
    return [];
  }
}

// ---------- Поиск фильмов/сериалов (TMDb, нужен TMDB_API_KEY) ----------

export type MediaHit = BookHit & { description: string | null; kind: MediaKind };

const TMDB_LANG: Record<string, string> = { ru: "ru-RU", en: "en-US", uk: "uk-UA", fr: "fr-FR" };

// Ищет фильм (kind=film) или сериал (kind=series) в TMDb: постер, описание, год.
// Без ключа возвращает [] — тогда UI предложит добавить вручную по названию.
export async function searchMedia(query: string, kind: MediaKind, locale = "ru"): Promise<MediaHit[]> {
  const q = query.trim();
  const key = process.env.TMDB_API_KEY;
  if (!q || !key || kind === "book") return [];
  const type = kind === "series" ? "tv" : "movie";
  const lang = TMDB_LANG[locale] || "ru-RU";
  try {
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(q)}&language=${lang}&include_adult=false&page=1`;
    const data = await fetch(url).then((r) => r.json());
    const results = (data?.results || []) as any[];
    return results.slice(0, 8).map((m) => {
      const date = String(m.release_date || m.first_air_date || "");
      const y = date.slice(0, 4);
      return {
        title: String(m.title || m.name || "").slice(0, 250),
        author: null,
        year: /^\d{4}$/.test(y) ? Number(y) : null,
        coverUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        olKey: null,
        isbn: null,
        genre: null,
        description: m.overview ? String(m.overview).slice(0, 1200) : null,
        kind,
      };
    });
  } catch {
    return [];
  }
}

async function fetchDescription(olKey: string | null): Promise<string | null> {
  if (!olKey) return null;
  try {
    const d = await fetch(`https://openlibrary.org${olKey}.json`, { headers: { "user-agent": "LIFE-OS/1.0" } }).then((r) => r.json());
    const desc = d?.description;
    const text = typeof desc === "string" ? desc : desc?.value || null;
    return text ? String(text).slice(0, 1200) : null;
  } catch {
    return null;
  }
}

// ---------- CRUD ----------

export async function getBooks(userId: string): Promise<Book[]> {
  const db = supabaseAdmin();
  // Пробуем с kind; если колонки ещё нет (до миграции) — падаем на legacy и проставляем kind='book'.
  const { data, error } = await db.from("books").select(COLS).eq("user_id", userId).order("updated_at", { ascending: false });
  if (!error) return ((data as any[]) || []).map((b) => ({ ...b, kind: b.kind || "book" }));
  const { data: legacy } = await db.from("books").select(COLS_LEGACY).eq("user_id", userId).order("updated_at", { ascending: false });
  return ((legacy as any[]) || []).map((b) => ({ ...b, kind: "book" }));
}

export async function addBook(
  userId: string,
  hit: Partial<BookHit> & { title: string; status?: string; kind?: MediaKind; description?: string | null }
): Promise<Book | null> {
  const title = String(hit.title || "").trim().slice(0, 250);
  if (!title) return null;
  const kind: MediaKind = hit.kind || "book";
  // Описание книги тянем из Open Library; для фильмов/сериалов берём переданное (из TMDb).
  const description = kind === "book" ? await fetchDescription(hit.olKey || null) : (hit.description ?? null);
  const row: any = {
    user_id: userId,
    kind,
    title,
    author: hit.author || null,
    cover_url: hit.coverUrl || null,
    year: hit.year || null,
    isbn: hit.isbn || null,
    ol_key: hit.olKey || null,
    genre: hit.genre || null,
    description,
    status: hit.status || "want",
  };
  const db = supabaseAdmin();
  let { data, error } = await db.from("books").insert(row).select(COLS).single();
  if (error) {
    // Колонки kind ещё нет — сохраняем как обычную книгу (legacy), без kind.
    delete row.kind;
    const r2 = await db.from("books").insert(row).select(COLS_LEGACY).single();
    data = r2.data as any;
  }
  return data ? ({ ...(data as any), kind: (data as any).kind || kind }) : null;
}

// Добавить по названию (для AI-рекомендаций): ищем обложку/автора в Open Library.
// Берём не просто первый результат, а тот, чьё название лучше совпадает с искомым
// (иначе для «Homo Deus» вперёд может вылезти издание на иврите).
export async function addBookByTitle(userId: string, title: string, author?: string | null): Promise<Book | null> {
  const hits = await searchBooks([title, author].filter(Boolean).join(" "));
  const words = title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let best = hits[0];
  let bestScore = -1;
  for (const h of hits) {
    const ht = (h.title || "").toLowerCase();
    const score = words.filter((w) => ht.includes(w)).length + (h.coverUrl ? 0.5 : 0);
    if (score > bestScore) { bestScore = score; best = h; }
  }
  const hit = best || { title, author: author || null };
  return addBook(userId, { ...hit, title: hit.title || title, status: "want" });
}

// Добавить фильм/сериал по названию. Пытаемся обогатить постером/описанием из TMDb
// (берём наиболее похожее по названию); если ключа/совпадений нет — сохраняем как есть.
export async function addMediaByTitle(userId: string, title: string, kind: MediaKind, status = "want", locale = "ru"): Promise<Book | null> {
  const clean = String(title || "").trim().slice(0, 250);
  if (!clean) return null;
  if (kind === "book") return addBookByTitle(userId, clean);
  const hits = await searchMedia(clean, kind, locale);
  const words = clean.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let best = hits[0];
  let bestScore = -1;
  for (const h of hits) {
    const ht = (h.title || "").toLowerCase();
    const score = words.filter((w) => ht.includes(w)).length + (h.coverUrl ? 0.5 : 0);
    if (score > bestScore) { bestScore = score; best = h; }
  }
  if (best) return addBook(userId, { title: best.title || clean, coverUrl: best.coverUrl, year: best.year, description: best.description, kind, status });
  return addBook(userId, { title: clean, kind, status });
}

export async function updateBook(userId: string, id: string, fields: any): Promise<boolean> {
  const patch: any = { updated_at: new Date().toISOString() };
  const today = new Date().toISOString().slice(0, 10);
  if (fields.status !== undefined) {
    patch.status = fields.status;
    if (fields.status === "reading") patch.started_at = today;
    if (fields.status === "read") patch.finished_at = today;
  }
  if (fields.rating !== undefined) patch.rating = fields.rating === null ? null : Math.max(1, Math.min(5, Math.round(Number(fields.rating))));
  if (fields.liked !== undefined) patch.liked = fields.liked;
  if (fields.review !== undefined) patch.review = String(fields.review).slice(0, 2000);
  if (fields.notes !== undefined) patch.notes = String(fields.notes).slice(0, 6000);
  if (fields.current_page !== undefined) patch.current_page = fields.current_page === null ? null : Math.max(0, Math.round(Number(fields.current_page)));
  if (fields.pages !== undefined) patch.pages = fields.pages === null ? null : Math.max(0, Math.round(Number(fields.pages)));
  if (fields.favorite !== undefined) patch.favorite = !!fields.favorite;
  const { error } = await supabaseAdmin().from("books").update(patch).eq("id", id).eq("user_id", userId);
  return !error;
}

export async function deleteBook(userId: string, id: string): Promise<boolean> {
  const db = supabaseAdmin();
  await db.from("book_quotes").delete().eq("book_id", id).eq("user_id", userId);
  const { error } = await db.from("books").delete().eq("id", id).eq("user_id", userId);
  return !error;
}

// ---------- Цитаты ----------

export type Quote = { id: string; book_id: string; text: string; page: number | null; created_at: string };

export async function getQuotes(userId: string): Promise<Quote[]> {
  try {
    const { data } = await supabaseAdmin().from("book_quotes").select("id, book_id, text, page, created_at").eq("user_id", userId).order("created_at", { ascending: false });
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function addQuote(userId: string, bookId: string, text: string, page?: number | null): Promise<Quote | null> {
  const t = String(text || "").trim().slice(0, 1500);
  if (!t || !bookId) return null;
  const { data } = await supabaseAdmin().from("book_quotes").insert({ user_id: userId, book_id: bookId, text: t, page: page ?? null }).select("id, book_id, text, page, created_at").single();
  return (data as any) || null;
}

export async function deleteQuote(userId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("book_quotes").delete().eq("id", id).eq("user_id", userId);
  return !error;
}

// ---------- Цель года и статистика ----------

export type BookStats = { total: number; reading: number; readThisYear: number; goal: number; avgRating: number | null; pages: number; topGenres: string[] };

export function computeStats(books: Book[], goal: number, year: number): BookStats {
  const read = books.filter((b) => b.status === "read");
  const readThisYear = read.filter((b) => b.finished_at && b.finished_at.slice(0, 4) === String(year)).length;
  const rated = read.filter((b) => b.rating);
  const avg = rated.length ? Math.round((rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length) * 10) / 10 : null;
  const pages = read.reduce((s, b) => s + (b.pages || 0), 0);
  const genreCount: Record<string, number> = {};
  for (const b of read) if (b.genre) genreCount[b.genre] = (genreCount[b.genre] || 0) + 1;
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  return { total: books.length, reading: books.filter((b) => b.status === "reading").length, readThisYear, goal, avgRating: avg, pages, topGenres };
}

export async function getBookGoal(userId: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("book_goal").eq("user_id", userId).maybeSingle();
    return (data as any)?.book_goal || 0;
  } catch {
    return 0;
  }
}

export async function setBookGoal(userId: string, name: string | null, goal: number): Promise<boolean> {
  await getHandle(userId, name).catch(() => null); // гарантируем строку профиля
  const { error } = await supabaseAdmin().from("public_profile").update({ book_goal: Math.max(0, Math.min(999, Math.round(goal))) }).eq("user_id", userId);
  return !error;
}

// ---------- AI: что почитать дальше ----------

export type Recommendation = { title: string; author: string; why: string };

export async function recommendBooks(userId: string, books: Book[], locale = "ru"): Promise<Recommendation[]> {
  const liked = books.filter((b) => b.liked === true || (b.rating || 0) >= 4).map((b) => `${b.title}${b.author ? " — " + b.author : ""}`);
  const basis = liked.length ? liked : books.filter((b) => b.status === "read").map((b) => `${b.title}${b.author ? " — " + b.author : ""}`);
  if (!basis.length) return [];
  const have = new Set(books.map((b) => b.title.toLowerCase().trim()));
  const lang = locale === "en" || locale === "fr" ? "English" : "Russian";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const TOOL = {
    name: "recommend",
    description: "Return book recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        books: {
          type: "array",
          items: { type: "object", properties: { title: { type: "string" }, author: { type: "string" }, why: { type: "string" } }, required: ["title", "author", "why"] },
        },
      },
      required: ["books"],
    },
  };
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      tools: [TOOL as any],
      tool_choice: { type: "tool", name: "recommend" },
      messages: [{
        role: "user",
        content: `These books resonated with the reader:\n${basis.slice(0, 25).join("\n")}\n\nRecommend 6 other books they're likely to enjoy. Avoid any already listed. For each: title, author, and a one-sentence "why" written in ${lang}. Mix well-known and lesser-known picks.`,
      }],
    });
    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") return [];
    const recs = ((block.input as any).books || []) as Recommendation[];
    return recs.filter((r) => r.title && !have.has(r.title.toLowerCase().trim())).slice(0, 6);
  } catch {
    return [];
  }
}

// ---------- Публичная библиотека ----------

export async function getBooksShare(userId: string): Promise<{ slug: string | null; isPublic: boolean }> {
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("slug, books_public").eq("user_id", userId).maybeSingle();
    return { slug: (data as any)?.slug || null, isPublic: !!(data as any)?.books_public };
  } catch {
    return { slug: null, isPublic: false };
  }
}

export async function setBooksPublic(userId: string, name: string | null, makePublic: boolean): Promise<{ slug: string | null; isPublic: boolean }> {
  const slug = await getHandle(userId, name).catch(() => null);
  try {
    await supabaseAdmin().from("public_profile").update({ books_public: makePublic }).eq("user_id", userId);
  } catch {}
  return { slug, isPublic: makePublic };
}

// ---------- Добавление по фото (обложка или штрих-код) ----------

export async function bookFromImage(base64: string, mediaType: string): Promise<{ title: string; author: string | null; isbn: string | null } | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const TOOL = {
    name: "book",
    description: "Identify the book shown in the photo.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Book title, empty if no book is visible" },
        author: { type: "string" },
        isbn: { type: "string", description: "ISBN-13 digits if a barcode or ISBN number is visible, else empty" },
      },
      required: ["title"],
    },
  };
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      tools: [TOOL as any],
      tool_choice: { type: "tool", name: "book" },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as any, data: base64 } },
          { type: "text", text: "This photo shows a book — its cover or its back-cover barcode. Identify the book: title, author, and the ISBN-13 digits if a barcode/number is visible (otherwise leave isbn empty). If no book can be identified, return an empty title." },
        ],
      }],
    });
    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") return null;
    const out = block.input as any;
    if (!out.title || !String(out.title).trim()) return null;
    return { title: String(out.title).trim(), author: out.author ? String(out.author).trim() : null, isbn: out.isbn ? String(out.isbn).replace(/[^0-9Xx]/g, "") : null };
  } catch {
    return null;
  }
}

export async function addBookFromImage(userId: string, base64: string, mediaType: string): Promise<Book | null> {
  const id = await bookFromImage(base64, mediaType);
  if (!id) return null;
  if (id.isbn && id.isbn.length >= 10) {
    const hits = await searchBooks(id.isbn);
    if (hits[0]) return addBook(userId, { ...hits[0], status: "want" });
  }
  return addBookByTitle(userId, id.title, id.author);
}

// ---------- Импорт из Goodreads / StoryGraph (CSV) ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function parseDate(s: string): string | null {
  const m = s.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null;
}

export async function importBooksCsv(userId: string, csv: string): Promise<number> {
  const rows = parseCsv(csv);
  if (rows.length < 2) return 0;
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const isGR = idx("Exclusive Shelf") >= 0;

  const records: any[] = [];
  for (let r = 1; r < rows.length && records.length < 600; r++) {
    const cells = rows[r];
    const get = (name: string) => { const i = idx(name); return i >= 0 ? (cells[i] || "").trim() : ""; };
    const title = get("Title");
    if (!title) continue;

    let author = "", status = "want", rating: number | null = null, review = "", isbn = "", finished: string | null = null, pages: number | null = null;
    if (isGR) {
      author = get("Author");
      const shelf = get("Exclusive Shelf");
      status = shelf === "read" ? "read" : shelf === "currently-reading" ? "reading" : "want";
      const rt = parseInt(get("My Rating")); rating = rt > 0 ? rt : null;
      review = get("My Review").replace(/<br\s*\/?>/gi, "\n");
      isbn = (get("ISBN13") || get("ISBN")).replace(/[^0-9Xx]/g, "");
      finished = parseDate(get("Date Read"));
      pages = parseInt(get("Number of Pages")) || null;
    } else {
      author = get("Authors") || get("Author");
      const rs = get("Read Status").toLowerCase();
      status = rs === "read" ? "read" : rs === "currently-reading" ? "reading" : "want";
      const rt = parseFloat(get("Star Rating")); rating = rt > 0 ? Math.round(rt) : null;
      review = get("Review");
      isbn = (get("ISBN/UID") || get("ISBN")).replace(/[^0-9Xx]/g, "");
      finished = parseDate(get("Last Date Read") || get("Dates Read"));
    }

    records.push({
      user_id: userId,
      title: title.slice(0, 250),
      author: author || null,
      isbn: isbn || null,
      cover_url: isbn && isbn.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null,
      status,
      rating,
      review: review ? review.slice(0, 2000) : null,
      finished_at: status === "read" ? finished : null,
      pages,
    });
  }
  if (!records.length) return 0;

  const db = supabaseAdmin();
  let count = 0;
  for (let i = 0; i < records.length; i += 100) {
    const { data, error } = await db.from("books").insert(records.slice(i, i + 100)).select("id");
    if (!error) count += (data?.length || 0);
  }
  return count;
}

export type PublicBook = { id: string; title: string; author: string | null; cover_url: string | null; status: string; rating: number | null; liked: boolean | null; review: string | null; favorite: boolean; year: number | null };

export async function getPublicLibrary(slug: string): Promise<{ ownerName: string | null; books: PublicBook[] } | null> {
  const db = supabaseAdmin();
  const { data: prof } = await db.from("public_profile").select("user_id, books_public").eq("slug", slug).maybeSingle();
  if (!prof || !(prof as any).books_public) return null;
  const userId = (prof as any).user_id as string;
  const { data: u } = await db.from("users").select("name").eq("id", userId).maybeSingle();
  const { data } = await db
    .from("books")
    .select("id, title, author, cover_url, status, rating, liked, review, favorite, year")
    .eq("user_id", userId)
    .neq("status", "want")
    .order("favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  return { ownerName: (u as any)?.name || null, books: ((data as any) || []) as PublicBook[] };
}
