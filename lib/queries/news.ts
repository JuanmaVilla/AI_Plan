import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { getCurrentUser } from "@/lib/queries/auth";

export type NewsEntry = Tables<"news_entries">;

export type NewsEntryWithMeta = NewsEntry & {
  author: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_color">;
  project: Pick<Tables<"projects">, "name" | "icon" | "color"> | null;
};

/** Novedades del equipo, agrupadas por fecha descendente. */
export async function getNewsEntries(teamId: string): Promise<NewsEntryWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_entries")
    .select(
      "*, author:profiles!news_entries_author_id_fkey(id, full_name, avatar_color), project:projects(name, icon, color)"
    )
    .eq("team_id", teamId)
    .order("for_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  return (data as NewsEntryWithMeta[]) ?? [];
}

export type CreateNewsInput = {
  teamId: string;
  projectId: string | null;
  advances: string[];
  problem: string | null;
  nextSteps: string | null;
  forDate: string;
};

export async function createNewsEntry(input: CreateNewsInput): Promise<NewsEntry | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("news_entries")
    .insert({
      team_id: input.teamId,
      author_id: user.id,
      project_id: input.projectId,
      advances: input.advances.filter((a) => a.trim()),
      problem: input.problem?.trim() || null,
      next_steps: input.nextSteps?.trim() || null,
      for_date: input.forDate,
    })
    .select("*")
    .single();

  return data ?? null;
}

export async function deleteNewsEntry(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("news_entries").delete().eq("id", id);
}
