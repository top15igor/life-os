import { notFound } from "next/navigation";
import WishlistPublic from "@/components/WishlistPublic";
import { getPublicWishlist } from "@/lib/wishlist";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicWishlist(slug).catch(() => null);
  const name = data?.ownerName;
  return { title: name ? `Вишлист — ${name}` : "Вишлист — LIFE OS" };
}

export default async function PublicWishlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicWishlist(slug).catch(() => null);
  if (!data) notFound();
  const locale = await getLocale();

  const isAuthed = !!(await getCurrentUser());
  // С чужой витрины должно быть куда уйти: логотип и кнопка ведут на лендинг.
  const own: Record<string, string> = {"ru": "Завести свой", "en": "Start your own", "uk": "Завести свій", "fr": "Créer le tien", "es": "Crea el tuyo"};

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PublicHeader
        locale={locale}
        isAuthed={isAuthed}
        ctaLabel={isAuthed ? undefined : own[locale] || own.ru}
        ctaHref={isAuthed ? undefined : "/about"}
        showLang={false}
      />
      <WishlistPublic locale={locale} ownerName={data.ownerName} wishes={data.wishes} />
    </div>
  );
}
