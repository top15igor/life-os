// Проверка ссылки перед тем, как сервер сам по ней сходит.
//
// Человек присылает боту ссылку на товар — сервер идёт по ней и вытаскивает
// карточку. Если ссылку подсунуть хитрую (http://127.0.0.1/..., адрес внутри
// облака, file://), сервер сходит туда от своего имени и вернёт содержимое
// в чат. Это классическая дыра SSRF. Пускаем только обычные внешние http(s).

const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "::1", "metadata.google.internal", "169.254.169.254"]);

function isPrivateIp(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // облачные метаданные
  return false;
}

export function isSafeExternalUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(String(raw || "").trim());
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host)) return false;
  if (host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return false;
  if (isPrivateIp(host)) return false;
  if (host.startsWith("fd") || host.startsWith("fe80:")) return false; // локальный IPv6
  return true;
}
