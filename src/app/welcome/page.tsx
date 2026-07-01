import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /welcome исторически показывал слайд-онбординг. Теперь гостя ведём на реальную
// презентацию сайта /about (с сохранением реферала), чтобы человек читал про продукт
// на самом сайте, а не на отдельной карусели.
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const sp = await searchParams;
  const ref = sp.ref && /^[A-Za-z0-9-]{3,40}$/.test(sp.ref) ? `?ref=${encodeURIComponent(sp.ref)}` : "";
  redirect(`/about${ref}`);
}
