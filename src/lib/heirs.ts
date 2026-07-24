// ============================================================
//  👨‍👩‍👧 Наследники: кому однажды откроется твоя Книга жизни.
//  Модель — по секретной ссылке /heir/<token>. Пока «запечатано» (sealed) —
//  ссылка показывает бережный экран ожидания. «Раскрыто» (released) — ссылка
//  открывает Книгу жизни владельца. Раскрыть можно вручную или авто —
//  по долгому молчанию (dead-man's switch, см. крон).
//  Требует таблицу heirs (supabase/heirs.sql). Без неё — мягкая деградация.
// ============================================================

import { supabaseAdmin } from "./supabaseAdmin";
import { getBookMeta } from "./book";

export type Heir = { id: string; name: string; relation: string | null; email: string | null; token: string; status: "sealed" | "released"; auto_release_days: number; released_at: string | null; created_at: string };

function genToken(): string {
  const uuid = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/-/g, "");
  return uuid.slice(0, 24);
}

export async function listHeirs(userId: string): Promise<Heir[]> {
  try {
    const { data } = await supabaseAdmin().from("heirs").select("id, name, relation, email, token, status, auto_release_days, released_at, created_at").eq("user_id", userId).order("created_at", { ascending: true });
    return (data as Heir[]) || [];
  } catch {
    return [];
  }
}

export async function addHeir(userId: string, name: string, relation: string, email: string): Promise<Heir | null> {
  const nm = (name || "").trim().slice(0, 80);
  if (!nm) return null;
  try {
    const { data, error } = await supabaseAdmin().from("heirs").insert({
      user_id: userId, name: nm, relation: (relation || "").trim().slice(0, 40) || null,
      email: (email || "").trim().slice(0, 120) || null, token: genToken(),
    }).select("id, name, relation, email, token, status, auto_release_days, released_at, created_at").maybeSingle();
    if (error) return null;
    return data as Heir;
  } catch {
    return null;
  }
}

export async function removeHeir(userId: string, id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from("heirs").delete().eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

export async function setHeirStatus(userId: string, id: string, status: "sealed" | "released"): Promise<boolean> {
  try {
    const patch: any = { status };
    patch.released_at = status === "released" ? new Date().toISOString() : null;
    const { error } = await supabaseAdmin().from("heirs").update(patch).eq("id", id).eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

// Данные для страницы наследника по токену: сам наследник, владелец и (если раскрыто) книга.
export async function getHeirView(token: string): Promise<
  | { ok: false }
  | { ok: true; released: boolean; ownerName: string; heirName: string; relation: string | null; book?: { dedication: string; letterClose: string; letterSelf: string; chapters: { title: string; body: string }[] } }
> {
  try {
    const db = supabaseAdmin();
    const { data: h } = await db.from("heirs").select("id, name, relation, status, user_id").eq("token", token).maybeSingle();
    if (!h) return { ok: false };
    const { data: u } = await db.from("users").select("name").eq("id", (h as any).user_id).maybeSingle();
    const ownerName = ((u as any)?.name || "").trim() || "—";
    const released = (h as any).status === "released";
    if (!released) return { ok: true, released: false, ownerName, heirName: (h as any).name, relation: (h as any).relation };

    // Собираем читаемую книгу из уже сгенерированных данных (dedication, письма, кэш глав).
    const year = new Date().getUTCFullYear();
    const meta = await getBookMeta((h as any).user_id, year).catch(() => null);
    const chapters: { title: string; body: string }[] = [];
    const sections = (meta as any)?.sections || {};
    for (const [key, val] of Object.entries(sections)) {
      if (key.startsWith("__")) continue; // служебные (__gen/__design/__dataEdits)
      const v: any = val;
      const body = typeof v === "string" ? v : (v?.body || "");
      if (body && String(body).trim()) chapters.push({ title: v?.title || "", body: String(body) });
    }
    return {
      ok: true, released: true, ownerName, heirName: (h as any).name, relation: (h as any).relation,
      book: { dedication: (meta as any)?.dedication || "", letterClose: (meta as any)?.letter_close || "", letterSelf: (meta as any)?.letter_self || "", chapters },
    };
  } catch {
    return { ok: false };
  }
}

// Крон: авто-раскрытие «по долгому молчанию» (dead-man's switch). Если владелец не
// делал записей дольше auto_release_days — запечатанные наследники раскрываются.
export async function autoReleaseInactive(): Promise<number> {
  try {
    const db = supabaseAdmin();
    const { data: sealed } = await db.from("heirs").select("id, user_id, auto_release_days").eq("status", "sealed").limit(500);
    if (!sealed?.length) return 0;
    const byUser = new Map<string, { ids: string[]; days: number }[]>();
    for (const h of sealed as any[]) {
      if (!h.auto_release_days || h.auto_release_days <= 0) continue;
      const arr = byUser.get(h.user_id) || [];
      arr.push({ ids: [h.id], days: h.auto_release_days });
      byUser.set(h.user_id, arr);
    }
    let released = 0;
    for (const [userId, list] of byUser) {
      const { data: last } = await db.from("entries").select("entry_date").eq("user_id", userId).order("entry_date", { ascending: false }).limit(1);
      const lastDate = (last as any)?.[0]?.entry_date;
      const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate + "T12:00:00Z").getTime()) / 86400000) : 99999;
      for (const item of list) {
        if (daysSince >= item.days) {
          await db.from("heirs").update({ status: "released", released_at: new Date().toISOString() }).in("id", item.ids);
          released += item.ids.length;
        }
      }
    }
    return released;
  } catch {
    return 0;
  }
}
