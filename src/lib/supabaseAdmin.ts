import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Серверный клиент Supabase с полным доступом (service_role).
// Создаётся лениво (при первом вызове), чтобы сборка не падала без ключей.
let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!_client) {
    // Обрезаем случайные пробелы/переводы строк и слэш в конце адреса.
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
