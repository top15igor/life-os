#!/usr/bin/env node
// ============================================================
// LIFE OS Photo Scout — локальный разведчик фотоархива.
//
// Запускается НА машине человека (Mac, мини-ПК, позже — Docker на
// Synology) и сканирует папку с фотографиями. Наружу уходят ТОЛЬКО:
//   - миниатюра (JPEG ~512px, ~50-100 КБ),
//   - EXIF (дата съёмки, GPS, камера, размеры),
//   - хэши (sha256 для точных дублей, dHash для похожих).
// Оригиналы никогда не покидают машину. Разведчик открывает файлы
// только на чтение — кода изменения или удаления здесь нет вообще.
//
// Запуск:
//   node scan.mjs --dir "/путь/к/фото" --token XXXX [--api https://...]
//
// Можно прерывать и запускать снова: список уже отправленных файлов
// хранится в scout/.state/, а сервер в любом случае принимает
// повторы безвредно (upsert).
// ============================================================

import { createHash } from "crypto";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import sharp from "sharp";
import exifr from "exifr";

const execFileP = promisify(execFile);

// ---------- аргументы ----------
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[++i] : "true";
}
const DIR = args.dir;
const TOKEN = args.token || process.env.LIFEOS_SCOUT_TOKEN;
const API = (args.api || process.env.LIFEOS_API || "https://mylifebookai.vercel.app").replace(/\/$/, "");
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity; // для пробных прогонов

if (!DIR || !TOKEN) {
  console.log("Использование: node scan.mjs --dir \"/путь/к/фото\" --token XXXX [--api https://...] [--limit 100]");
  process.exit(1);
}

// Расширения, которые считаем фотографиями. HEIC (iPhone) конвертируем
// системной командой sips — она есть на каждом Mac.
const PHOTO_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "tif", "tiff", "heic", "heif"]);
const VIDEO_EXT = new Set(["mp4", "mov", "avi", "mkv", "m4v", "3gp", "webm"]);

// ---------- состояние (возобновляемость) ----------
const stateDir = path.join(path.dirname(new URL(import.meta.url).pathname), ".state");
const stateKey = createHash("sha256").update(`${DIR}|${TOKEN.slice(0, 8)}`).digest("hex").slice(0, 16);
const stateFile = path.join(stateDir, `${stateKey}.json`);
let done = new Set();
try {
  done = new Set(JSON.parse(await fs.readFile(stateFile, "utf8")));
} catch {}
async function saveState() {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify([...done]));
}

// ---------- обход папки ----------
async function* walk(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // нет доступа — пропускаем
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue; // служебное и скрытое
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

// ---------- обработка одного файла ----------
async function readImageBuffer(full, ext) {
  if (ext === "heic" || ext === "heif") {
    // sharp из коробки HEIC не читает; на macOS выручает системный sips.
    if (os.platform() !== "darwin") return null;
    const tmp = path.join(os.tmpdir(), `lifeos-scout-${Date.now()}.jpg`);
    try {
      await execFileP("sips", ["-s", "format", "jpeg", full, "--out", tmp], { timeout: 30000 });
      const buf = await fs.readFile(tmp);
      await fs.unlink(tmp).catch(() => {});
      return buf;
    } catch {
      await fs.unlink(tmp).catch(() => {});
      return null;
    }
  }
  return fs.readFile(full);
}

// dHash 8x9 → 64 бита похожести: близкие кадры дают близкие хэши.
async function dHash(img) {
  try {
    const raw = await img.clone().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
    let bits = "";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += raw[y * 9 + x] > raw[y * 9 + x + 1] ? "1" : "0";
    return BigInt("0b" + bits).toString(16).padStart(16, "0");
  } catch {
    return null;
  }
}

async function processFile(full) {
  const rel = path.relative(DIR, full);
  const ext = path.extname(full).slice(1).toLowerCase();
  const st = await fs.stat(full);

  const orig = await fs.readFile(full);
  const sha256 = createHash("sha256").update(orig).digest("hex");

  // EXIF читаем из оригинала (в т.ч. HEIC — exifr его понимает).
  let exif = null;
  try {
    exif = await exifr.parse(orig, { gps: true, translateValues: true });
  } catch {}

  const imgBuf = ext === "heic" || ext === "heif" ? await readImageBuffer(full, ext) : orig;
  if (!imgBuf) return { skip: `не удалось прочитать (${ext})` };

  const img = sharp(imgBuf, { failOn: "none" });
  let meta = {};
  try {
    meta = await img.metadata();
  } catch {
    return { skip: "не картинка" };
  }

  const thumb = await img.clone().rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
  const phash = await dHash(img);

  // Дата: EXIF → дата файла (принцип из ТЗ: имени файла не доверяем).
  const captured = exif?.DateTimeOriginal || exif?.CreateDate || st.mtime;

  return {
    item: {
      path: rel,
      file_name: path.basename(full),
      ext,
      file_size: st.size,
      mime_type: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
      captured_at: captured instanceof Date && !isNaN(captured) ? captured.toISOString() : null,
      gps_lat: typeof exif?.latitude === "number" ? exif.latitude : null,
      gps_lng: typeof exif?.longitude === "number" ? exif.longitude : null,
      camera_make: exif?.Make ? String(exif.Make).slice(0, 60) : null,
      camera_model: exif?.Model ? String(exif.Model).slice(0, 60) : null,
      width: meta.width || null,
      height: meta.height || null,
      sha256,
      phash,
      thumb_b64: thumb.toString("base64"),
    },
  };
}

// ---------- отправка пачками ----------
async function sendBatch(batch) {
  const r = await fetch(`${API}/api/photos/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-scout-token": TOKEN },
    body: JSON.stringify({ photos: batch }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    // Сервер может ответить целой HTML-страницей — человеку нужна одна строка.
    throw new Error(`API ${r.status}: ${txt.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)}`);
  }
  return r.json();
}

// ---------- главный цикл ----------
console.log(`LIFE OS Photo Scout\nПапка: ${DIR}\nСервер: ${API}\nУже отправлено ранее: ${done.size}\n`);

let found = 0, sent = 0, skipped = 0, videos = 0, errors = 0;
let batch = [];
const t0 = Date.now();

async function flush() {
  if (!batch.length) return;
  const items = batch;
  batch = [];
  try {
    const res = await sendBatch(items);
    sent += res.saved || 0;
    for (const it of items) done.add(it.path);
    await saveState();
  } catch (e) {
    errors += items.length;
    console.error(`  ! пачка не ушла: ${e.message}`);
  }
  const rate = sent / Math.max((Date.now() - t0) / 60000, 0.01);
  process.stdout.write(`\r  Найдено: ${found}  Отправлено: ${sent}  Пропущено: ${skipped}  Видео (позже): ${videos}  Ошибок: ${errors}  (~${Math.round(rate)}/мин)   `);
}

for await (const full of walk(DIR)) {
  const ext = path.extname(full).slice(1).toLowerCase();
  if (VIDEO_EXT.has(ext)) {
    videos++;
    continue;
  }
  if (!PHOTO_EXT.has(ext)) continue;
  found++;
  if (sent + skipped >= LIMIT) break;

  const rel = path.relative(DIR, full);
  if (done.has(rel)) {
    skipped++;
    continue;
  }
  try {
    const r = await processFile(full);
    if (r.item) batch.push(r.item);
    else skipped++;
  } catch (e) {
    errors++;
  }
  if (batch.length >= 15) await flush();
}
await flush();
await saveState();

console.log(`\n\nГотово за ${Math.round((Date.now() - t0) / 1000)} с.`);
console.log(`Фото найдено: ${found}, отправлено в индекс: ${sent}, пропущено: ${skipped}, видео отложено: ${videos}, ошибок: ${errors}.`);
console.log(`Оригиналы не изменялись (разведчик умеет только читать).`);
