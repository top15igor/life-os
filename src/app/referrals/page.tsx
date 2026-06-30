import { headers } from "next/headers";
import Sidebar from "@/components/Sidebar";
import BackLink from "@/components/BackLink";
import ReferralTreeView from "@/components/ReferralTreeView";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";
import { getReferralTree, getReferralStatus } from "@/lib/referral";
import { getHandle } from "@/lib/handle";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDict(locale);

  const [tree, status, handle] = await Promise.all([
    getReferralTree(user.id),
    getReferralStatus(user.id),
    getHandle(user.id, user.name),
  ]);

  const hdrs = await headers();
  const host = hdrs.get("host") || "mylifebookai.vercel.app";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const inviteLink = `${proto}://${host}/i/${handle}`;

  return (
    <div className="shell">
      <Sidebar navLabels={t.nav} brand={t.brand} locale={locale} />
      <main className="main">
        <BackLink locale={locale} />
        <ReferralTreeView locale={locale} tree={tree} status={status} inviteLink={inviteLink} />
      </main>
    </div>
  );
}
