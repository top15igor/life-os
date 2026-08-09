import { supabaseAdmin } from "./supabaseAdmin";

// Подсказка для Whisper: имена близких и названия проектов пользователя.
// Зачем: без подсказки распознавание ломает редкие имена собственные — «Эстельку»
// слышится как «стельку», и кривое имя уходит и в запись, и в пересказ, и в «Люди».
// Whisper принимает prompt (до ~224 токенов) и смещает расшифровку к этим написаниям.
//
// Берём то, что человек уже сам подтвердил своими записями: список «Люди» и проекты.

const TTL_MS = 10 * 60 * 1000; // список близких меняется редко, голосовые летят пачками
const MAX_CHARS = 450; // ~224 токена для кириллицы — запас, чтобы Whisper не обрезал
const cache = new Map<string, { at: number; hint: string }>();

export async function voiceHint(userId?: string): Promise<string | undefined> {
  if (!userId) return undefined;
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.hint || undefined;

  let names: string[] = [];
  try {
    const db = supabaseAdmin();
    const [ppl, prj] = await Promise.all([
      db.from("people").select("name").eq("user_id", userId).eq("hidden", false).limit(60),
      db.from("projects").select("name").eq("user_id", userId).limit(20),
    ]);
    names = [...((ppl.data as any[]) ?? []), ...((prj.data as any[]) ?? [])]
      .map((r) => String(r?.name || "").trim())
      .filter((n) => n.length >= 2 && n.length <= 40);
  } catch {
    // нет таблицы/колонки — просто расшифровываем без подсказки
  }

  const uniq = [...new Set(names)];
  let hint = "";
  if (uniq.length) {
    const list: string[] = [];
    let len = 0;
    for (const n of uniq) {
      if (len + n.length + 2 > MAX_CHARS) break;
      list.push(n);
      len += n.length + 2;
    }
    // Формат «как будто предыдущий кусок расшифровки» — так Whisper и задуман.
    hint = `Личный дневник. Имена и названия, которые могут звучать в записи: ${list.join(", ")}.`;
  }

  cache.set(userId, { at: Date.now(), hint });
  return hint || undefined;
}

// Список изменился (переименовали человека, добавили проект) — сбрасываем кэш,
// чтобы следующее голосовое уже слышало новое имя.
export function resetVoiceHint(userId: string) {
  cache.delete(userId);
}
