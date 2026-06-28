import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildObsidianZip } from "@/lib/obsidian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Выгрузка дневника в Obsidian-vault (.zip из Markdown-файлов). Только свои данные.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const zip = await buildObsidianZip(user.id, user.name || undefined);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(zip as any, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="LIFE_OS_Obsidian_${date}.zip"`,
      "cache-control": "no-store",
    },
  });
}
