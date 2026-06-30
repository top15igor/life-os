import { supabaseAdmin } from "./supabaseAdmin";

export type AdminTask = { id: string; title: string; note: string | null; done: boolean; created_at: string; done_at: string | null };

export async function getAdminTasks(): Promise<AdminTask[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("admin_tasks")
      .select("id, title, note, done, created_at, done_at")
      .order("done", { ascending: true })
      .order("created_at", { ascending: false });
    return (data as any) || [];
  } catch {
    return [];
  }
}

export async function addAdminTask(title: string, note?: string | null): Promise<AdminTask | null> {
  const t = String(title || "").trim().slice(0, 300);
  if (!t) return null;
  const { data } = await supabaseAdmin()
    .from("admin_tasks")
    .insert({ title: t, note: note ? String(note).slice(0, 4000) : null })
    .select("id, title, note, done, created_at, done_at")
    .single();
  return (data as any) || null;
}

export async function toggleAdminTask(id: string, done: boolean): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from("admin_tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  return !error;
}

export async function deleteAdminTask(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin().from("admin_tasks").delete().eq("id", id);
  return !error;
}
