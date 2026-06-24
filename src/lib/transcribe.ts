import OpenAI, { toFile } from "openai";

// Голос (ogg/opus из Telegram) → текст через Whisper.
export async function transcribe(fileUrl: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await fetch(fileUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = await toFile(buf, "voice.ogg");
  const tr = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ru",
  });
  return tr.text.trim();
}
