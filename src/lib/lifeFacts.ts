import { supabaseAdmin } from "./supabaseAdmin";

// Структурированная часть жизни для ответов агента.
//
// Раньше на вопрос «сколько раз я бегал в июле» агент отвечал по УПОМИНАНИЯМ
// в тексте дневника: он видел записи и деньги, а шаги, сон, настроение, вес,
// задачи, обещания, напоминания, людей и книги — нет. То есть на вопросы,
// которые люди и задают базе («сколько раз», «когда чаще», «что висит», «что
// я обещал»), он отвечал ощущениями вместо данных.
//
// Здесь мы собираем эти данные в компактный текстовый блок. Компактность
// важна: он уходит в каждый вопрос, и вываливать туда весь дневник нельзя.
// Поэтому — агрегаты по месяцам и короткие списки, а не сырые строки.

const ago = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10);
const monthOf = (d: string) => String(d || "").slice(0, 7);
const round = (n: number, k = 0) => (Number.isFinite(n) ? Number(n.toFixed(k)) : null);

function avg(list: number[]): number | null {
  const v = list.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

// Помесячная сводка одного показателя: «2026-06: 8 200; 2026-07: 9 100».
function byMonth(rows: { day: string; v: number | null }[], k = 0): string {
  const m = new Map<string, number[]>();
  for (const r of rows) {
    if (!Number.isFinite(r.v as number)) continue;
    const key = monthOf(r.day);
    (m.get(key) || m.set(key, []).get(key)!).push(Number(r.v));
  }
  return [...m.entries()]
    .sort()
    .map(([mon, list]) => `${mon}: ${round(avg(list) as number, k)}`)
    .join("; ");
}

async function health(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("health_metrics")
      .select("day, steps, sleep_hours, hr_resting, active_kcal, distance_km")
      .eq("user_id", userId)
      .gte("day", ago(400))
      .order("day", { ascending: true })
      .limit(500);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const parts: string[] = [];
    const steps = byMonth(rows.map((r) => ({ day: r.day, v: r.steps })));
    const sleep = byMonth(rows.map((r) => ({ day: r.day, v: r.sleep_hours })), 1);
    const hr = byMonth(rows.map((r) => ({ day: r.day, v: r.hr_resting })));
    const km = byMonth(rows.map((r) => ({ day: r.day, v: r.distance_km })), 1);
    if (steps) parts.push(`шаги в среднем за день по месяцам — ${steps}`);
    if (sleep) parts.push(`сон, часов за ночь — ${sleep}`);
    if (hr) parts.push(`пульс покоя — ${hr}`);
    if (km) parts.push(`пройдено км в день — ${km}`);
    parts.push(`дней с данными: ${rows.length}`);
    return `ЗДОРОВЬЕ (из Apple Health / Fitbit): ${parts.join("; ")}.`;
  } catch {
    return "";
  }
}

async function mood(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("day_moods")
      .select("day, mood")
      .eq("user_id", userId)
      .gte("day", ago(400))
      .order("day", { ascending: true })
      .limit(500);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const m = byMonth(rows.map((r) => ({ day: r.day, v: r.mood })), 1);
    const sorted = [...rows].sort((a, b) => Number(a.mood) - Number(b.mood));
    const worst = sorted.slice(0, 3).map((r) => `${r.day} (${r.mood})`).join(", ");
    const best = sorted.slice(-3).reverse().map((r) => `${r.day} (${r.mood})`).join(", ");
    return `НАСТРОЕНИЕ (шкала 1-10, по дням): по месяцам — ${m}. Худшие дни: ${worst}. Лучшие: ${best}. Всего отмечено дней: ${rows.length}.`;
  } catch {
    return "";
  }
}

async function tasks(userId: string): Promise<string> {
  try {
    const db = supabaseAdmin();
    const [open, done] = await Promise.all([
      db.from("tasks").select("text, due_date, created_at").eq("user_id", userId).eq("done", false).order("created_at", { ascending: false }).limit(25),
      db.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("done", true).gte("created_at", ago(30)),
    ]);
    const rows = (open.data as any[]) || [];
    if (!rows.length && !done.count) return "";
    const list = rows.map((t) => `• ${String(t.text).slice(0, 90)}${t.due_date ? ` (к ${t.due_date})` : ""}`).join("\n");
    return `ЗАДАЧИ. Открытых ${rows.length}${done.count ? `, закрыто за 30 дней ${done.count}` : ""}:\n${list}`;
  } catch {
    return "";
  }
}

async function promises(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("promises")
      .select("text, person, status, created_at")
      .eq("user_id", userId)
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(20);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const list = rows.map((p) => `• ${p.person ? `${p.person}: ` : ""}${String(p.text).slice(0, 90)} (с ${String(p.created_at || "").slice(0, 10)})`).join("\n");
    return `ОБЕЩАНИЯ, ещё не закрытые (${rows.length}):\n${list}`;
  } catch {
    return "";
  }
}

async function reminders(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("reminders")
      .select("text, due_at, done")
      .eq("user_id", userId)
      .eq("done", false)
      .gte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(15);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const list = rows.map((r) => `• ${String(r.due_at).slice(0, 16).replace("T", " ")} — ${String(r.text).slice(0, 80)}`).join("\n");
    return `БЛИЖАЙШИЕ НАПОМИНАНИЯ (${rows.length}):\n${list}`;
  } catch {
    return "";
  }
}

// Люди: кто чаще встречается и когда упоминался в последний раз. Именно это
// спрашивают — «кому я давно не писал», «когда мы виделись с Колей».
async function people(userId: string): Promise<string> {
  try {
    const db = supabaseAdmin();
    const { data: ppl } = await db.from("people").select("id, name").eq("user_id", userId).limit(200);
    const rows = (ppl as any[]) || [];
    if (!rows.length) return "";
    const { data: links } = await db
      .from("entry_people")
      .select("person_id, entries ( entry_date )")
      .in("person_id", rows.map((p) => p.id))
      .limit(3000);
    const stat = new Map<number, { n: number; last: string }>();
    for (const l of ((links as any[]) || [])) {
      const id = Number(l.person_id);
      const d = String(l.entries?.entry_date || "").slice(0, 10);
      const cur = stat.get(id) || { n: 0, last: "" };
      cur.n += 1;
      if (d > cur.last) cur.last = d;
      stat.set(id, cur);
    }
    const list = rows
      .map((p) => ({ name: String(p.name), ...(stat.get(Number(p.id)) || { n: 0, last: "" }) }))
      .filter((p) => p.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 25)
      .map((p) => `• ${p.name} — ${p.n} упом., последний раз ${p.last || "?"}`)
      .join("\n");
    return list ? `ЛЮДИ (по упоминаниям в записях):\n${list}` : "";
  } catch {
    return "";
  }
}

async function media(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("books")
      .select("title, author, kind, status, rating, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const line = (r: any) => `${r.title}${r.author ? ` (${r.author})` : ""}${r.rating ? ` — ${r.rating}/5` : ""}`;
    const doing = rows.filter((r) => r.status === "reading" || r.status === "doing").map(line);
    const done = rows.filter((r) => r.status === "read" || r.status === "done").map(line);
    const want = rows.filter((r) => r.status === "want").map(line);
    const parts: string[] = [];
    if (doing.length) parts.push(`сейчас: ${doing.slice(0, 6).join("; ")}`);
    if (done.length) parts.push(`прочитано/просмотрено (${done.length}): ${done.slice(0, 15).join("; ")}`);
    if (want.length) parts.push(`хочет (${want.length}): ${want.slice(0, 8).join("; ")}`);
    return parts.length ? `КНИГИ И МЕДИАТЕКА: ${parts.join(". ")}.` : "";
  } catch {
    return "";
  }
}

async function weight(userId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin()
      .from("weight_log")
      .select("day, kg")
      .eq("user_id", userId)
      .gte("day", ago(400))
      .order("day", { ascending: true })
      .limit(400);
    const rows = (data as any[]) || [];
    if (!rows.length) return "";
    const m = byMonth(rows.map((r) => ({ day: r.day, v: Number(r.kg) })), 1);
    return `ВЕС по месяцам, кг: ${m}.`;
  } catch {
    return "";
  }
}

// Всё вместе. Пустые разделы не попадают: лишний заголовок «данных нет» только
// сбивает модель и провоцирует придумывать.
export async function getLifeFacts(userId: string): Promise<string> {
  const parts = await Promise.all([health(userId), mood(userId), weight(userId), tasks(userId), promises(userId), reminders(userId), people(userId), media(userId)]);
  const body = parts.filter(Boolean).join("\n\n");
  if (!body) return "";
  return `ТОЧНЫЕ ДАННЫЕ ИЗ РАЗДЕЛОВ ПРИЛОЖЕНИЯ (это НЕ пересказ дневника, а сами цифры и списки — на вопросы «сколько», «когда», «что висит», «что я обещал» отвечай ПО НИМ, а не по ощущениям из текста):\n\n${body}`;
}
