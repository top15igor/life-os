import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listExportFiles, splitParts, humanSize } from "@/lib/exportFiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Сколько весит выгрузка с файлами. Нужно, чтобы человек до нажатия видел,
// на что подписывается: «128 файлов, 340 МБ, 10 частей» — это честнее, чем
// кнопка, которая молча грузит полчаса.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const files = await listExportFiles(user.id);
    const bytes = files.reduce((s, f) => s + f.size, 0);
    const parts = splitParts(files).length;
    return NextResponse.json({ ok: true, count: files.length, bytes, parts, human: humanSize(bytes) });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
