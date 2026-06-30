import OpenAI from "openai";

// Embed text with OpenAI text-embedding-3-small (1536 dims). Returns the vector
// as a Postgres-ready string "[v1,v2,...]" (robust through PostgREST), or null.
export async function embedToVectorString(text: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const input = (text || "").trim().slice(0, 8000);
  if (!input) return null;
  try {
    const openai = new OpenAI({ apiKey: key });
    const r = await openai.embeddings.create({ model: "text-embedding-3-small", input });
    const vec = r.data?.[0]?.embedding;
    if (!Array.isArray(vec) || !vec.length) return null;
    return `[${vec.join(",")}]`;
  } catch (e) {
    console.error("embed", e);
    return null;
  }
}

// Batch embed many texts in one API call (for backfill). Returns vector strings
// aligned to the input order (null for empty inputs).
export async function embedBatch(texts: string[]): Promise<(string | null)[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return texts.map(() => null);
  const inputs = texts.map((t) => (t || "").trim().slice(0, 8000) || " ");
  try {
    const openai = new OpenAI({ apiKey: key });
    const r = await openai.embeddings.create({ model: "text-embedding-3-small", input: inputs });
    const out: (string | null)[] = texts.map(() => null);
    for (const item of r.data || []) {
      const v = item.embedding;
      if (Array.isArray(v) && v.length) out[item.index] = `[${v.join(",")}]`;
    }
    return out;
  } catch (e) {
    console.error("embedBatch", e);
    return texts.map(() => null);
  }
}
