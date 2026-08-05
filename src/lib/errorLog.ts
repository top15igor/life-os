import { supabaseAdmin } from "./supabaseAdmin";

// Журнал сбоев.
//
// До этого ошибки уходили в console.error и растворялись в логах Vercel: узнать,
// что у пятерых людей вчера падала расшифровка голосовых, было неоткуда. Теперь
// каждый сбой оседает в базе — и агент-диагност может сказать не «где-то ошибка»,
// а «столько-то человек, вот такой шаг, началось тогда-то».
//
// Правила: функция НИКОГДА не бросает и не ждёт результата дольше необходимого —
// журнал не имеет права уронить обработку сообщения пользователя. Если таблицы
// нет (SQL не применён), всё продолжает работать, просто без истории.

export type ErrorMeta = { userId?: string | null; chatId?: number | null; detail?: string | null };

// Из сообщений об ошибках вычищаем то, что может оказаться личным: длинные
// куски текста записей в журнал не нужны, для диагноза хватает типа сбоя.
function short(s: unknown, max = 500): string {
  const t = typeof s === "string" ? s : (s as any)?.message ? String((s as any).message) : String(s);
  return t.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function logError(scope: string, err: unknown, meta?: ErrorMeta): Promise<void> {
  // В логи Vercel пишем всегда — это по-прежнему самый быстрый способ отладки.
  console.error(scope, err);
  try {
    const stack = (err as any)?.stack ? short((err as any).stack, 1500) : null;
    await supabaseAdmin().from("error_log").insert({
      scope: String(scope).slice(0, 60),
      message: short(err),
      stack,
      user_id: meta?.userId || null,
      chat_id: meta?.chatId ?? null,
      detail: meta?.detail ? short(meta.detail, 500) : null,
    });
  } catch { /* нет таблицы или база недоступна — молча, журнал не критичен */ }
}

export type ErrorGroup = { scope: string; message: string; n: number; users: number; first: string; last: string };

// Сводка за период для агента-диагноста: одинаковые сбои схлопываем в группы,
// потому что важно не «сто строк в логе», а «один баг, задел двенадцать человек».
export async function errorDigest(hours = 24, limit = 400): Promise<ErrorGroup[]> {
  try {
    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data } = await supabaseAdmin()
      .from("error_log").select("scope, message, user_id, created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(limit);

    const map = new Map<string, ErrorGroup & { userSet: Set<string> }>();
    for (const r of ((data as any[]) || [])) {
      // Ключ группы — область + начало сообщения: разные id и цифры внутри одного
      // и того же сбоя не должны плодить десяток «разных» ошибок.
      const key = `${r.scope}|${String(r.message || "").slice(0, 80)}`;
      let g = map.get(key);
      if (!g) {
        g = { scope: r.scope, message: String(r.message || "").slice(0, 200), n: 0, users: 0, first: r.created_at, last: r.created_at, userSet: new Set<string>() };
        map.set(key, g);
      }
      g.n++;
      if (r.user_id) g.userSet.add(r.user_id);
      if (r.created_at < g.first) g.first = r.created_at;
      if (r.created_at > g.last) g.last = r.created_at;
    }
    return [...map.values()]
      .map(({ userSet, ...g }) => ({ ...g, users: userSet.size }))
      .sort((a, b) => b.users - a.users || b.n - a.n);
  } catch {
    return [];
  }
}
