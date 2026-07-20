import { redirect } from "next/navigation";
import HomeBody from "@/components/HomeBody";
import { getCurrentUser } from "@/lib/auth";
import { resolveRefToId } from "@/lib/users";

export const dynamic = "force-dynamic";

// Умная ссылка-имя: life-os.today/i/<username>
//  - владелец (вошёл в свой аккаунт)  -> его домашняя лента «Сегодня» (как @имя в Instagram);
//  - кто угодно другой / гость         -> реальная презентация сайта /about (с сохранением реферала).

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Если это сам владелец ссылки и он вошёл — показываем его ленту «Сегодня» (URL остаётся /i/<username>).
  const me = await getCurrentUser();
  if (me) {
    const ownerId = await resolveRefToId(code);
    if (ownerId && ownerId === me.id) {
      return <HomeBody />;
    }
  }

  // Гость / не-владелец — на корень сайта (там презентация). Реферал пробрасываем
  // меткой ?ref=<code> (сохраняется через /login в бота и в email/Google-регистрацию).
  const ref = code && /^[A-Za-z0-9-]{3,40}$/.test(code) ? `?ref=${encodeURIComponent(code)}` : "";
  redirect(`/${ref}`);
}
