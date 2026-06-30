import OpenAI from "openai";

// Text-to-speech for "Jarvis speaks back". Returns an OGG/Opus buffer suitable
// for Telegram sendVoice. Degrades to null on any error (caller falls back to text).
export async function speak(text: string, voice = "nova"): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  // Strip light markdown and cap length (cost + latency + voice-message sanity).
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .trim()
    .slice(0, 900);
  if (!clean) return null;
  try {
    const openai = new OpenAI({ apiKey: key });
    const r = await openai.audio.speech.create({ model: "tts-1", voice: voice as any, input: clean, response_format: "opus" });
    return Buffer.from(await r.arrayBuffer());
  } catch (e) {
    console.error("tts", e);
    return null;
  }
}
