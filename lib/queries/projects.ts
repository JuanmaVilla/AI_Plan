import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { getCurrentUser } from "@/lib/queries/auth";

export type Project = Tables<"projects">;
export type ProjectType = "proyecto" | "objetivo";

export type ProjectTaskLite = {
  id: string;
  title: string;
  done: boolean;
  progress: number;
  scheduled_date: string | null;
};

/** Proyecto con avance derivado (promedio de sus tareas) y TODAS sus tareas. */
export type ProjectWithStats = Project & {
  progress: number; // 0–100, promedio de las tareas; 0 si no tiene
  taskCount: number;
  tasks: ProjectTaskLite[];
};

/** Proyectos del equipo (no archivados), opcionalmente filtrados por tipo. */
export async function getProjects(
  teamId: string,
  type?: ProjectType
): Promise<Project[]> {
  const supabase = await createClient();
  let q = supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (type) q = q.eq("type", type);

  const { data } = await q;
  return data ?? [];
}

/**
 * Proyectos del tipo dado, con avance promedio y lista de tareas en backlog.
 * Hace 2 consultas (proyectos + tareas) y agrega en memoria.
 */
export async function getProjectsWithStats(
  teamId: string,
  type: ProjectType
): Promise<ProjectWithStats[]> {
  const supabase = await createClient();

  const projects = await getProjects(teamId, type);
  if (projects.length === 0) return [];

  const ids = projects.map((p) => p.id);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, project_id, title, progress, scheduled_date, done")
    .eq("team_id", teamId)
    .in("project_id", ids)
    .order("created_at", { ascending: true });

  const rows = tasks ?? [];

  return projects.map((p) => {
    const own = rows.filter((t) => t.project_id === p.id);
    // Avance: promedio considerando terminadas como 100%.
    const progress =
      own.length === 0
        ? 0
        : Math.round(
            own.reduce((sum, t) => sum + (t.done ? 100 : t.progress), 0) / own.length
          );
    const list: ProjectTaskLite[] = own.map((t) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      progress: t.progress,
      scheduled_date: t.scheduled_date,
    }));

    return { ...p, progress, taskCount: own.length, tasks: list };
  });
}

export type CreateProjectInput = {
  teamId: string;
  name: string;
  type: ProjectType;
  kpi?: string;
  icon?: string;
  color?: string;
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
      type: input.type,
      kpi: input.kpi?.trim() ?? "",
      icon: input.icon ?? "📌",
      color: input.color ?? "#0057FF",
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

export async function updateProjectColor(projectId: string, color: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("projects").update({ color }).eq("id", projectId);
}

/**
 * Devuelve el proyecto "General" del equipo; si no existe, lo crea.
 * Lo usa la vista Hoy para que el quick-add tenga dónde colgar.
 */
export async function getOrCreateGeneralProject(teamId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .eq("name", "General")
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  return createProject({ teamId, name: "General", type: "proyecto" });
}
