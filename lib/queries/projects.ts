import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { getCurrentUser } from "@/lib/queries/auth";

export type Project = Tables<"projects">;

/** Proyecto con avance derivado (promedio de las tareas de sus objetivos). */
export type ProjectWithStats = Project & {
  progress: number; // 0–100, promedio de las tareas de sus objetivos; 0 si no hay
  objectiveCount: number;
  taskCount: number;
};

/** Proyectos del equipo (no archivados). */
export async function getProjects(teamId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .eq("archived", false)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Un proyecto por id (o null). */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Proyectos con avance y conteos, agregando por la cadena
 * proyecto → objetivos → tareas. 3 consultas + agregación en memoria.
 */
export async function getProjectsWithStats(teamId: string): Promise<ProjectWithStats[]> {
  const supabase = await createClient();
  const projects = await getProjects(teamId);
  if (projects.length === 0) return [];

  const [{ data: objectives }, { data: tasks }] = await Promise.all([
    supabase
      .from("objectives")
      .select("id, project_id")
      .eq("team_id", teamId)
      .eq("archived", false),
    supabase
      .from("tasks")
      .select("objective_id, progress, done")
      .eq("team_id", teamId),
  ]);

  // objetivo → proyecto
  const objToProject = new Map<string, string>();
  const objCountByProject = new Map<string, number>();
  for (const o of objectives ?? []) {
    objToProject.set(o.id, o.project_id);
    objCountByProject.set(o.project_id, (objCountByProject.get(o.project_id) ?? 0) + 1);
  }

  // acumular avance de tareas por proyecto
  const sumByProject = new Map<string, { sum: number; n: number }>();
  for (const t of tasks ?? []) {
    const pid = objToProject.get(t.objective_id);
    if (!pid) continue;
    const acc = sumByProject.get(pid) ?? { sum: 0, n: 0 };
    acc.sum += t.done ? 100 : t.progress;
    acc.n += 1;
    sumByProject.set(pid, acc);
  }

  return projects.map((p) => {
    const acc = sumByProject.get(p.id);
    return {
      ...p,
      progress: acc && acc.n > 0 ? Math.round(acc.sum / acc.n) : 0,
      objectiveCount: objCountByProject.get(p.id) ?? 0,
      taskCount: acc?.n ?? 0,
    };
  });
}

export type CreateProjectInput = {
  teamId: string;
  name: string;
  icon?: string;
  color?: string;
  companyObjectiveId?: string | null;
};

export async function createProject(input: CreateProjectInput): Promise<Project | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .insert({
      team_id: input.teamId,
      name: input.name.trim(),
      icon: input.icon ?? "📌",
      color: input.color ?? "#0057FF",
      company_objective_id: input.companyObjectiveId ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  return data ?? null;
}

export async function archiveProject(projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("projects").update({ archived: true }).eq("id", projectId);
}

/** Edita nombre / icono / color del proyecto. */
export async function updateProject(
  projectId: string,
  patch: { name?: string; icon?: string; color?: string }
): Promise<void> {
  const supabase = await createClient();
  const update: { name?: string; icon?: string; color?: string } = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.icon !== undefined) update.icon = patch.icon;
  if (patch.color !== undefined) update.color = patch.color;
  await supabase.from("projects").update(update).eq("id", projectId);
}

export async function updateProjectColor(projectId: string, color: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("projects").update({ color }).eq("id", projectId);
}

export async function updateProjectMeta(
  projectId: string,
  companyObjectiveId: string | null
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({ company_objective_id: companyObjectiveId })
    .eq("id", projectId);
}
