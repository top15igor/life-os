import { supabaseAdmin } from "./supabaseAdmin";

// Что человек в этом разделе уже освоил.
//
// Подсказка «подключи Fitbit» человеку, у которого Fitbit подключён неделю
// назад, выглядит так, будто приложение его не замечает. Здесь дешёвые
// проверки: есть ли хоть одна запись нужного вида. Считаем только то, что
// нужно текущему разделу, — один-два запроса на страницу.

export type DoneKey =
  | "voice" | "notes" | "lists" | "reminders" | "knowledge" | "memory"
  | "wishlist" | "books" | "goals" | "trips" | "health" | "people" | "tasks" | "finance";

type Check = (userId: string) => Promise<boolean>;

// «Есть хотя бы одна строка» — самый дешёвый вопрос к базе: без данных, только счёт.
// Форма запроса такая же, как в уже работающих подсчётах (lib/book.ts).
function any(table: string, tune?: (q: any) => any): Check {
  return async (userId: string) => {
    try {
      let q = supabaseAdmin().from(table).select("*", { count: "exact", head: true }).eq("user_id", userId);
      if (tune) q = tune(q);
      const { count } = await q;
      return (count || 0) > 0;
    } catch {
      // Нет таблицы или база молчит — считаем, что не освоено: лучше показать
      // лишнюю подсказку, чем спрятать нужную.
      return false;
    }
  };
}

const CHECKS: Record<DoneKey, Check> = {
  voice: any("entries", (q) => q.eq("source", "telegram_voice")),
  notes: any("notes"),
  lists: any("list_items"),
  reminders: any("reminders"),
  knowledge: any("saved_items"),
  memory: any("memories"),
  wishlist: any("wishes"),
  books: any("books"),
  goals: any("goals"),
  trips: any("trips"),
  health: any("health_metrics"),
  people: any("people"),
  tasks: any("tasks"),
  finance: any("finance_tx"),
};

/** Какие из перечисленных умений у человека уже есть. */
export async function doneKeys(userId: string, keys: DoneKey[]): Promise<Set<DoneKey>> {
  const uniq = [...new Set(keys)];
  if (!uniq.length) return new Set();
  const results = await Promise.all(uniq.map((k) => CHECKS[k](userId).catch(() => false)));
  return new Set(uniq.filter((_, i) => results[i]));
}
