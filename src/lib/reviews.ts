import { supabaseAdmin } from "./supabaseAdmin";
import type { Locale } from "./i18n";
import { testimonials, type Testimonial } from "./testimonials";

// Отзывы посетителей. Человек оставляет отзыв на /reviews, но на лендинг он
// попадает только после одобрения владельцем в /admin/reviews — иначе на главной
// странице продукта мог бы оказаться любой текст.

export type Review = {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  rating: number;
  text: string;
  locale: string;
  status: "pending" | "approved" | "rejected";
  consent: boolean;
  created_at: string;
  approved_at: string | null;
};

const COLS = "id, user_id, name, role, rating, text, locale, status, consent, created_at, approved_at";

/** Отзыв этого человека — чтобы показать «уже отправлено» и дать переписать. */
export async function getMyReview(userId: string): Promise<Review | null> {
  try {
    const { data } = await supabaseAdmin().from("reviews").select(COLS).eq("user_id", userId).maybeSingle();
    return (data as any) || null;
  } catch {
    return null;
  }
}

/**
 * Сохранить отзыв. Повторная отправка перезаписывает прошлый и снова уходит
 * на проверку: одобренный текст не должен незаметно меняться.
 */
export async function saveReview(input: {
  userId: string;
  name: string;
  role?: string;
  rating: number;
  text: string;
  locale: string;
  consent: boolean;
}): Promise<Review | null> {
  const text = String(input.text || "").trim().slice(0, 900);
  const name = String(input.name || "").trim().slice(0, 60);
  if (!text || !name || !input.consent) return null;
  const rating = Math.min(5, Math.max(1, Math.round(input.rating || 5)));

  try {
    const { data } = await supabaseAdmin()
      .from("reviews")
      .upsert(
        {
          user_id: input.userId,
          name,
          role: String(input.role || "").trim().slice(0, 60) || null,
          rating,
          text,
          locale: input.locale,
          consent: true,
          status: "pending",
          approved_at: null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select(COLS)
      .single();
    return (data as any) || null;
  } catch {
    return null;
  }
}

/** Одобренные отзывы для публичных страниц. */
export async function getApprovedReviews(limit = 24): Promise<Review[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("reviews")
      .select(COLS)
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(limit);
    return (data as any) || [];
  } catch {
    // Таблицы ещё нет (SQL не применён) — лендинг просто покажет ручные отзывы.
    return [];
  }
}

/** Всё для админки: сначала то, что ждёт решения. */
export async function getAllReviews(): Promise<Review[]> {
  try {
    const { data } = await supabaseAdmin().from("reviews").select(COLS).order("created_at", { ascending: false });
    const all = ((data as any) || []) as Review[];
    return all.sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  } catch {
    return [];
  }
}

export async function moderateReview(id: string, status: "approved" | "rejected"): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("reviews")
    .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function deleteReview(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("reviews").delete().eq("id", id);
  return !error;
}

/**
 * То, что видит лендинг: одобренные отзывы из базы плюс отзывы, которые Игорь
 * вписал руками (их присылают в переписке, а не через форму).
 */
export async function publicTestimonials(locale: Locale): Promise<Testimonial[]> {
  const approved = await getApprovedReviews();
  const fromDb = approved.map((r) => ({ text: r.text, name: r.name, role: r.role || "" }));
  return [...fromDb, ...testimonials(locale)];
}
