import { supabaseAdmin } from "./supabaseAdmin";

// ===== Единый @username (имя-ссылка) пользователя =====
// Хранится в public_profile.slug и работает сразу для двух вещей:
//   - реф-ссылка   mylifebookai.vercel.app/i/<username>
//   - публичная стр. mylifebookai.vercel.app/p/<username> (если включена)
// Генерится автоматически из имени (транслитерация), уникален, редактируемый.
// Старый случайный ref_code и legacy ?ref=<UUID> продолжают работать (см. users.ts).

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "yi", є: "ye", ґ: "g", " ": "-",
};

// «Игорь» -> «igor». Только латиница/цифры/дефис, нижний регистр, до 30 символов.
export function slugifyName(name: string): string {
  return (name || "")
    .toLowerCase()
    .split("")
    .map((c) => (c in TRANSLIT ? TRANSLIT[c] : c))
    .join("")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export const HANDLE_RE = /^[a-z0-9-]{3,30}$/;

// Слова-роуты и системные имена, которые нельзя занимать как @username.
const RESERVED = new Set([
  "api", "admin", "i", "p", "u", "path", "profile", "share", "guide", "welcome", "about", "privacy",
  "login", "logout", "lock", "pricing", "settings", "public", "static", "assets", "favicon",
  "diary", "today", "goals", "money", "finance", "health", "family", "people", "places",
  "book", "lifebook", "knowledge", "memory", "paths", "biographer", "intelligence", "lab",
  "null", "undefined", "user", "users", "me", "root", "support", "help", "lifeos", "life-os",
]);

export function normalizeHandle(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

// Корректен ли хендл по форме и не зарезервирован ли.
export function isValidHandle(raw: string): boolean {
  const h = normalizeHandle(raw);
  return HANDLE_RE.test(h) && !RESERVED.has(h);
}

// Занят ли хендл кем-то другим (не самим пользователем).
async function takenByOther(handle: string, selfId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("user_id").eq("slug", handle).maybeSingle();
    return !!data && data.user_id !== selfId;
  } catch {
    return false;
  }
}

// Доступен ли хендл этому пользователю (форма ок, не зарезервирован, не занят другим).
export async function isHandleAvailable(handle: string, selfId: string): Promise<boolean> {
  if (!isValidHandle(handle)) return false;
  return !(await takenByOther(normalizeHandle(handle), selfId));
}

// userId по хендлу (для /i/<username> и /p/<username>). Без учёта enabled.
export async function resolveHandle(raw?: string | null): Promise<string | null> {
  const h = normalizeHandle(raw || "");
  if (!HANDLE_RE.test(h)) return null;
  try {
    const { data } = await supabaseAdmin().from("public_profile").select("user_id").eq("slug", h).maybeSingle();
    return data?.user_id || null;
  } catch {
    return null;
  }
}

// Текущий @username пользователя; если нет — генерит из имени и сохраняет.
// Не меняет enabled/bio/blocks: только заводит/проставляет slug.
export async function getHandle(userId: string, name?: string | null): Promise<string> {
  const db = supabaseAdmin();
  try {
    const { data: existing } = await db.from("public_profile").select("slug, enabled").eq("user_id", userId).maybeSingle();
    if (existing?.slug) return existing.slug;

    let nm = name;
    if (nm == null) {
      const { data: u } = await db.from("users").select("name").eq("id", userId).maybeSingle();
      nm = u?.name || null;
    }

    let base = slugifyName(nm || "");
    if (base.length < 3) base = (base + "user").slice(0, 30);

    // Подбираем свободный вариант: igor -> igor2 -> igor3 ...
    let cand = RESERVED.has(base) ? `${base}1` : base;
    for (let i = 2; i <= 60; i++) {
      if (!RESERVED.has(cand) && !(await takenByOther(cand, userId))) break;
      cand = `${base}${i}`.slice(0, 30);
    }
    // Крайний случай: всё занято — добавляем кусок id.
    if (RESERVED.has(cand) || (await takenByOther(cand, userId))) {
      cand = `${base}${userId.replace(/[^a-z0-9]/g, "").slice(0, 4)}`.slice(0, 30);
    }

    if (existing) {
      await db.from("public_profile").update({ slug: cand }).eq("user_id", userId);
    } else {
      await db.from("public_profile").insert({ user_id: userId, slug: cand, enabled: false });
    }
    return cand;
  } catch {
    // Таблицы нет/ошибка — отдаём что-то стабильное (старый формат продолжит работать).
    return slugifyName(name || "") || userId;
  }
}

// Меняет @username. Возвращает { ok } или { ok:false, error }.
export async function setHandle(userId: string, raw: string): Promise<{ ok: boolean; error?: string; handle?: string }> {
  const h = normalizeHandle(raw);
  if (!HANDLE_RE.test(h)) return { ok: false, error: "invalid" };
  if (RESERVED.has(h)) return { ok: false, error: "reserved" };
  if (await takenByOther(h, userId)) return { ok: false, error: "taken" };
  const db = supabaseAdmin();
  try {
    const { data: existing } = await db.from("public_profile").select("user_id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await db.from("public_profile").update({ slug: h }).eq("user_id", userId);
    } else {
      await db.from("public_profile").insert({ user_id: userId, slug: h, enabled: false });
    }
    return { ok: true, handle: h };
  } catch {
    return { ok: false, error: "server" };
  }
}
