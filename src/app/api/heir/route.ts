import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addHeir, removeHeir, setHeirStatus } from "@/lib/heirs";

export const runtime = "nodejs";

// Управление наследниками: добавить / удалить / раскрыть / запечатать. Только свои.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "add") {
    const heir = await addHeir(user.id, String(body.name || ""), String(body.relation || ""), String(body.email || ""));
    return NextResponse.json({ ok: !!heir, heir });
  }
  if (action === "remove" && body.id) {
    const ok = await removeHeir(user.id, String(body.id));
    return NextResponse.json({ ok });
  }
  if ((action === "release" || action === "seal") && body.id) {
    const ok = await setHeirStatus(user.id, String(body.id), action === "release" ? "released" : "sealed");
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
