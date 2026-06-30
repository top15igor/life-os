import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addAdminTask, toggleAdminTask, deleteAdminTask } from "@/lib/adminTasks";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "add") {
    const task = await addAdminTask(String(body?.title || ""), body?.note);
    if (!task) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: true, task });
  }
  if (action === "toggle") {
    const ok = await toggleAdminTask(String(body?.id || ""), !!body?.done);
    return NextResponse.json({ ok });
  }
  if (action === "delete") {
    const ok = await deleteAdminTask(String(body?.id || ""));
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
