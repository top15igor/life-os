import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildFullExport } from "@/lib/fullExport";
import { listExportFiles, splitParts, type ExportFile } from "@/lib/exportFiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Полный экспорт всех данных пользователя — «забери всё своё».
//
// Без параметров — как раньше: один JSON со всеми записями.
// С ?files=1 — zip: тот же JSON плюс сами файлы (фото, документы, голосовые).
// Файлов может быть на сотни мегабайт, а запрос живёт минуту, поэтому архив
// режется на части: ?files=1&part=2. Список частей даёт /api/export/estimate.

const CONCURRENCY = 4; // качаем из хранилища по четыре — быстрее, но без шторма
const TIME_BUDGET_MS = 45_000; // остаток минуты оставляем на отдачу архива

async function addFiles(zip: JSZip, files: ExportFile[]): Promise<{ added: number; skipped: string[] }> {
  const db = supabaseAdmin();
  const started = Date.now();
  const skipped: string[] = [];
  let added = 0;
  let i = 0;

  async function worker() {
    while (i < files.length) {
      const f = files[i++];
      if (Date.now() - started > TIME_BUDGET_MS) {
        skipped.push(f.name);
        continue;
      }
      try {
        const { data, error } = await db.storage.from(f.bucket).download(f.path);
        if (error || !data) {
          skipped.push(f.name);
          continue;
        }
        zip.file(f.name, Buffer.from(await data.arrayBuffer()));
        added++;
      } catch {
        skipped.push(f.name);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { added, skipped };
}

// JSZip отдаёт архив кусками — так он и уходит в браузер. Собирать в память
// целиком нельзя: хостинг не пропускает большие ответы одним куском.
function zipToStream(zip: JSZip): ReadableStream<Uint8Array> {
  const helper = zip.generateInternalStream({ type: "uint8array", compression: "STORE" });
  return new ReadableStream({
    start(controller) {
      helper.on("data", (chunk: Uint8Array) => controller.enqueue(chunk));
      helper.on("error", (err: any) => controller.error(err));
      helper.on("end", () => controller.close());
      helper.resume();
    },
  });
}

// Что лежит в архиве — простыми словами, чтобы через год было понятно.
function readme(part: number, total: number): string {
  return [
    "LIFE OS — выгрузка твоих данных / your data export",
    "",
    total > 1 ? `Это часть ${part} из ${total}. Записи (data.json) лежат в первой части.` : "Записи лежат в data.json.",
    "",
    "data.json — весь текст: дневник, финансы, книги, здоровье, настроение, поездки, память.",
    "memory-documents/ — фото и документы из раздела «Память» (сканы, договоры, чеки).",
    "voice-recordings/ — оригиналы твоих голосовых сообщений.",
    "dreams/ — картинки из «Мечт».",
    "saved-from-social/ — сохранённое из соцсетей: картинки и видео.",
    "",
    "Это твои файлы. Никаких сроков и ссылок — всё лежит прямо здесь.",
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const date = new Date().toISOString().slice(0, 10);
  const withFiles = req.nextUrl.searchParams.get("files") === "1";

  if (!withFiles) {
    const { data } = await buildFullExport(user.id, user.name);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="lifeos-export-${date}.json"`,
      },
    });
  }

  const all = await listExportFiles(user.id);
  const parts = splitParts(all);
  const total = Math.max(1, parts.length);
  const part = Math.min(total, Math.max(1, Number(req.nextUrl.searchParams.get("part") || 1)));

  const zip = new JSZip();
  // Записи кладём в первую часть: она самодостаточна, даже если файлы не докачали.
  if (part === 1) {
    const { data } = await buildFullExport(user.id, user.name);
    zip.file("data.json", JSON.stringify(data, null, 2));
  }

  const { skipped } = await addFiles(zip, parts[part - 1] || []);
  if (skipped.length) {
    zip.file("MISSING.txt", ["Files that did not fit into this archive / Не поместились в этот архив:", "", ...skipped].join("\n"));
  }
  zip.file("README.txt", readme(part, total));

  const name = total > 1 ? `lifeos-export-${date}-part${part}of${total}.zip` : `lifeos-export-${date}.zip`;
  return new NextResponse(zipToStream(zip) as any, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
      "x-export-parts": String(total),
    },
  });
}
