// Каналы привлечения: помеченные ссылки на бота + статистика (только владелец).
// GET — список каналов с воронкой (пришло → пишут → живы за 7 дней),
// POST {name, cost?} — создать канал (slug генерится из названия),
// DELETE ?id= — удалить канал (пользователи и их source остаются).
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBotLink } from "@/lib/botLink";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Транслит названия в короткий латинский slug для ссылки.
const TR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", і: "i", ї: "i", є: "e", ґ: "g" };
function toSlug(name: string): string {
  const s = name.toLowerCase().split("").map((ch) => TR[ch] ?? ch).join("")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24);
  return s || `ch${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const db = supabaseAdmin();

  const { data: channels, error } = await db.from("channels").select("id, slug, name, cost, created_at").order("created_at");
  if (error) return NextResponse.json({ ok: false, needSql: true });

  const [{ data: users }, { data: entries }] = await Promise.all([
    db.from("users").select("id, source, created_at"),
    db.from("entries").select("user_id, created_at"),
  ]);

  // Статистика записей по пользователю: сколько всего и когда последняя.
  const stat = new Map<string, { count: number; last: number }>();
  for (const e of (entries as any[]) ?? []) {
    if (!e.user_id) continue;
    const s = stat.get(e.user_id) || { count: 0, last: 0 };
    s.count++;
    s.last = Math.max(s.last, new Date(e.created_at).getTime());
    stat.set(e.user_id, s);
  }
  const week = Date.now() - 7 * 864e5;

  function funnel(us: any[]) {
    let registered = 0, wrote = 0, engaged = 0, active7 = 0;
    for (const u of us) {
      registered++;
      const s = stat.get(u.id);
      if (s?.count) wrote++;
      if ((s?.count ?? 0) >= 5) engaged++;
      if ((s?.last ?? 0) >= week) active7++;
    }
    return { registered, wrote, engaged, active7 };
  }

  const bySource = new Map<string, any[]>();
  for (const u of (users as any[]) ?? []) {
    const key = u.source || "";
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(u);
  }

  const list = await Promise.all((((channels as any[]) ?? [])).map(async (c) => ({
    ...c,
    link: await getBotLink(`src_${c.slug}`),
    ...funnel(bySource.get(c.slug) || []),
  })));

  // Люди с меткой, для которой канал уже удалён — чтобы цифры не терялись.
  const known = new Set((((channels as any[]) ?? [])).map((c) => c.slug));
  const orphan = [...bySource.entries()]
    .filter(([slug]) => slug && !known.has(slug))
    .map(([slug, us]) => ({ slug, ...funnel(us) }));

  return NextResponse.json({ ok: true, channels: list, noSource: funnel(bySource.get("") || []), orphan });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 80);
  const cost = Number(body?.cost) || 0;
  if (!name) return NextResponse.json({ ok: false, error: "no name" }, { status: 400 });

  const db = supabaseAdmin();
  let slug = toSlug(name);
  // Если slug занят — добавляем суффикс.
  const { data: busy } = await db.from("channels").select("id").eq("slug", slug).maybeSingle();
  if (busy) slug = `${slug}_${Math.random().toString(36).slice(2, 5)}`.slice(0, 32);

  const { data, error } = await db.from("channels").insert({ slug, name, cost }).select("id, slug, name, cost").single();
  if (error) return NextResponse.json({ ok: false, needSql: true }, { status: 500 });
  return NextResponse.json({ ok: true, channel: { ...data, link: await getBotLink(`src_${slug}`) } });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  await supabaseAdmin().from("channels").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
