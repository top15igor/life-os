import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getHandle } from "@/lib/handle";

export const dynamic = "force-dynamic";

// Корень сайта. Незалогиненных middleware отправляет на /about (публичный лендинг).
// Залогиненных — на их домашнюю ленту /i/<username>.
export default async function HomePage() {
  const user = await requireUser();
  const handle = await getHandle(user.id, user.name);
  redirect(`/i/${handle}`);
}
