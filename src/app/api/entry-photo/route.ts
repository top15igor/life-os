import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyzeImage } from "@/lib/vision";
import { analyze } from "@/lib/ai";
import { saveEntry } from "@/lib/saveEntry";

export const runtime = "nodejs";
export const maxDuration = 90;

// Photo → diary entry: describe the image (vision), then run the normal AI
// analysis and save as an entry (source "photo"). Used by the app's camera.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("image") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "no_image" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ ok: false, error: "too_big" }, { status: 400 });

  const entry_date = /^\d{4}-\d{2}-\d{2}$/.test(String(form?.get("date") || "")) ? String(form?.get("date")) : undefined;
  const entry_time = /^\d{2}:\d{2}(:\d{2})?$/.test(String(form?.get("time") || "")) ? String(form?.get("time")) : undefined;

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const vision = await analyzeImage(base64, file.type || "image/jpeg", user.id);

    // Build the entry text from what the photo shows.
    let text = vision.title || "Фото";
    if (vision.summary) text += `. ${vision.summary}`;
    if (vision.fields?.length) {
      text += "\n" + vision.fields.map((f) => `${f.label}: ${f.value}`).join("; ");
    }

    const analysis = await analyze(text, user.id);
    const entry = await saveEntry({ userId: user.id, raw_text: text, source: "photo", analysis, entry_date, entry_time });
    return NextResponse.json({ ok: true, id: entry.id, title: vision.title });
  } catch (e) {
    console.error("entry-photo", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
