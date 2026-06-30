import { supabaseAdmin } from "./supabaseAdmin";
import { getHandle } from "./handle";

export type Wish = {
  id: string;
  url: string | null;
  source: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  price: string | null;
  currency: string | null;
  note: string | null;
  priority: number;
  status: string;
  created_at: string;
};

// Поля, которые видит ВЛАДЕЛЕЦ (без секрета брони — иначе пропадёт сюрприз).
const OWNER_COLS = "id, url, source, title, description, image_url, price, currency, note, priority, status, created_at";

// ---------- Распознавание ссылок ----------

const URL_RE = /https?:\/\/[^\s<>"']+/i;

// Известные магазины: «голую» ссылку из них бот сам кладёт в вишлист.
const SHOP_DOMAINS = [
  // Глобальные
  "amazon.", "ebay.", "aliexpress.", "etsy.com", "asos.", "apple.com", "ikea.com",
  "nike.com", "adidas.", "zara.com", "hm.com", "farfetch.", "ssense.com", "net-a-porter.",
  // Европа
  "zalando.", "otto.de", "bol.com", "cdiscount.com", "fnac.com", "mediamarkt.",
  "aboutyou.", "vinted.", "allegro.pl", "leroymerlin.", "decathlon.", "boozt.com", "veepee.",
  // Украина
  "rozetka.com", "prom.ua", "shafa.ua", "allo.ua", "comfy.ua", "kasta.ua", "epicentrk.ua",
  "foxtrot.ua", "eldorado.ua", "makeup.com.ua", "intertop.", "moyo.ua", "27.ua", "stylus.ua",
  // Waily
  "waily.",
];

const clean = (u: string) => u.replace(/[)\].,;!?]+$/, "");

export function extractAnyUrl(text?: string | null): string | null {
  const m = text?.match(URL_RE);
  return m ? clean(m[0]) : null;
}

export function extractShopUrl(text?: string | null): string | null {
  const u = extractAnyUrl(text);
  if (!u) return null;
  const low = u.toLowerCase();
  return SHOP_DOMAINS.some((d) => low.includes(d)) ? u : null;
}

// ---------- Парсинг карточки товара (Open Graph / meta / JSON-LD) ----------

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (h, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return h; } })
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return _; } })
    .replace(/&amp;/g, "&");
}

function ogTag(html: string, prop: string): string | null {
  const a = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, "i"));
  if (a) return decodeHtml(a[1]);
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${prop}["']`, "i"));
  return b ? decodeHtml(b[1]) : null;
}

function metaProp(html: string, prop: string): string | null {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"));
  if (a) return decodeHtml(a[1]);
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name|itemprop)=["']${prop}["']`, "i"));
  return b ? decodeHtml(b[1]) : null;
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeHtml(m[1]).trim() : null;
}

function priceFrom(html: string): { price: string | null; currency: string | null } {
  // 1) og:price / product:price meta
  let price =
    metaProp(html, "product:price:amount") ||
    metaProp(html, "og:price:amount") ||
    metaProp(html, "price") ||
    null;
  let currency =
    metaProp(html, "product:price:currency") ||
    metaProp(html, "og:price:currency") ||
    metaProp(html, "priceCurrency") ||
    null;
  // 2) JSON-LD "price" / "priceCurrency"
  if (!price) {
    const m = html.match(/"price"\s*:\s*"?([\d.,\s]+)"?/i);
    if (m) price = m[1].trim();
  }
  if (!currency) {
    const m = html.match(/"priceCurrency"\s*:\s*"([A-Z]{3})"/i);
    if (m) currency = m[1];
  }
  if (price) price = price.replace(/\s+/g, " ").trim().slice(0, 40);
  return { price: price || null, currency: currency || null };
}

const CUR_SYM: Record<string, string> = { USD: "$", EUR: "€", UAH: "₴", RUB: "₽", GBP: "£", PLN: "zł", KZT: "₸", GEL: "₾", TRY: "₺", AED: "AED" };

// Красивая строка цены: «1299 ₽» из числа+валюты, либо как есть.
export function formatPrice(price: string | null, currency: string | null): string | null {
  if (!price) return null;
  if (/[₽$€₴£]/.test(price)) return price; // символ уже внутри
  const sym = currency ? CUR_SYM[currency] || currency : "";
  return sym ? `${price} ${sym}` : price;
}

export type ProductMeta = { title: string | null; description: string | null; imageUrl: string | null; price: string | null; currency: string | null; source: string | null };

export async function fetchProductMeta(url: string): Promise<ProductMeta> {
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "accept-language": "ru,en;q=0.9",
      },
      redirect: "follow",
    });
    html = await res.text();
  } catch {
    /* недоступно — вернём пустые поля, пользователь допишет руками */
  }
  let source: string | null = null;
  try { source = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  const { price, currency } = priceFrom(html);
  return {
    title: ogTag(html, "title") || titleTag(html),
    description: ogTag(html, "description") || metaProp(html, "description"),
    imageUrl: ogTag(html, "image") || ogTag(html, "image:url") || metaProp(html, "twitter:image"),
    price,
    currency,
    source,
  };
}

// ---------- CRUD (владелец) ----------

export async function getWishes(userId: string): Promise<Wish[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("wishes")
      .select(OWNER_COLS)
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function addWishFromUrl(userId: string, url: string): Promise<Wish | null> {
  const meta = await fetchProductMeta(url);
  const title = (meta.title || meta.source || "Без названия").slice(0, 200);
  const { data } = await supabaseAdmin()
    .from("wishes")
    .insert({
      user_id: userId,
      url,
      source: meta.source,
      title,
      description: meta.description ? meta.description.slice(0, 600) : null,
      image_url: meta.imageUrl,
      price: meta.price,
      currency: meta.currency,
    })
    .select(OWNER_COLS)
    .single();
  return (data as any) || null;
}

export async function addWishManual(userId: string, fields: { title: string; url?: string; price?: string; note?: string; image_url?: string }): Promise<Wish | null> {
  const title = String(fields.title || "").trim().slice(0, 200);
  if (!title) return null;
  let source: string | null = null;
  if (fields.url) { try { source = new URL(fields.url).hostname.replace(/^www\./, ""); } catch {} }
  const { data } = await supabaseAdmin()
    .from("wishes")
    .insert({
      user_id: userId,
      title,
      url: fields.url || null,
      source,
      price: fields.price?.slice(0, 40) || null,
      note: fields.note?.slice(0, 400) || null,
      image_url: fields.image_url || null,
    })
    .select(OWNER_COLS)
    .single();
  return (data as any) || null;
}

export async function updateWish(userId: string, id: string, fields: Partial<{ title: string; note: string; price: string; status: string; priority: number }>): Promise<boolean> {
  const patch: any = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) patch.title = String(fields.title).slice(0, 200);
  if (fields.note !== undefined) patch.note = String(fields.note).slice(0, 400);
  if (fields.price !== undefined) patch.price = String(fields.price).slice(0, 40);
  if (fields.status !== undefined) patch.status = fields.status;
  if (fields.priority !== undefined) patch.priority = Math.round(Number(fields.priority) || 0);
  const { error } = await supabaseAdmin().from("wishes").update(patch).eq("id", id).eq("user_id", userId);
  return !error;
}

export async function deleteWish(userId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("wishes").delete().eq("id", id).eq("user_id", userId);
  return !error;
}

// ---------- Публикация вишлиста ----------

export async function getWishShare(userId: string): Promise<{ slug: string | null; isPublic: boolean }> {
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("slug, wish_public").eq("user_id", userId).maybeSingle();
    return { slug: (data as any)?.slug || null, isPublic: !!(data as any)?.wish_public };
  } catch {
    return { slug: null, isPublic: false };
  }
}

export async function setWishPublic(userId: string, name: string | null, makePublic: boolean): Promise<{ slug: string | null; isPublic: boolean }> {
  // Гарантируем, что у профиля есть slug (@username), затем ставим флаг.
  const slug = await getHandle(userId, name).catch(() => null);
  try {
    await supabaseAdmin().from("public_profile").update({ wish_public: makePublic }).eq("user_id", userId);
  } catch {}
  return { slug, isPublic: makePublic };
}

// ---------- Публичный просмотр (гость) ----------

export type PublicWish = Omit<Wish, "status"> & { reserved: boolean };

export async function getPublicWishlist(slug: string): Promise<{ ownerName: string | null; wishes: PublicWish[] } | null> {
  const db = supabaseAdmin();
  const { data: prof } = await db.from("public_profile").select("user_id, wish_public").eq("slug", slug).maybeSingle();
  if (!prof || !(prof as any).wish_public) return null;
  const userId = (prof as any).user_id as string;
  const { data: u } = await db.from("users").select("name").eq("id", userId).maybeSingle();
  const { data } = await db
    .from("wishes")
    .select("id, url, source, title, description, image_url, price, currency, note, priority, created_at, reserved_token")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  const wishes: PublicWish[] = ((data as any[]) || []).map((w) => ({
    id: w.id, url: w.url, source: w.source, title: w.title, description: w.description,
    image_url: w.image_url, price: w.price, currency: w.currency, note: w.note,
    priority: w.priority, created_at: w.created_at, reserved: !!w.reserved_token,
  }));
  return { ownerName: (u as any)?.name || null, wishes };
}

// Бронь подарка: гость отмечает «дарю это». Владелец брони не видит (см. OWNER_COLS).
export async function reserveWish(wishId: string, token: string, name: string | null): Promise<{ ok: boolean; error?: string }> {
  const db = supabaseAdmin();
  // Бронировать можно только товар из ПУБЛИЧНОГО вишлиста и только если он ещё свободен.
  const { data: w } = await db.from("wishes").select("id, user_id, reserved_token").eq("id", wishId).maybeSingle();
  if (!w) return { ok: false, error: "not_found" };
  const { data: prof } = await db.from("public_profile").select("wish_public").eq("user_id", (w as any).user_id).maybeSingle();
  if (!prof || !(prof as any).wish_public) return { ok: false, error: "not_public" };
  if ((w as any).reserved_token && (w as any).reserved_token !== token) return { ok: false, error: "taken" };
  const { error } = await db
    .from("wishes")
    .update({ reserved_token: token, reserved_name: name?.slice(0, 60) || null, reserved_at: new Date().toISOString() })
    .eq("id", wishId);
  return { ok: !error };
}

export async function unreserveWish(wishId: string, token: string): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin()
    .from("wishes")
    .update({ reserved_token: null, reserved_name: null, reserved_at: null })
    .eq("id", wishId)
    .eq("reserved_token", token);
  return { ok: !error };
}
