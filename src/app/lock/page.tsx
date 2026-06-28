import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLocale } from "@/lib/locale";
import LockScreen from "@/components/LockScreen";

export const dynamic = "force-dynamic";

export default async function LockPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/about");

  let hasPin = false;
  try {
    const { data } = await supabaseAdmin().from("users").select("pin_hash").eq("id", user.id).maybeSingle();
    hasPin = !!data?.pin_hash;
  } catch {}
  if (!hasPin) redirect("/");

  const locale = await getLocale();
  return <LockScreen locale={locale} />;
}
