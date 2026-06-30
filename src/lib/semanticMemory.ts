import { supabaseAdmin } from "./supabaseAdmin";
import { embedToVectorString } from "./embeddings";

export type MemoryHit = { id: string; entry_date: string; summary: string | null; raw_text: string | null; similarity: number };

// Semantic search over the user's diary entries. Degrades to [] if pgvector /
// the match_entries function / embeddings are not set up yet.
export async function searchMemories(userId: string, query: string, k = 8): Promise<MemoryHit[]> {
  const vec = await embedToVectorString(query);
  if (!vec) return [];
  try {
    const { data, error } = await supabaseAdmin().rpc("match_entries", {
      query_embedding: vec,
      match_user: userId,
      match_count: k,
    });
    if (error) return [];
    return (data as MemoryHit[]) || [];
  } catch {
    return [];
  }
}

// Format hits as a compact context block for the AI (only confident matches).
export async function recallContext(userId: string, query: string, k = 6): Promise<string> {
  const hits = (await searchMemories(userId, query, k)).filter((h) => h.similarity >= 0.18);
  if (!hits.length) return "";
  const lines = hits.map((h) => `${h.entry_date}: ${(h.raw_text || h.summary || "").slice(0, 500)}`).join("\n");
  return `РЕЛЕВАНТНЫЕ ЗАПИСИ ИЗ ДНЕВНИКА (найдены по смыслу под текущий вопрос — опирайся на них в первую очередь):\n${lines}`;
}
