import { notFound } from "next/navigation";
import BooksPublic from "@/components/BooksPublic";
import { getPublicLibrary } from "@/lib/books";
import { getLocale } from "@/lib/locale";

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <BooksPublic locale={locale} ownerName={data.ownerName} books={data.books} />
    </div>
  );
}
