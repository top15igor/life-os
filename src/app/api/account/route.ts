import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const OWNER = "00000000-0000-0000-0000-000000000000";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.action !== "delete") return NextResponse.json({ ok: false }, { status: 400 });

  const db = supabaseAdmin();
  const uid = user.id;

  try {
    const { data: ents } = await db.from("entries").select("id").eq("user_id", uid);
    const ids = (ents || []).map((e) => e.id);
    if (ids.length) {
      for (const tbl of ["entry_categories", "entry_tags", "entry_people", "entry_projects", "entry_places", "attachments", "entry_links"]) {
        try { await db.from(tbl).delete().in("entry_id", ids); } catch {}
      }
    }
    for (const tbl of [
      "tasks", "insights", "gratitude",
      "finance_tx", "finance_budget", "finance_settings", "finance_categories", "finance_goals", "finance_recurring",
      "entries", "goals", "projects", "tags", "people", "places", "experiments",
      "biographer_chats", "life_overview",
      // здоровье
      "health_metrics", "googlehealth_tokens", "weight_log", "weight_goal", "health_focus",
      "reminders", "calendar_links",
      // книги, вишлист, знания, сны, настроение
      "books", "book_quotes", "book_meta", "wishes", "saved_items", "dreams", "day_moods",
      // память, путешествия, люди-CRM, капсулы, наследие
      "memories", "trips", "trip_dismissed", "promises", "good_deeds",
      "time_capsules", "heirs", "paths", "public_pages", "public_profile",
      // банки и сервисные данные
      "bank_monobank", "bank_abank", "anticipations", "relay_aliases", "companion_messages",
      "pmf_asks", "pmf_responses", "tester_reports", "tester_bugs", "feedback",
      "push_log", "usage", "telegram_users",
    ]) {
      try { await db.from(tbl).delete().eq("user_id", uid); } catch {}
    }
    // Пересылки сообщений — по обеим сторонам.
    try { await db.from("message_relays").delete().eq("from_user", uid); } catch {}
    try { await db.from("message_relays").delete().eq("to_user", uid); } catch {}

    // Файлы в хранилище (фото «Памяти», картинки знаний, сны, голосовые) лежат
    // в папке <user_id>/ каждого бакета — вычищаем и их.
    for (const bucket of ["memories", "saved", "dreams", "voices"]) {
      try {
        for (let page = 0; page < 50; page++) {
          const { data: files } = await db.storage.from(bucket).list(uid, { limit: 100 });
          if (!files?.length) break;
          await db.storage.from(bucket).remove(files.map((f: any) => `${uid}/${f.name}`));
          if (files.length < 100) break;
        }
      } catch {}
    }

    // Владельца не удаляем как пользователя (иначе сломается админка) — только его данные.
    if (uid !== OWNER) await db.from("users").delete().eq("id", uid);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
