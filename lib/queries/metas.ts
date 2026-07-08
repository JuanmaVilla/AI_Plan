import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/lib/types";
import { getCurrentUser } from "@/lib/queries/auth";
import { getProjectsWithStats, type ProjectWithStats } from "@/lib/queries/projects";

/** Meta = objetivo de empresa (nivel superior de la jerarquía). */
export type Meta = Tables<"company_objectives">;

/** Meta con los proyectos que le apuntan y su avance promedio. */
export type MetaWithProjects = Meta & {
  projects: ProjectWithStats[];
  progress: number; // promedio del avance de sus proyectos; 0 si no tiene
};

/** Metas del equipo (no archivadas). */
export async function getMetas(teamId: string): Promise<Meta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_objectives")
    .select("*")
    .eq("team_id", teamId)
    .eq("archived", false)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Metas con sus proyectos vinculados y avance rollup. */
export async function getMetasWithProjects(teamId: string): Promise<MetaWithProjects[]> {
  const [metas, projects] = await Promise.all([getMetas(teamId), getProjectsWithStats(teamId)]);
  return metas.map((m) => {
    const own = projects.filter((p) => p.company_objective_id === m.id);
    const progress =
      own.length === 0 ? 0 : Math.round(own.reduce((s, p) => s + p.progress, 0) / own.length);
    return { ...m, projects: own, progress };
  });
}

export type CreateMetaInput = {
  teamId: string;
  name: string;
  kpi?: string;
  targetDate?: string | null;
  icon?: string;
  color?: string;
};

export async function createMeta(input: CreateMetaInput): Promise<Meta | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_objectives")
    .insert({
      team_id: input.teamId,
      name: input.name.trim(),
      kpi: input.kpi?.trim() ?? "",
      target_date: input.targetDate ?? null,
      icon: input.icon ?? "🏁",
      color: input.color ?? "#0057FF",
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) console.error("createMeta:", error.message);
  return data ?? null;
}

export async function archiveMeta(metaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("company_objectives").update({ archived: true }).eq("id", metaId);
  if (error) throw error;
}

export async function updateMeta(
  metaId: string,
  patch: { name?: string; kpi?: string; targetDate?: string | null; color?: string }
): Promise<void> {
  const supabase = await createClient();
  const update: TablesUpdate<"company_objectives"> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.kpi !== undefined) update.kpi = patch.kpi.trim();
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;
  if (patch.color !== undefined) update.color = patch.color;
  const { error } = await supabase.from("company_objectives").update(update).eq("id", metaId);
  if (error) throw error;
}
