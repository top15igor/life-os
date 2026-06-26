import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createMemoryFromImage } from "@/lib/memory";

export const runtime = "nodejs";
export const maxDuration = 60;

// Загрузка фото/документа с сайта → AI-разбор → «память».
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("image") as File | null;
  if (!file) return NextResponse.json({ ok: false }, { status: 400 });
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ ok: false, error: "too_big" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const { memory } = await createMemoryFromImage(user.id, buf, file.type || "image/jpeg");
  if (!memory) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, memory });
}
