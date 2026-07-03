import { supabaseAdmin } from "./supabaseAdmin";
import { type Analysis, EXPENSE_CAT_KEYS, INCOME_CAT_KEYS, FINANCE_CURRENCIES } from "./ai";
import { embedToVectorString } from "./embeddings";

export async function saveEntry(opts: {
  userId: string;
  raw_text: string;
  source: string;
  analysis: Analysis;
  entry_date?: string; // местная дата клиента YYYY-MM-DD (иначе дефолт БД = UTC)
  entry_time?: string; // местное время клиента HH:MM[:SS]
}) {
  const db = supabaseAdmin();
  const owner = opts.userId;
  const a = opts.analysis;

  // Время записи: если клиент не передал (бот/сервер) — берём из сохранённой
  // таймзоны пользователя (tz_offset, минуты к UTC). Иначе остаётся дефолт БД (UTC).
  let entry_date = opts.entry_date;
  let entry_time = opts.entry_time;
  if (!entry_date || !entry_time) {
    try {
      const { data: u } = await db.from("users").select("tz_offset").eq("id", owner).maybeSingle();
      const off = (u as any)?.tz_offset;
      if (typeof off === "number") {
        const local = new Date(Date.now() + off * 60000);
        const pad = (n: number) => String(n).padStart(2, "0");
        if (!entry_date) entry_date = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
        if (!entry_time) entry_time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
      }
    } catch {
      // нет колонки tz_offset — оставляем дефолт БД
    }
  }

  const { data: entry, error } = await db
    .from("entries")
    .insert({
      user_id: owner,
      raw_text: opts.raw_text,
      source: opts.source,
      ...(entry_date ? { entry_date } : {}),
      ...(entry_time ? { entry_time } : {}),
      summary: a.summary ?? null,
      focus: a.focus ?? null,
      mood: a.mood ?? null,
      energy: a.energy ?? null,
      health: a.health ?? null,
      importance: a.importance ?? null,
      sleep_hours: a.sleep_hours ?? null,
      weight: a.weight ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Семантическая память: эмбеддинг записи для поиска по смыслу (best-effort,
  // не ломает сохранение, если pgvector/колонки ещё нет).
  try {
    const vec = await embedToVectorString(`${a.summary ? a.summary + ". " : ""}${opts.raw_text}`);
    if (vec) await db.from("entries").update({ embedding: vec }).eq("id", entry.id);
  } catch {
    // нет колонки embedding / ключа — пропускаем
  }

  const derived = await attachDerived(owner, entry.id, a, entry.entry_date);
  return { ...entry, financeSaved: derived.financeSaved, financeError: derived.financeError };
}

// Привязать производные данные (категории/теги/люди/задачи/дела/обещания…) к записи.
// Возвращает результат записи финансов, чтобы бот мог честно подтвердить операции.
export async function attachDerived(owner: string, id: string, a: Analysis, day?: string): Promise<{ financeSaved: number; financeError: string | null }> {
  const db = supabaseAdmin();
  let financeSaved = 0;
  let financeError: string | null = null;

  if (a.categories?.length) {
    const { data: cs } = await db.from("categories").select("id,slug").in("slug", a.categories);
    if (cs?.length) await db.from("entry_categories").insert(cs.map((c) => ({ entry_id: id, category_id: c.id })));
  }

  await linkNames(owner, "tags", "entry_tags", "tag_id", a.tags, id);
  await linkNames(owner, "people", "entry_people", "person_id", a.people, id);
  await linkNames(owner, "places", "entry_places", "place_id", a.places, id);
  await linkNames(owner, "projects", "entry_projects", "project_id", a.projects, id);

  if (a.tasks?.length) await db.from("tasks").insert(a.tasks.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.insights?.length) await db.from("insights").insert(a.insights.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.gratitude?.length) await db.from("gratitude").insert(a.gratitude.map((t) => ({ entry_id: id, user_id: owner, text: t })));
  if (a.good_deeds?.length) {
    const rows = a.good_deeds
      .map((d: any) => (typeof d === "string" ? { text: d } : d))
      .filter((d: any) => d?.text)
      .map((d: any) => ({ entry_id: id, user_id: owner, text: d.text, kind: d.kind ?? null, person: d.person ?? null }));
    if (rows.length) await db.from("good_deeds").insert(rows);
  }
  if (a.promises?.length) {
    const rows = a.promises
      .map((p: any) => (typeof p === "string" ? { text: p } : p))
      .filter((p: any) => p?.text)
      .map((p: any) => ({ entry_id: id, user_id: owner, text: p.text, person: p.person ?? null, status: "active" }));
    if (rows.length) await db.from("promises").insert(rows);
  }
  if (a.dreams?.length) {
    const rows = a.dreams
      .map((d: any) => (typeof d === "string" ? { text: d } : d))
      .filter((d: any) => d?.text)
      .map((d: any) => ({ entry_id: id, user_id: owner, text: d.text, sphere: d.sphere ?? "other", emoji: d.emoji ?? null, status: "dream" }));
    if (rows.length) await db.from("dreams").insert(rows);
  }
  if (a.finance?.length) {
    const txDay = /^\d{4}-\d{2}-\d{2}$/.test(day || "") ? (day as string) : new Date().toISOString().slice(0, 10);
    // Дефолт для операций с неясной валютой — базовая валюта пользователя (или самая
    // частая из его операций, иначе гривна). Раньше молча ставился USD и раздувал
    // баланс не-долларовых юзеров (напр. исландские кроны → доллары, ×~150).
    let baseCur = "UAH";
    try {
      const { data: fs } = await db.from("finance_settings").select("base_currency").eq("user_id", owner).maybeSingle();
      if ((fs as any)?.base_currency && FINANCE_CURRENCIES.includes((fs as any).base_currency)) {
        baseCur = (fs as any).base_currency;
      } else {
        const { data: prev } = await db.from("finance_tx").select("currency").eq("user_id", owner).limit(200);
        const cnt: Record<string, number> = {};
        for (const p of prev || []) if ((p as any).currency) cnt[(p as any).currency] = (cnt[(p as any).currency] || 0) + 1;
        const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (top) baseCur = top;
      }
    } catch {}
    // Пользовательские категории (вариант А): их slug тоже валидны при сохранении.
    const customExpense = new Set<string>();
    const customIncome = new Set<string>();
    try {
      const { data: cc } = await db.from("finance_categories").select("slug, kind").eq("user_id", owner).limit(100);
      for (const c of (cc as any[]) || []) if (c?.slug) (c.kind === "income" ? customIncome : customExpense).add(c.slug);
    } catch {}
    const rows = a.finance
      .filter((f) => f && (f.kind === "income" || f.kind === "expense") && Number(f.amount) > 0)
      .map((f) => {
        const kind = f.kind;
        const allowed = kind === "income" ? INCOME_CAT_KEYS : EXPENSE_CAT_KEYS;
        const custom = kind === "income" ? customIncome : customExpense;
        const category = f.category && (allowed.includes(f.category) || custom.has(f.category)) ? f.category : "other";
        const currency = f.currency && FINANCE_CURRENCIES.includes(f.currency) ? f.currency : baseCur;
        // Возвращаем итоговую валюту в исходный объект: бот показывает подтверждение по
        // analysis.finance, и без этого символ в сообщении (напр. $) расходился с сохранённым (€).
        f.currency = currency;
        return { entry_id: id, user_id: owner, day: txDay, kind, amount: Number(f.amount), currency, category, note: f.note ? String(f.note).slice(0, 200) : null };
      });
    // Дедуп извлечённых AI операций: НЕ плодим повторную запись, если такая же
    // (день + тип + сумма + валюта + категория) уже есть в кошельке. Такое бывает, когда
    // трату уже занесли вручную/через /spend/из прошлой записи, а пользователь упомянул её
    // снова — в т.ч. в вопросе-претензии «а почему сегодняшнюю трату не учёл?!». Раньше бот
    // молча задваивал одни и те же деньги. Ручной ввод (/spend, веб) идёт мимо этого пути,
    // поэтому осознанные одинаковые траты им не мешаем.
    const finKey = (r: { kind: string; amount: number | string; currency: string; category: string | null }) =>
      `${r.kind}|${Number(r.amount)}|${r.currency}|${r.category ?? ""}`;
    const existingKeys = new Set<string>();
    if (rows.length) {
      try {
        const { data: sameDay } = await db
          .from("finance_tx")
          .select("kind,amount,currency,category")
          .eq("user_id", owner)
          .eq("day", txDay);
        for (const t of sameDay || []) existingKeys.add(finKey(t as any));
      } catch {
        // не смогли прочитать существующие — вставим как есть (лучше дубль, чем потерять трату)
      }
    }
    const seenKeys = new Set<string>();
    const fresh = rows.filter((r) => {
      const k = finKey(r);
      if (existingKeys.has(k) || seenKeys.has(k)) return false; // уже учтено — пропускаем дубль
      seenKeys.add(k);
      return true;
    });
    if (fresh.length) {
      let { error: finErr } = await db.from("finance_tx").insert(fresh);
      // Старая схема без колонки entry_id — повторяем вставку без неё.
      if (finErr && /entry_id|column|schema cache/i.test(finErr.message)) {
        const bare = fresh.map(({ entry_id, ...rest }) => rest);
        ({ error: finErr } = await db.from("finance_tx").insert(bare));
      }
      if (finErr) { financeError = finErr.message; console.error("finance insert failed", finErr); }
      else financeSaved = fresh.length;
    }
    // Все операции оказались дублями уже записанных — деньги в кошельке корректны, это НЕ ошибка.
    if (rows.length && !fresh.length && !financeError) financeSaved = rows.length;
  }
  return { financeSaved, financeError };
}

// Удалить все производные данные записи (для пере-разбора при правке или для удаления записи).
export async function clearDerived(id: string) {
  const db = supabaseAdmin();
  for (const tbl of ["entry_categories", "entry_tags", "entry_people", "entry_places", "entry_projects"]) {
    try { await db.from(tbl).delete().eq("entry_id", id); } catch {}
  }
  for (const tbl of ["tasks", "insights", "gratitude", "good_deeds", "promises", "finance_tx"]) {
    try { await db.from(tbl).delete().eq("entry_id", id); } catch {}
  }
}

// Нормализованный ключ имени: без регистра, пробелов, дефисов/слэшей и пунктуации,
// ё=е. Нужен, чтобы «LIFE OS», «Life OS», «LifeOS», «life-os» считались одним проектом
// и не плодили дубли-карточки.
function normKey(s: string): string {
  return (s || "").toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, "");
}

async function linkNames(
  owner: string,
  table: string,
  linkTable: string,
  fk: string,
  names: string[] | undefined,
  entryId: string
) {
  if (!names?.length) return;
  const db = supabaseAdmin();
  const clean = [...new Set(names.map((n) => (n || "").trim()).filter(Boolean))];
  if (!clean.length) return;

  // Уже существующие сущности пользователя — чтобы переиспользовать их по нормализованному
  // ключу вместо создания дубля (авто-дедуп проектов/людей/тегов/мест).
  let existing: { id: string; name: string }[] = [];
  try {
    const { data } = await db.from(table).select("id,name").eq("user_id", owner);
    existing = (data as any[]) ?? [];
  } catch {
    // таблица без нужных колонок — падать не будем, пойдём по старому пути upsert
  }
  const byKey = new Map<string, string>(); // normKey -> id
  for (const r of existing) {
    const k = normKey(r.name);
    if (k && !byKey.has(k)) byKey.set(k, r.id);
  }

  const ids: string[] = [];
  const toCreate: string[] = [];
  const seen = new Set<string>();
  for (const name of clean) {
    const k = normKey(name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const hit = byKey.get(k);
    if (hit) ids.push(hit);
    else toCreate.push(name);
  }

  if (toCreate.length) {
    const { data: created } = await db
      .from(table)
      .upsert(toCreate.map((name) => ({ user_id: owner, name })), { onConflict: "user_id,name" })
      .select("id");
    for (const r of (created as any[]) ?? []) ids.push(r.id);
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length) {
    await db.from(linkTable).insert(uniqueIds.map((rid) => ({ entry_id: entryId, [fk]: rid })));
  }
}
