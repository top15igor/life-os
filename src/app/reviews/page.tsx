import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ReviewForm from "@/components/ReviewForm";
import { PUBLIC_LIGHT_AURORA } from "@/lib/publicShell";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import { getApprovedReviews, getMyReview } from "@/lib/reviews";
import { testimonials } from "@/lib/testimonials";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("reviews", "/reviews");
}

const T: Record<string, any> = {
  ru: {
    kicker: "Отзывы", title: "Что говорят люди", lead: "Живые отзывы тех, кто ведёт LIFE OS. Ничего не придумано: каждый отзыв оставил человек сам и разрешил его опубликовать.",
    formTitle: "Оставить отзыв", formLead: "Пользуешься LIFE OS? Напиши пару предложений — это помогает другим понять, зачем это нужно.",
    guest: "Отзывы оставляют те, кто уже ведёт LIFE OS — так мы точно знаем, что это живой человек.", login: "Войти и оставить отзыв",
    empty: "Здесь пока пусто — будь первым.", back: "На главную",
  },
  en: {
    kicker: "Reviews", title: "What people say", lead: "Real reviews from people who keep LIFE OS. Nothing invented: each one was written by a person who allowed us to publish it.",
    formTitle: "Leave a review", formLead: "Using LIFE OS? Write a couple of sentences — it helps others understand why this matters.",
    guest: "Reviews come from people who already keep LIFE OS — that way we know it's a real person.", login: "Sign in and leave a review",
    empty: "Nothing here yet — be the first.", back: "Home",
  },
  uk: {
    kicker: "Відгуки", title: "Що кажуть люди", lead: "Живі відгуки тих, хто веде LIFE OS. Нічого не вигадано: кожен відгук залишила людина сама й дозволила його опублікувати.",
    formTitle: "Залишити відгук", formLead: "Користуєшся LIFE OS? Напиши кілька речень — це допомагає іншим зрозуміти, навіщо це потрібно.",
    guest: "Відгуки лишають ті, хто вже веде LIFE OS — так ми точно знаємо, що це жива людина.", login: "Увійти й лишити відгук",
    empty: "Тут поки порожньо — будь першим.", back: "На головну",
  },
  fr: {
    kicker: "Avis", title: "Ce que disent les gens", lead: "De vrais avis de ceux qui tiennent LIFE OS. Rien d'inventé : chacun a été écrit par une personne qui a autorisé sa publication.",
    formTitle: "Laisser un avis", formLead: "Tu utilises LIFE OS ? Écris deux phrases — ça aide les autres à comprendre à quoi ça sert.",
    guest: "Les avis viennent de ceux qui tiennent déjà LIFE OS — ainsi on sait que c'est une vraie personne.", login: "Se connecter et laisser un avis",
    empty: "Rien encore — sois le premier.", back: "Accueil",
  },
  es: {
    kicker: "Opiniones", title: "Lo que dice la gente", lead: "Opiniones reales de quienes llevan LIFE OS. Nada inventado: cada una la escribió una persona que autorizó publicarla.",
    formTitle: "Dejar una opinión", formLead: "¿Usas LIFE OS? Escribe un par de frases — ayuda a otros a entender para qué sirve.",
    guest: "Las opiniones vienen de quienes ya llevan LIFE OS — así sabemos que es una persona real.", login: "Entrar y dejar una opinión",
    empty: "Todavía no hay nada — sé el primero.", back: "Inicio",
  },
};

export default async function ReviewsPage() {
  const locale = await getLocale();
  const s = T[locale] || T.ru;
  const user = await getCurrentUser();
  const [approved, mine] = await Promise.all([getApprovedReviews(), user ? getMyReview(user.id) : Promise.resolve(null)]);
  // На странице показываем и одобренные из базы, и вписанные вручную.
  const manual = testimonials(locale).map((m) => ({ ...m, rating: 5, id: m.name }));
  const all = [...approved.map((r) => ({ id: r.id, text: r.text, name: r.name, role: r.role || "", rating: r.rating })), ...manual];

  return (
    <div data-public="1" style={PUBLIC_LIGHT_AURORA}>
      <PublicHeader
        locale={locale}
        isAuthed={!!user}
        links={[{ href: "/about", label: s.back }, { href: "/features", label: locale === "en" ? "Features" : "Возможности" }]}
      />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 22px 20px" }}>
        <div className="lp-kicker" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--accent)" }}>{s.kicker}</div>
        <h1 style={{ fontSize: "clamp(28px, 4.4vw, 40px)", fontWeight: 800, letterSpacing: "-0.025em", margin: "10px 0 12px" }}>{s.title}</h1>
        <p style={{ fontSize: 16.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 30px", maxWidth: 640 }}>{s.lead}</p>

        {all.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16, marginBottom: 46 }}>
            {all.map((r) => (
              <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "24px 22px", display: "flex", flexDirection: "column", boxShadow: "0 1px 2px rgba(20,24,40,.04), 0 12px 32px -20px rgba(20,24,40,.18)" }}>
                <div style={{ color: "#f5a623", fontSize: 15, letterSpacing: 2, marginBottom: 12 }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </div>
                <p style={{ fontSize: 15.5, color: "var(--text)", lineHeight: 1.6, margin: "0 0 18px", flex: 1 }}>«{r.text}»</p>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--accent-bg)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
                    {(r.name || "?").charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{r.name}</div>
                    {r.role && <div style={{ fontSize: 13, color: "var(--text-3)" }}>{r.role}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 15.5, color: "var(--text-3)", marginBottom: 40 }}>{s.empty}</div>
        )}
      </div>

      <div id="write" style={{ maxWidth: 640, margin: "0 auto", padding: "0 22px 70px" }}>
        <h2 style={{ fontSize: "clamp(22px, 3.2vw, 28px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{s.formTitle}</h2>
        <p style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 22px" }}>{s.formLead}</p>

        {user ? (
          <ReviewForm
            locale={locale}
            defaultName={user.name || ""}
            existing={mine ? { rating: mine.rating, text: mine.text, name: mine.name, role: mine.role, status: mine.status } : null}
          />
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "28px 24px" }}>
            <p style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 20px" }}>{s.guest}</p>
            <Link href="/login" style={{ display: "inline-block", padding: "13px 26px", borderRadius: 12, background: "linear-gradient(135deg,#6d6bf6,#8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", boxShadow: "0 12px 28px -12px rgba(91,91,245,.55)" }}>
              {s.login}
            </Link>
          </div>
        )}
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
