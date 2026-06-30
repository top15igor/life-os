import Sidebar from "@/components/Sidebar";
import PageHead from "@/components/PageHead";
import Wishlist from "@/components/Wishlist";
import { getWishes, getWishShare } from "@/lib/wishlist";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { hints } from "@/lib/hints";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);
  const h = hints(locale);
  const [wishes, share] = await Promise.all([getWishes(user.id), getWishShare(user.id)]);

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <PageHead icon="ti-gift" color="#ec4899" title={t.nav.wishlist} hint={h.wishlist} />
        <Wishlist locale={locale} initial={wishes as any} share={share} />
      </main>
    </div>
  );
}
