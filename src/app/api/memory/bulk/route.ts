import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createMemoryFromFile, createVideoMemory } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Загрузка пачкой: «вывалить в шкаф сразу всё».
//
// Почему не как обычная форма. У хостинга жёсткий предел на размер запроса —
// около 4,5 МБ, — и один договор в PDF его уже пробивает, не говоря про сотню
// файлов. Поэтому файлы идут в хранилище НАПРЯМУЮ из браузера по временной
// подписанной ссылке, а сервер потом только читает готовое и разбирает.
//
// Два шага:
//   POST { action: "urls", files: [{name, type, size}] } → куда класть
//   POST { action: "ingest", path, name, type }          → разобрать и сохранить
//
// Разбираем по одному файлу за запрос: у AI-разбора нет предсказуемого времени,
// и пачка из пятидесяти в одном запросе гарантированно упрётся в минуту.

const MAX_FILES = 60;
const MAX_BYTES = 25 * 1024 * 1024;
// Ролик тяжелее документа по природе. Предел в 45 МБ — не наша прихоть:
// столько принимает само хранилище на текущем тарифе, и лучше сказать об
// этом сразу, чем оборвать загрузку на середине.
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;

// Что вообще имеет смысл класть в «Память». Всё остальное человек всё равно
// не сможет найти по смыслу — а место займёт.
function isVideo(type: string, name: string): boolean {
  const t = (type || "").toLowerCase();
  return t.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(name || "");
}

function allowed(type: string, name: string): boolean {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  if (isVideo(type, name)) return true;
  if (t === "application/pdf" || n.endsWith(".pdf")) return true;
  if (n.endsWith(".docx") || n.endsWith(".xlsx") || n.endsWith(".txt") || n.endsWith(".md") || n.endsWith(".csv")) return true;
  return t.startsWith("text/") || t.includes("wordprocessingml") || t.includes("spreadsheetml");
}

function extOf(name: string, type: string): string {
  const m = (name || "").match(/\.([a-z0-9]{1,8})$/i);
  if (m) return m[1].toLowerCase();
  if ((type || "").startsWith("image/")) return type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  return "bin";
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = String(body?.action || "");
  const db = supabaseAdmin();

  // ===== Шаг 1: выдать адреса для прямой загрузки =====
  if (action === "urls") {
    const files = Array.isArray(body?.files) ? body.files.slice(0, MAX_FILES) : [];
    if (!files.length) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

    const out: { name: string; path?: string; url?: string; error?: string }[] = [];
    for (const f of files) {
      const name = String(f?.name || "file").slice(0, 200);
      const type = String(f?.type || "");
      const size = Number(f?.size) || 0;
      if (!allowed(type, name)) {
        out.push({ name, error: "type" });
        continue;
      }
      const cap = isVideo(type, name) ? MAX_VIDEO_BYTES : MAX_BYTES;
      if (size > cap) {
        out.push({ name, error: "big" });
        continue;
      }
      // Путь всегда внутри папки пользователя — чужое подсунуть нельзя.
      const path = `${user.id}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extOf(name, type)}`;
      try {
        const { data, error } = await db.storage.from("memories").createSignedUploadUrl(path);
        if (error || !data?.signedUrl) out.push({ name, error: "url" });
        else out.push({ name, path, url: data.signedUrl });
      } catch {
        out.push({ name, error: "url" });
      }
    }
    return NextResponse.json({ ok: true, files: out });
  }

  // ===== Шаг 2: разобрать один загруженный файл =====
  if (action === "ingest") {
    const path = String(body?.path || "");
    const name = String(body?.name || "").slice(0, 200);
    const type = String(body?.type || "");
    // Пускаем только в свою папку, даже если клиент придумает чужой путь.
    if (!path.startsWith(`${user.id}/`)) return NextResponse.json({ ok: false, error: "path" }, { status: 400 });

    // Видео не скачиваем целиком: карточку заводим сразу, а координаты и время
    // съёмки читаем кусочками по краям файла — иначе стомегабайтный ролик просто
    // не поместится в память сервера.
    if (isVideo(type, name)) {
      const { memory, geo } = await createVideoMemory(user.id, path, name, type || "video/mp4", { size: Number(body?.size) || undefined });
      if (!memory) {
        await db.storage.from("memories").remove([path]).catch(() => {});
        return NextResponse.json({ ok: false, error: "parse" }, { status: 500 });
      }
      // geo — чтобы карта сразу показала точку, не дожидаясь перезагрузки страницы.
      return NextResponse.json({ ok: true, memory, geo });
    }

    try {
      const { data, error } = await db.storage.from("memories").download(path);
      if (error || !data) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
      const buf = Buffer.from(await data.arrayBuffer());
      const { memory, geo } = await createMemoryFromFile(user.id, buf, type || "application/octet-stream", name, undefined, path);
      if (!memory) {
        // Разбор не удался — не оставляем мусор в хранилище.
        await db.storage.from("memories").remove([path]).catch(() => {});
        return NextResponse.json({ ok: false, error: "parse" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, memory, geo });
    } catch {
      return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "action" }, { status: 400 });
}
