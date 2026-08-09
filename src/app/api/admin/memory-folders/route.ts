import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deriveFolder } from "@/lib/memoryFolders";

export const runtime = "nodejs";

// Разложить УЖЕ загруженные фото/документы по стопкам-папкам эвристикой (без AI,
// мгновенно и бесплатно). GET — предпросмотр, POST — записать folder в базу.
// Только для владельца, только по его сессии.
export async function GET() {
  return handle(false);
}
export async function POST() {
  return handle(true);
}

async function handle(apply: boolean) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });

  const db = supabaseAdmin();
  let rows: any[] = [];
  try {
    const { data, error } = await db.from("memories").select("id, category, title, fields, folder").eq("user_id", user.id).limit(500);
    if (error) throw error;
    rows = (data as any[]) || [];
  } catch {
    return NextResponse.json({ ok: false, error: "no folder column? apply memory_folders.sql" }, { status: 400 });
  }

  const plan: { id: string; folder: string }[] = [];
  for (const r of rows) {
    if (r.folder) continue; // уже в папке — не трогаем
    const f = deriveFolder(r.category, r.title, r.fields);
    if (f) plan.push({ id: r.id, folder: f });
  }

  if (apply) {
    let done = 0;
    for (const p of plan) {
      try {
        const { error } = await db.from("memories").update({ folder: p.folder }).eq("id", p.id).eq("user_id", user.id);
        if (!error) done++;
      } catch {}
    }
    return NextResponse.json({ ok: true, applied: done, total: plan.length });
  }

  // Предпросмотр: сколько и в какие папки ляжет.
  const byFolder: Record<string, number> = {};
  for (const p of plan) byFolder[p.folder] = (byFolder[p.folder] || 0) + 1;
  return NextResponse.json({ ok: true, willUpdate: plan.length, byFolder });
}
