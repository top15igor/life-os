import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listToSort, keepAsIs, fixCategory, listRules, forgetRule, rulesHint } from "@/lib/sortShelf";
import { MEM_CATEGORIES } from "@/lib/vision";
import { findDuplicates, mergeEntities } from "@/lib/dedupe";
import { findThemes, makeProject, dismissTheme } from "@/lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Полка «Разобрать»: что ждёт решения и как это решение принять.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  // Дубли ищем здесь же: «Разобрать» — место, где шкаф показывает всё, в чём
  // сомневается, а три карточки на одного человека — ровно такое сомнение.
  const [items, rules, hint, dupPeople, dupPlaces, themes] = await Promise.all([
    listToSort(user.id),
    listRules(user.id),
    rulesHint(user.id),
    findDuplicates(user.id, "people"),
    findDuplicates(user.id, "places"),
    findThemes(user.id),
  ]);
  const dupes = [...dupPeople, ...dupPlaces];
  // hint — ровно та строка, которую видит разбор. Пусть будет видна и здесь:
  // «правило записано» и «правило доходит до разбора» — разные вещи.
  return NextResponse.json({ ok: true, items, rules, hint, dupes, themes });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const id = String(body?.id || "");
  if (!id && !["merge", "theme", "themeSkip"].includes(action)) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "keep") return NextResponse.json({ ok: await keepAsIs(user.id, id) });

  if (action === "category") {
    const category = String(body?.category || "");
    if (!MEM_CATEGORIES.includes(category)) return NextResponse.json({ ok: false, error: "category" }, { status: 400 });
    return NextResponse.json({ ok: await fixCategory(user.id, id, category) });
  }

  if (action === "forgetRule") return NextResponse.json({ ok: await forgetRule(user.id, id) });

  if (action === "theme") {
    const tagId = Number(body?.tagId);
    const title = String(body?.title || "");
    if (!tagId || !title) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json(await makeProject(user.id, tagId, title));
  }

  if (action === "themeSkip") {
    const tagId = Number(body?.tagId);
    if (!tagId) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: await dismissTheme(user.id, tagId) });
  }

  if (action === "merge") {
    const kind = body?.kind === "places" ? "places" : "people";
    const keepId = Number(body?.keepId);
    const mergeIds = Array.isArray(body?.mergeIds) ? body.mergeIds.map((x: any) => Number(x)).filter(Boolean) : [];
    if (!keepId || !mergeIds.length) return NextResponse.json({ ok: false }, { status: 400 });
    return NextResponse.json({ ok: await mergeEntities(user.id, kind, keepId, mergeIds) });
  }

  return NextResponse.json({ ok: false, error: "action" }, { status: 400 });
}
