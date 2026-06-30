import { notFound } from "next/navigation";
import WishlistPublic from "@/components/WishlistPublic";
import { getPublicWishlist } from "@/lib/wishlist";
import { getLocale } from "@/lib/locale";

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <WishlistPublic locale={locale} ownerName={data.ownerName} wishes={data.wishes} />
    </div>
  );
}
