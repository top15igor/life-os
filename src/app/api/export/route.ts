import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildFullExport } from "@/lib/fullExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Полный экспорт всех данных пользователя — «забери всё своё».
// Сама сборка — в lib/fullExport.ts (общая с еженедельным автобэкапом в Telegram).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data } = await buildFullExport(user.id, user.name);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="lifeos-export-${date}.json"`,
    },
  });
}
