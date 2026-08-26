// Координаты и время съёмки из самого файла фотографии (EXIF).
//
// Зачем свой разбор, а не библиотека: нам нужны ровно три числа — широта,
// долгота и момент съёмки. Тащить ради них пакет на полмегабайта незачем.
//
// Как ищем. В JPEG данные EXIF лежат в блоке APP1, который начинается со
// строки "Exif\0\0"; в HEIC с айфона и в PNG тот же блок лежит внутри своих
// контейнеров, но выглядит точно так же. Поэтому мы просто находим эту метку
// в начале файла и дальше читаем стандартный TIFF-заголовок — один код на все
// форматы.
//
// ВАЖНО про Telegram: сжатое фото (обычная отправка картинкой) приходит БЕЗ
// EXIF — мессенджер вырезает метаданные. Координаты выживают, только если
// прислать снимок файлом («без сжатия») или загрузить его на сайте. Это не наш
// баг, это устройство Telegram; бот подсказывает про отправку файлом.

export type PhotoExif = { lat: number | null; lng: number | null; shotAt: string | null };

const EMPTY: PhotoExif = { lat: null, lng: null, shotAt: null };

// Метку EXIF ищем только в начале файла: дальше идут сами пиксели, и случайное
// совпадение байтов там вероятнее, чем настоящий заголовок.
const SCAN_LIMIT = 512 * 1024;

function findExifStart(buf: Buffer): number {
  const marker = Buffer.from("Exif\0\0", "latin1");
  const idx = buf.indexOf(marker, 0);
  if (idx < 0 || idx > SCAN_LIMIT) return -1;
  return idx + marker.length;
}

type Reader = {
  u16: (o: number) => number;
  u32: (o: number) => number;
  s32: (o: number) => number;
};

function readerFor(buf: Buffer, tiff: number): Reader | null {
  if (tiff + 8 > buf.length) return null;
  const order = buf.toString("latin1", tiff, tiff + 2);
  const le = order === "II";
  if (!le && order !== "MM") return null;
  return {
    u16: (o) => (o + 2 <= buf.length ? (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)) : 0),
    u32: (o) => (o + 4 <= buf.length ? (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o)) : 0),
    s32: (o) => (o + 4 <= buf.length ? (le ? buf.readInt32LE(o) : buf.readInt32BE(o)) : 0),
  };
}

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

type Entry = { tag: number; type: number; count: number; valueOffset: number };

// Одна папка тегов (IFD). Возвращаем сырые записи — значения читаем по месту,
// потому что у разных тегов разный тип.
function readIfd(buf: Buffer, r: Reader, tiff: number, ifd: number): Entry[] {
  const out: Entry[] = [];
  if (ifd + 2 > buf.length) return out;
  const count = r.u16(ifd);
  if (count > 512) return out; // мусор вместо заголовка
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > buf.length) break;
    out.push({ tag: r.u16(e), type: r.u16(e + 2), count: r.u32(e + 4), valueOffset: e + 8 });
  }
  return out;
}

// Где физически лежит значение тега: короткое (до 4 байт) хранится прямо в
// записи, длинное — по смещению от начала TIFF.
function dataOffset(buf: Buffer, r: Reader, tiff: number, e: Entry): number {
  const size = (TYPE_SIZE[e.type] || 0) * e.count;
  return size <= 4 ? e.valueOffset : tiff + r.u32(e.valueOffset);
}

function readAscii(buf: Buffer, r: Reader, tiff: number, e: Entry): string {
  if (e.type !== 2) return "";
  const at = dataOffset(buf, r, tiff, e);
  if (at < 0 || at + e.count > buf.length) return "";
  return buf.toString("latin1", at, at + e.count).replace(/\0.*$/, "").trim();
}

// Градусы/минуты/секунды тремя дробями → обычное число.
function readRationals(buf: Buffer, r: Reader, tiff: number, e: Entry, need: number): number[] | null {
  if (e.type !== 5 || e.count < need) return null;
  const at = dataOffset(buf, r, tiff, e);
  if (at < 0 || at + need * 8 > buf.length) return null;
  const out: number[] = [];
  for (let i = 0; i < need; i++) {
    const num = r.u32(at + i * 8);
    const den = r.u32(at + i * 8 + 4);
    if (!den) return null;
    out.push(num / den);
  }
  return out;
}

function dms(parts: number[], ref: string): number | null {
  const [d, m, s] = parts;
  if (![d, m, s].every((x) => Number.isFinite(x))) return null;
  let v = d + m / 60 + s / 3600;
  if (/^[SW]/i.test(ref)) v = -v;
  return v;
}

// "2026:08:26 19:04:11" — единственный формат времени в EXIF.
function exifDate(s: string): string | null {
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return null;
  const [, y, mo, d, h, mi, sec] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${sec}Z`;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

export function readExif(buf: Buffer): PhotoExif {
  try {
    const tiff = findExifStart(buf);
    if (tiff < 0) return EMPTY;
    const r = readerFor(buf, tiff);
    if (!r) return EMPTY;
    if (r.u16(tiff + 2) !== 42) return EMPTY; // подпись TIFF

    const ifd0 = tiff + r.u32(tiff + 4);
    if (ifd0 <= tiff || ifd0 > buf.length) return EMPTY;

    let gpsIfd = 0;
    let exifIfd = 0;
    for (const e of readIfd(buf, r, tiff, ifd0)) {
      if (e.tag === 0x8825) gpsIfd = tiff + r.u32(e.valueOffset);
      if (e.tag === 0x8769) exifIfd = tiff + r.u32(e.valueOffset);
    }

    let lat: number | null = null;
    let lng: number | null = null;
    if (gpsIfd > tiff && gpsIfd < buf.length) {
      let latRef = "N";
      let lngRef = "E";
      let latP: number[] | null = null;
      let lngP: number[] | null = null;
      for (const e of readIfd(buf, r, tiff, gpsIfd)) {
        if (e.tag === 0x0001) latRef = readAscii(buf, r, tiff, e) || "N";
        if (e.tag === 0x0002) latP = readRationals(buf, r, tiff, e, 3);
        if (e.tag === 0x0003) lngRef = readAscii(buf, r, tiff, e) || "E";
        if (e.tag === 0x0004) lngP = readRationals(buf, r, tiff, e, 3);
      }
      if (latP && lngP) {
        lat = dms(latP, latRef);
        lng = dms(lngP, lngRef);
      }
    }
    // Нулевые координаты — признак «GPS не поймал», а не точки в океане.
    if (lat === null || lng === null || (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001)) {
      lat = null;
      lng = null;
    }
    if (lat !== null && (Math.abs(lat) > 90 || Math.abs(lng as number) > 180)) {
      lat = null;
      lng = null;
    }

    let shotAt: string | null = null;
    for (const src of [exifIfd, ifd0]) {
      if (shotAt || src <= tiff || src >= buf.length) continue;
      for (const e of readIfd(buf, r, tiff, src)) {
        // 0x9003 — момент съёмки, 0x0132 — дата файла (запасной вариант).
        if (e.tag === 0x9003 || (e.tag === 0x0132 && !shotAt)) {
          const d = exifDate(readAscii(buf, r, tiff, e));
          if (d && e.tag === 0x9003) { shotAt = d; break; }
          if (d) shotAt = d;
        }
      }
    }

    return { lat, lng, shotAt };
  } catch {
    return EMPTY;
  }
}
