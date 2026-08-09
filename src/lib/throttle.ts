// Ограничение попыток входа.
//
// Пароль хранится честно (scrypt с солью), но без ограничения можно просто
// перебирать: тысяча запросов в минуту — и слабый пароль подобран. Считаем
// попытки в памяти процесса: на Vercel он живёт между запросами, и этого
// достаточно, чтобы перебор стал бессмысленным по времени.
//
// Память не общая на все копии сервера — значит, это не крепость, а замок на
// двери. Нужна крепость — считать в базе; пока не нужно.

type Bucket = { count: number; until: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 10;

// Чтобы карта не росла бесконечно на долгоживущем процессе.
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) if (b.until < now) buckets.delete(k);
}

// true — пускаем, false — слишком часто.
export function allowAttempt(key: string): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.until < now) {
    buckets.set(key, { count: 1, until: now + WINDOW_MS });
    return true;
  }
  b.count += 1;
  return b.count <= MAX_TRIES;
}

// Успешный вход обнуляет счётчик: человек, который вспомнил пароль с пятой
// попытки, не должен потом сидеть под замком.
export function clearAttempts(key: string) {
  buckets.delete(key);
}

// Кто стучится. За Vercel настоящий адрес приходит заголовком.
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}
