// Локальное время пользователя по его таймзоне — для расписания пушей
// (час отправки, тихие дни, день недельного итога). Чистая функция, без БД.

// Минуты к UTC для пользователя: явный tz_offset (сохраняет веб-клиент) главнее,
// иначе выводим из IANA-зоны настроек пушей (morning_prefs.tz), иначе null (=UTC).
// Нужен боту для «напомни через 10 минут», «что у меня сегодня» и штампов дат.
export function userTzOffsetMin(tzOffset: number | null | undefined, tz: string | null | undefined): number | null {
  if (typeof tzOffset === "number" && isFinite(tzOffset)) return tzOffset;
  if (tz) {
    try {
      const v = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
        .formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value || "";
      if (v === "GMT" || v === "UTC") return 0;
      const m = v.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (m) return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0));
    } catch { /* невалидная зона */ }
  }
  return null;
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Возвращает локальные час (0–23), день недели (0=Вс…6=Сб) и дату-ключ (YYYY-MM-DD).
// Если таймзона не задана/невалидна — берём UTC.
export function localParts(tz: string | null | undefined, now: Date): { hour: number; weekday: number; dateKey: string } {
  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz, hour: "2-digit", hourCycle: "h23", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(now);
      const g = (t: string) => parts.find((p) => p.type === t)?.value || "";
      const wd = WD[g("weekday")];
      if (wd !== undefined) return { hour: parseInt(g("hour"), 10), weekday: wd, dateKey: `${g("year")}-${g("month")}-${g("day")}` };
    } catch {
      // невалидная таймзона → UTC ниже
    }
  }
  return { hour: now.getUTCHours(), weekday: now.getUTCDay(), dateKey: now.toISOString().slice(0, 10) };
}
