import JSZip from "jszip";
import { getEntries, cats, tagList, people, places, projects } from "./queries";
import { supabaseAdmin } from "./supabaseAdmin";

// ===== Экспорт дневника в Markdown-«vault» для Obsidian =====
// Обычные .md-файлы: ежедневные заметки + заметки людей/мест со ссылками [[ ]].
// Данные полностью у пользователя — открывает папку как Vault в Obsidian.

const BAD = /[\\/:*?"<>|#^[\]]/g; // недопустимо в именах файлов / мешает Obsidian
function safeName(s: string): string {
  return (s || "").replace(BAD, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "—";
}
function tagify(s: string): string {
  return (s || "").trim().replace(/#/g, "").replace(/\s+/g, "-");
}

function readme(name: string | undefined, days: number, entries: number): string {
  return `# LIFE OS — мой дневник

Это все твои записи в обычных **Markdown-файлах**. Они полностью твои: ни от какого сервиса не зависят, открываются где угодно и останутся с тобой навсегда.

## Как открыть в Obsidian
1. Установи Obsidian (obsidian.md) — бесплатно.
2. «Open folder as vault» → выбери **эту папку**.
3. Готово: смотри ежедневные заметки, связи людей и мест, граф.

## Что внутри
- **Дневник/** — ежедневные заметки по годам и месяцам (формат \`ГГГГ-ММ-ДД\`).
- **Люди/** и **Места/** — отдельные заметки, связанные ссылками \`[[ ]]\` (видно в графе Obsidian).
- Темы записей — это теги \`#…\`, по ним удобно искать и строить граф.

Автор: ${name || "—"} · дней с записями: ${days} · всего записей: ${entries} · выгружено из LIFE OS.
`;
}

export async function buildObsidianZip(userId: string, userName?: string): Promise<Uint8Array> {
  const zip = new JSZip();
  const db = supabaseAdmin();

  const entries = await getEntries(userId, 2000);

  // Инсайты и благодарности — по записям (чтобы попали в заметки).
  const insByEntry: Record<string, string[]> = {};
  const gratByEntry: Record<string, string[]> = {};
  try { const { data } = await db.from("insights").select("text, entry_id").eq("user_id", userId); for (const r of data || []) if (r.entry_id) (insByEntry[r.entry_id] ||= []).push(r.text); } catch {}
  try { const { data } = await db.from("gratitude").select("text, entry_id").eq("user_id", userId); for (const r of data || []) if (r.entry_id) (gratByEntry[r.entry_id] ||= []).push(r.text); } catch {}

  // Группируем по дню.
  const byDate: Record<string, any[]> = {};
  for (const e of entries) (byDate[e.entry_date] ||= []).push(e);
  for (const d of Object.keys(byDate)) byDate[d].sort((a, b) => (a.entry_time || "").localeCompare(b.entry_time || ""));

  const personDays: Record<string, Set<string>> = {};
  const placeDays: Record<string, Set<string>> = {};

  for (const date of Object.keys(byDate).sort()) {
    const day = byDate[date];
    const year = date.slice(0, 4), ym = date.slice(0, 7);
    const tagSet = new Set<string>();
    let mood: any = null, energy: any = null, health: any = null;
    const body: string[] = [];

    for (const e of day) {
      const time = (e.entry_time || "").slice(0, 5);
      const src = e.source === "telegram_voice" ? "🎤 голос" : "✍️ текст";
      body.push(`## ${[time, src].filter(Boolean).join(" · ")}`);
      body.push("");
      body.push((e.raw_text || e.summary || "").trim());
      body.push("");

      const cs = cats(e).map((c: any) => c.slug);
      const tg = tagList(e);
      [...cs, ...tg].forEach((x) => tagSet.add(tagify(x)));
      if (mood == null && e.mood != null) mood = e.mood;
      if (energy == null && e.energy != null) energy = e.energy;
      if (health == null && e.health != null) health = e.health;

      const meta: string[] = [];
      if (cs.length || tg.length) meta.push(`**Темы:** ${[...cs, ...tg].map((x) => "#" + tagify(x)).join(" ")}`);
      const ppl = people(e);
      if (ppl.length) { meta.push(`**Люди:** ${ppl.map((n) => `[[${safeName(n)}]]`).join(", ")}`); ppl.forEach((n) => (personDays[safeName(n)] ||= new Set()).add(date)); }
      const plc = places(e);
      if (plc.length) { meta.push(`**Места:** ${plc.map((n) => `[[${safeName(n)}]]`).join(", ")}`); plc.forEach((n) => (placeDays[safeName(n)] ||= new Set()).add(date)); }
      const pr = projects(e);
      if (pr.length) meta.push(`**Проекты:** ${pr.map((n) => `[[${safeName(n)}]]`).join(", ")}`);
      const metrics = [
        e.mood != null ? `настроение ${e.mood}/10` : null,
        e.energy != null ? `энергия ${e.energy}/10` : null,
        e.health != null ? `здоровье ${e.health}/10` : null,
        e.sleep_hours != null ? `сон ${e.sleep_hours} ч` : null,
        e.weight != null ? `вес ${e.weight} кг` : null,
      ].filter(Boolean);
      if (metrics.length) meta.push(`*${metrics.join(" · ")}*`);
      const ins = insByEntry[e.id] || []; if (ins.length) meta.push(`**Инсайты:** ${ins.join("; ")}`);
      const gr = gratByEntry[e.id] || []; if (gr.length) meta.push(`**Благодарность:** ${gr.join("; ")}`);
      if (meta.length) { body.push(meta.join("  \n")); body.push(""); }
    }

    const fm = ["---", `date: ${date}`, `tags: [lifeos${tagSet.size ? ", " + [...tagSet].join(", ") : ""}]`];
    if (mood != null) fm.push(`mood: ${mood}`);
    if (energy != null) fm.push(`energy: ${energy}`);
    if (health != null) fm.push(`health: ${health}`);
    fm.push("---", "");

    zip.file(`Дневник/${year}/${ym}/${date}.md`, fm.join("\n") + `# ${date}\n\n` + body.join("\n"));
  }

  const backlinks = (days: Set<string>) => [...days].sort().reverse().map((d) => `- [[${d}]]`).join("\n");
  for (const [name, days] of Object.entries(personDays)) zip.file(`Люди/${name}.md`, `# ${name}\n\nУпоминания в дневнике:\n\n${backlinks(days)}\n`);
  for (const [name, days] of Object.entries(placeDays)) zip.file(`Места/${name}.md`, `# ${name}\n\nУпоминания в дневнике:\n\n${backlinks(days)}\n`);

  zip.file("README.md", readme(userName, Object.keys(byDate).length, entries.length));

  return zip.generateAsync({ type: "uint8array" });
}
