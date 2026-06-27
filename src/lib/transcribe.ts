import OpenAI, { toFile } from "openai";

// Голос (Buffer любого формата: ogg/m4a/mp4/webm/wav) → текст через Whisper.
// language не задаём → Whisper сам определяет язык (важно для контента на разных
// языках: укр./англ. reels). Можно передать подсказку, если язык известен.
export async function transcribeFile(buf: Buffer, filename = "voice.ogg", language?: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = await toFile(buf, filename);
  const tr = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    ...(language ? { language } : {}),
  });
  return tr.text.trim();
}

// Голос по URL (ogg/opus из Telegram) → текст.
export async function transcribe(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  return transcribeFile(buf, "voice.ogg");
}
