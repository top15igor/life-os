import JSZip from "jszip";
import { supabaseAdmin } from "./supabaseAdmin";

// ===== Еженедельный автодамп ВСЕЙ базы (все пользователи, все таблицы). =====
// Зачем: в коде нет автобэкапов БД, а на бесплатном тарифе Supabase их нет и
// у провайдера — данные людей зависели от одного сервиса. Дамп собирает все
// таблицы в .zip (по JSON-файлу на таблицу) и уходит владельцу в Telegram по
// воскресеньям (крон) или по ручному триггеру /api/cron?dbdump=<секрет>.
// Восстановление: JSON вставляется обратно в Supabase (insert) таблица за таблицей.

// Список таблиц ведём руками (PostgREST не умеет «покажи все таблицы»).
// Отсутствующая таблица не роняет дамп — попадает в skipped в _meta.json.
const TABLES = [
  "users", "entries", "categories", "tags", "people", "places", "projects",
  "entry_categories", "entry_tags", "entry_people", "entry_places", "entry_projects",
  "tasks", "insights", "gratitude", "good_deeds", "promises", "dreams", "goals",
  "experiments", "biographer_chats", "companion_messages", "life_overview",
  "finance_tx", "finance_budget", "finance_settings", "finance_categories", "bank_monobank",
  "reminders", "calendar_links", "google_tokens", "saved_items", "books", "book_quotes",
  "wishes", "message_relays", "relay_aliases", "memories", "public_profile",
  "anticipations", "admin_tasks", "time_capsules", "day_moods", "trips", "heirs",
  "acquaint_answers", "voice_archive", "health_daily", "weights", "push_log",
  "ai_usage", "good_news", "pmf_answers", "tester_reports", "tester_bugs",
];

const PAGE = 1000;      // страница выборки PostgREST
const MAX_ROWS = 100000; // предохранитель на таблицу — при переросте дамп честно помечает обрезку

export type DbDumpResult = { zip: Uint8Array; tables: number; rows: number; skipped: string[]; truncated: string[] };

export async function buildDbDumpZip(): Promise<DbDumpResult> {
  const db = supabaseAdmin();
  const zip = new JSZip();
  const skipped: string[] = [];
  const truncated: string[] = [];
  let tables = 0;
  let rows = 0;

  for (const t of TABLES) {
    try {
      const all: any[] = [];
      for (let from = 0; from < MAX_ROWS; from += PAGE) {
        const { data, error } = await db.from(t).select("*").range(from, from + PAGE - 1);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < PAGE) break;
      }
      if (all.length >= MAX_ROWS) truncated.push(t);
      zip.file(`${t}.json`, JSON.stringify(all));
      tables++;
      rows += all.length;
    } catch {
      skipped.push(t); // таблицы нет (миграция не применена) — не страшно
    }
  }

  zip.file("_meta.json", JSON.stringify({
    created_at: new Date().toISOString(),
    tables, rows, skipped, truncated,
    note: "LIFE OS full DB dump. Restore: insert each <table>.json back into Supabase.",
  }, null, 2));

  const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return { zip: buf, tables, rows, skipped, truncated };
}
