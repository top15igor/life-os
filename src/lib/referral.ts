import { supabaseAdmin } from "./supabaseAdmin";

// ===== Награда: пригласи друзей -> бесплатная печатная книга =====
// Друг засчитывается, когда зарегистрировался по твоей ссылке И сделал
// не меньше ACTIVE_THRESHOLD записей в дневнике (защита от «пустых» приглашений).
// Каждые FRIENDS_PER_BOOK активных друга дают одну бесплатную печатную книгу
// в тарифе Classic (мягкая обложка). Числа можно менять здесь.
export const ACTIVE_THRESHOLD = 5;
export const FRIENDS_PER_BOOK = 3;
export const REWARD_TIER = "classic";

export type ReferralStatus = {
  invited: number; // всего зарегистрировалось по ссылке
  active: number; // из них активных (>= ACTIVE_THRESHOLD записей)
  threshold: number; // сколько записей нужно другу, чтобы стать активным
  perBook: number; // сколько активных друзей за одну бесплатную книгу
  earned: number; // всего заработано бесплатных книг
  used: number; // уже использовано (заявок на бесплатную книгу)
  available: number; // доступно сейчас (earned - used)
  toNext: number; // сколько ещё активных друзей до следующей бесплатной книги
};

function empty(): ReferralStatus {
  return { invited: 0, active: 0, threshold: ACTIVE_THRESHOLD, perBook: FRIENDS_PER_BOOK, earned: 0, used: 0, available: 0, toNext: FRIENDS_PER_BOOK };
}

// Считает реферальный статус пользователя: приглашённые, активные, награды.
export async function getReferralStatus(userId: string): Promise<ReferralStatus> {
  const db = supabaseAdmin();
  try {
    const { data: friends } = await db.from("users").select("id").eq("referred_by", userId);
    const ids = (friends || []).map((f: any) => f.id);
    const invited = ids.length;

    let active = 0;
    if (ids.length) {
      // Считаем записи по всем друзьям одним запросом; активный = >= порога.
      const { data: rows } = await db.from("entries").select("user_id").in("user_id", ids);
      const cnt: Record<string, number> = {};
      for (const r of rows || []) {
        const uid = (r as any).user_id as string;
        cnt[uid] = (cnt[uid] || 0) + 1;
      }
      active = ids.filter((id) => (cnt[id] || 0) >= ACTIVE_THRESHOLD).length;
    }

    const earned = Math.floor(active / FRIENDS_PER_BOOK);

    // Сколько бесплатных книг уже запрошено. Фолбэк (колонки ещё нет) — 0.
    let used = 0;
    try {
      const { data: me } = await db.from("users").select("free_books_used").eq("id", userId).maybeSingle();
      used = Number((me as any)?.free_books_used || 0);
    } catch {}

    const available = Math.max(0, earned - used);
    const toNext = (earned + 1) * FRIENDS_PER_BOOK - active;
    return { invited, active, threshold: ACTIVE_THRESHOLD, perBook: FRIENDS_PER_BOOK, earned, used, available, toNext };
  } catch {
    return empty();
  }
}

// ===== Дерево приглашений конкретного пользователя =====
// Кого пригласил он, кого пригласили те, и так вглубь — чтобы показать всю
// «сеть» наглядно и честно. Активность каждого = по числу записей и свежести.
export type RefActivity = "active" | "warm" | "started" | "idle";
export type RefNode = {
  id: string;
  name: string;
  joined: string | null; // когда зарегистрировался
  entries: number; // сколько всего записей в дневнике
  lastEntry: string | null; // дата последней записи (YYYY-MM-DD)
  activity: RefActivity;
  children: RefNode[];
};
export type ReferralTree = {
  nodes: RefNode[]; // те, кого пользователь пригласил напрямую (корни ветвей)
  direct: number; // сколько приглашено напрямую
  network: number; // вся сеть (все потомки на всех уровнях)
  active: number; // из них активных (>= порога записей)
  capped: boolean; // true — упёрлись в лимит обхода (сеть больше, показана часть)
};

function todayStr(): string {
  return new Date(Date.now()).toISOString().slice(0, 10);
}

// Строит дерево приглашённых вглубь (BFS по уровням). Лимиты — защита от
// гигантских сетей: глубина и общее число узлов ограничены.
export async function getReferralTree(userId: string, maxDepth = 6, maxNodes = 400): Promise<ReferralTree> {
  const empty: ReferralTree = { nodes: [], direct: 0, network: 0, active: 0, capped: false };
  const db = supabaseAdmin();
  try {
    const all: Record<string, any> = {};
    const childrenOf: Record<string, string[]> = {};
    let frontier = [userId];
    let depth = 0;
    let capped = false;
    while (frontier.length && depth < maxDepth) {
      const { data } = await db
        .from("users")
        .select("id, name, created_at, referred_by")
        .in("referred_by", frontier);
      const rows = data || [];
      const next: string[] = [];
      for (const u of rows) {
        if (all[u.id] || u.id === userId) continue; // защита от циклов/самоссылки
        if (Object.keys(all).length >= maxNodes) { capped = true; break; }
        all[u.id] = u;
        (childrenOf[u.referred_by] ||= []).push(u.id);
        next.push(u.id);
      }
      if (capped) break;
      frontier = next;
      depth++;
    }
    const ids = Object.keys(all);
    if (!ids.length) return empty;

    // Статистика записей одним проходом (чанками по 200 id) — счётчик и последняя дата.
    const cnt: Record<string, number> = {};
    const last: Record<string, string> = {};
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { data: rows } = await db.from("entries").select("user_id, entry_date").in("user_id", chunk);
      for (const r of rows || []) {
        const uid = (r as any).user_id as string;
        cnt[uid] = (cnt[uid] || 0) + 1;
        const d = ((r as any).entry_date || "") as string;
        if (d && (!last[uid] || d > last[uid])) last[uid] = d;
      }
    }

    const today = todayStr();
    const daysSince = (d?: string): number =>
      d ? Math.max(0, Math.floor((Date.parse(today) - Date.parse(d)) / 86400000)) : Infinity;
    const activityOf = (id: string): RefActivity => {
      const c = cnt[id] || 0;
      const ds = daysSince(last[id]);
      if (c === 0) return "idle"; // зарегистрировался, но ещё не писал
      if (ds <= 7 && c >= 3) return "active"; // пишет регулярно и недавно
      if (ds <= 30 || c >= ACTIVE_THRESHOLD) return "warm"; // живой, но реже
      return "started"; // начал, но давно не заходил
    };

    const build = (id: string): RefNode => ({
      id,
      name: all[id]?.name || "—",
      joined: all[id]?.created_at || null,
      entries: cnt[id] || 0,
      lastEntry: last[id] || null,
      activity: activityOf(id),
      children: (childrenOf[id] || []).map(build),
    });

    const nodes = (childrenOf[userId] || []).map(build);
    const active = ids.filter((id) => (cnt[id] || 0) >= ACTIVE_THRESHOLD).length;
    return { nodes, direct: nodes.length, network: ids.length, active, capped };
  } catch {
    return empty;
  }
}

// Списывает одну бесплатную книгу (расходует кредит). true — если получилось.
export async function claimFreeBook(userId: string): Promise<boolean> {
  const st = await getReferralStatus(userId);
  if (st.available < 1) return false;
  try {
    await supabaseAdmin().from("users").update({ free_books_used: st.used + 1 }).eq("id", userId);
    return true;
  } catch {
    return false;
  }
}
