import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabaseAdmin";
import { getHandle } from "./handle";

export type Book = {
  id: string;
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

const COLS = "id, title, author, cover_url, description, genre, year, pages, status, rating, liked, review, notes, current_page, started_at, finished_at, favorite, created_at";

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
  try {
    const { data } = await supabaseAdmin()
      .from("books")
      .select(COLS)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function addBook(userId: string, hit: Partial<BookHit> & { title: string; status?: string }): Promise<Book | null> {
  const title = String(hit.title || "").trim().slice(0, 250);
  if (!title) return null;
  const description = await fetchDescription(hit.olKey || null);
  const { data } = await supabaseAdmin()
    .from("books")
    .insert({
      user_id: userId,
      title,
      author: hit.author || null,
      cover_url: hit.coverUrl || null,
      year: hit.year || null,
      isbn: hit.isbn || null,
      ol_key: hit.olKey || null,
      genre: hit.genre || null,
      description,
      status: hit.status || "want",
    })
    .select(COLS)
    .single();
  return (data as any) || null;
}

// Добавить по названию (для AI-рекомендаций): ищем обложку/автора в Open Library.
export async function addBookByTitle(userId: string, title: string, author?: string | null): Promise<Book | null> {
  const hits = await searchBooks([title, author].filter(Boolean).join(" "));
  const hit = hits[0] || { title, author: author || null };
  return addBook(userId, { ...hit, title: hit.title || title, status: "want" });
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
