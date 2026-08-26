// Ключ к картам Apple.
//
// MapKit JS не работает по обычному ключу: браузер должен предъявить
// подписанный токен, который живёт недолго и выдаётся нашим сервером. Так
// приватный ключ Apple (.p8) никогда не покидает сервер — в отличие от
// ключей Google или Mapbox, которые приходится класть прямо в страницу.
//
// Нужны три переменные окружения:
//   MAPKIT_KEY_ID      — 10 знаков, идентификатор ключа из кабинета Apple
//   MAPKIT_TEAM_ID     — 10 знаков, идентификатор команды разработчика
//   MAPKIT_PRIVATE_KEY — содержимое файла .p8 (можно с \n вместо переносов)

import { createSign, createPrivateKey } from "crypto";

const TTL = 30 * 60; // полчаса: MapKit сам попросит новый, когда этот истечёт

export function mapkitConfigured(): boolean {
  return Boolean(process.env.MAPKIT_KEY_ID && process.env.MAPKIT_TEAM_ID && process.env.MAPKIT_PRIVATE_KEY);
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input as any).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// В настройках хостинга перенос строки часто хранится как «\n» — возвращаем
// ключу нормальный вид, иначе разбор упадёт.
function pemOf(raw: string): string {
  const s = raw.trim().replace(/\\n/g, "\n");
  if (s.includes("BEGIN")) return s;
  return `-----BEGIN PRIVATE KEY-----\n${s}\n-----END PRIVATE KEY-----`;
}

export function mapkitToken(origin?: string): string | null {
  if (!mapkitConfigured()) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "ES256", kid: process.env.MAPKIT_KEY_ID, typ: "JWT" };
    const payload: Record<string, any> = { iss: process.env.MAPKIT_TEAM_ID, iat: now, exp: now + TTL };
    // Привязка к домену — чтобы чужой сайт не тратил нашу квоту. На http
    // (локальный просмотр) Apple такую привязку не принимает, поэтому там её нет.
    if (origin && origin.startsWith("https://")) payload.origin = origin;

    const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
    const key = createPrivateKey(pemOf(process.env.MAPKIT_PRIVATE_KEY as string));
    // ieee-p1363 — «сырая» подпись R||S, которую ждёт JWT (по умолчанию Node
    // отдаёт DER, и Apple такой токен молча отвергает).
    const sig = createSign("SHA256").update(signingInput).sign({ key, dsaEncoding: "ieee-p1363" });
    return `${signingInput}.${b64url(sig)}`;
  } catch (e) {
    console.error("mapkit token", e);
    return null;
  }
}
