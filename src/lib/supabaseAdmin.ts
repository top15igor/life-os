import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Серверный клиент Supabase с полным доступом (service_role).
// Создаётся лениво (при первом вызове), чтобы сборка не падала без ключей.
let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    // Берём только базовый адрес проекта (origin), отрезая любой хвост
    // вроде "/rest/v1/", пробелы и переводы строк.
    const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    let url = raw;
    try {
      url = new URL(raw).origin;
    } catch {
      url = raw.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    }
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
