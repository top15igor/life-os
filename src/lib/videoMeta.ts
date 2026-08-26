// Координаты и время съёмки ВИДЕО.
//
// У видео нет EXIF: mp4 и mov — это дерево «атомов», и место съёмки айфон
// пишет в атом «©xyz» строкой стандарта ISO 6709 («+43.4832-001.5586+021.0/»).
// Время лежит в атоме mvhd, где отсчёт идёт от 1904 года.
//
// Дерево мы не обходим: ищем метки прямо по байтам. Для наших двух чисел это
// надёжнее (у разных камер разная вложенность) и заметно короче.

export type VideoMeta = { lat: number | null; lng: number | null; shotAt: string | null };

const EMPTY: VideoMeta = { lat: null, lng: null, shotAt: null };

// 1904-01-01 → 1970-01-01 в секундах.
const MAC_EPOCH_DIFF = 2082844800;

function parseIso6709(s: string): { lat: number; lng: number } | null {
  // «+43.4832-001.5586+021.000/» — знак обязателен у обоих чисел.
  const m = /^([+-]\d{1,3}(?:\.\d+)?)([+-]\d{1,3}(?:\.\d+)?)/.exec((s || "").trim());
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null; // «GPS не поймал»
  return { lat, lng };
}

function findGeo(buf: Buffer): { lat: number; lng: number } | null {
  const tag = Buffer.from([0xa9, 0x78, 0x79, 0x7a]); // ©xyz
  let from = 0;
  for (let guard = 0; guard < 8; guard++) {
    const at = buf.indexOf(tag, from);
    if (at < 0) return null;
    from = at + 4;
    // [размер 4][©xyz][длина строки 2][язык 2][строка]
    if (at + 8 > buf.length) return null;
    const len = buf.readUInt16BE(at + 4);
    const start = at + 8;
    if (len > 0 && len < 64 && start + len <= buf.length) {
      const geo = parseIso6709(buf.toString("latin1", start, start + len));
      if (geo) return geo;
    }
  }
  return null;
}

function findShotAt(buf: Buffer): string | null {
  const tag = Buffer.from("mvhd", "latin1");
  const at = buf.indexOf(tag);
  if (at < 0 || at + 20 > buf.length) return null;
  try {
    const version = buf.readUInt8(at + 4);
    let secs: number;
    if (version === 1) {
      // 64-разрядное время: старшие четыре байта у бытовых камер всегда нули.
      secs = Number(buf.readBigUInt64BE(at + 8));
    } else {
      secs = buf.readUInt32BE(at + 8);
    }
    const unix = secs - MAC_EPOCH_DIFF;
    // Отсекаем мусор: до 1990-го и «завтра» настоящих съёмок не бывает.
    if (!Number.isFinite(unix) || unix < 631152000 || unix > Date.now() / 1000 + 86400) return null;
    return new Date(unix * 1000).toISOString();
  } catch {
    return null;
  }
}

export function readVideoMeta(buf: Buffer): VideoMeta {
  try {
    const geo = findGeo(buf);
    return { lat: geo?.lat ?? null, lng: geo?.lng ?? null, shotAt: findShotAt(buf) };
  } catch {
    return EMPTY;
  }
}

// Ролик на телефоне легко весит сотню мегабайт, и втягивать его целиком в
// память сервера ради двух чисел нельзя. Метаданные лежат либо в начале файла,
// либо в самом конце (там, где камера дописала moov), поэтому читаем два
// кусочка по краям — этого хватает.
const EDGE = 3 * 1024 * 1024;

export async function readVideoMetaFromUrl(url: string, size?: number): Promise<VideoMeta> {
  const parts: Buffer[] = [];
  const grab = async (range: string) => {
    try {
      const r = await fetch(url, { headers: { Range: range } });
      if (!r.ok && r.status !== 206) return;
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length) parts.push(b);
    } catch {}
  };
  await grab(`bytes=0-${EDGE - 1}`);
  if (!size || size > EDGE) await grab(`bytes=-${EDGE}`);
  for (const p of parts) {
    const m = readVideoMeta(p);
    if (m.lat !== null || m.shotAt) return m;
  }
  return EMPTY;
}
