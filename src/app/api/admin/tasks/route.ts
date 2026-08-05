import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addAdminTask, toggleAdminTask, deleteAdminTask, getAdminTasks } from "@/lib/adminTasks";
import { prepareFix } from "@/lib/fixAgent";

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
  // Агент готовит правку и открывает pull request. В main не пишет никогда:
  // выкатывает владелец, увидев зелёную сборку на ветке.
  if (action === "fix") {
    const id = String(body?.id || "");
    const tasks = await getAdminTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return NextResponse.json({ ok: false, error: "задача не найдена" }, { status: 404 });
    const res = await prepareFix({ title: task.title, note: task.note });
    return NextResponse.json(res);
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
