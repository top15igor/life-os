import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

// Тот же нормализованный ключ, что и в saveEntry.linkNames: без регистра,
// пробелов, дефисов/слэшей и пунктуации, ё=е.
function normKey(s: string): string {
  return (s || "").toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, "");
}

type Proj = { id: number; name: string };

// Собираем план слияния: группы проектов с одинаковым normKey (size > 1).
// В каждой группе canonical = у кого больше записей (при равенстве — меньший id = старше).
async function buildPlan(userId: string) {
  const db = supabaseAdmin();
  const { data: projs } = await db.from("projects").select("id,name").eq("user_id", userId);
  const projects = ((projs as Proj[]) ?? []).filter((p) => p?.id != null);

  // Кол-во записей у каждого проекта.
  const ids = projects.map((p) => p.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const { data: links } = await db.from("entry_projects").select("project_id").in("project_id", ids);
    for (const l of (links as any[]) ?? []) counts.set(l.project_id, (counts.get(l.project_id) ?? 0) + 1);
  }

  // Группировка по ключу.
  const groups = new Map<string, Proj[]>();
  for (const p of projects) {
    const k = normKey(p.name);
    if (!k) continue;
    const arr = groups.get(k) ?? [];
    arr.push(p);
    groups.set(k, arr);
  }

  const plan: {
    canonical: { id: number; name: string; entries: number };
    dups: { id: number; name: string; entries: number }[];
    mergedEntries: number;
  }[] = [];

  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    // canonical: max entries, затем меньший id (создан раньше).
    const sorted = [...arr].sort((a, b) => {
      const ca = counts.get(a.id) ?? 0;
      const cb = counts.get(b.id) ?? 0;
      if (cb !== ca) return cb - ca;
      return a.id - b.id;
    });
    const canonical = sorted[0];
    const dups = sorted.slice(1);
    plan.push({
      canonical: { id: canonical.id, name: canonical.name, entries: counts.get(canonical.id) ?? 0 },
      dups: dups.map((d) => ({ id: d.id, name: d.name, entries: counts.get(d.id) ?? 0 })),
      mergedEntries: dups.reduce((n, d) => n + (counts.get(d.id) ?? 0), 0),
    });
  }

  // Крупные слияния сверху.
  plan.sort((a, b) => b.dups.length - a.dups.length || b.mergedEntries - a.mergedEntries);
  return { totalProjects: projects.length, plan };
}

// Предпросмотр: что с чем сольётся (без изменений).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const { totalProjects, plan } = await buildPlan(user.id);
  const dupCount = plan.reduce((n, g) => n + g.dups.length, 0);
  return NextResponse.json({ ok: true, dryRun: true, totalProjects, groups: plan.length, dupProjects: dupCount, plan });
}

// Применение: переносим записи дублей в canonical, удаляем дубли.
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.id !== OWNER) return NextResponse.json({ ok: false }, { status: 403 });
  const db = supabaseAdmin();
  const { plan } = await buildPlan(user.id);

  let mergedProjects = 0;
  let movedEntries = 0;

  for (const group of plan) {
    const canonicalId = group.canonical.id;
    for (const dup of group.dups) {
      // Записи, привязанные к дублю.
      const { data: links } = await db.from("entry_projects").select("entry_id").eq("project_id", dup.id);
      const entryIds = [...new Set(((links as any[]) ?? []).map((l) => l.entry_id))];

      if (entryIds.length) {
        // Какие из них уже привязаны к canonical — чтобы не словить конфликт уникальности.
        const { data: existing } = await db
          .from("entry_projects")
          .select("entry_id")
          .eq("project_id", canonicalId)
          .in("entry_id", entryIds);
        const already = new Set(((existing as any[]) ?? []).map((l) => l.entry_id));
        const toAdd = entryIds.filter((e) => !already.has(e));
        if (toAdd.length) {
          await db.from("entry_projects").insert(toAdd.map((e) => ({ entry_id: e, project_id: canonicalId })));
          movedEntries += toAdd.length;
        }
      }

      // Убираем связи дубля и сам дубль-проект.
      await db.from("entry_projects").delete().eq("project_id", dup.id);
      await db.from("projects").delete().eq("id", dup.id).eq("user_id", user.id);
      mergedProjects += 1;
    }
  }

  return NextResponse.json({ ok: true, applied: true, mergedProjects, movedEntries, groups: plan.length });
}
