import { notFound } from "next/navigation";
import BooksPublic from "@/components/BooksPublic";
import { getPublicLibrary } from "@/lib/books";
import { getLocale } from "@/lib/locale";
import { getCurrentUser } from "@/lib/auth";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { PUBLIC_LIGHT } from "@/lib/publicShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicLibrary(slug).catch(() => null);
  const name = data?.ownerName;
  return { title: name ? `Книги — ${name}` : "Книги — LIFE OS" };
}

export default async function PublicBooksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicLibrary(slug).catch(() => null);
  if (!data) notFound();
  const locale = await getLocale();

  const isAuthed = !!(await getCurrentUser());
  // С чужой витрины должно быть куда уйти: логотип и кнопка ведут на лендинг.
  const own: Record<string, string> = {"ru": "Завести свой", "en": "Start your own", "uk": "Завести свій", "fr": "Créer le tien", "es": "Crea el tuyo"};

  return (
    <div data-public="1" style={PUBLIC_LIGHT}>
      <PublicHeader
        locale={locale}
        isAuthed={isAuthed}
        ctaLabel={isAuthed ? undefined : own[locale] || own.ru}
        ctaHref={isAuthed ? undefined : "/about"}
        showLang={false}
      />
      <BooksPublic locale={locale} ownerName={data.ownerName} books={data.books} />
      <PublicFooter locale={locale} width={920} />
    </div>
  );
}
