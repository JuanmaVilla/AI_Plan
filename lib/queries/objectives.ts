import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/lib/types";
import { getCurrentUser } from "@/lib/queries/auth";
import type { AssigneeProfile } from "@/lib/queries/tasks";
import { getKpisByObjectives, type Kpi } from "@/lib/queries/kpis";

export type Objective = Tables<"objectives">;

export type ObjectiveTaskLite = {
  id: string;
  title: string;
  done: boolean;
  progress: number;
  scheduled_date: string | null;
  assignees: AssigneeProfile[];
};

/** Objetivo con avance (promedio de sus tareas, done=100), sus tareas y KPIs. */
export type ObjectiveWithStats = Objective & {
  progress: number;
  taskCount: number;
  tasks: ObjectiveTaskLite[];
  kpis: Kpi[];
};

/**
 * Objetivos (no archivados) de un proyecto, con avance y tareas.
 * Si viene assigneeId (filtro "solo lo mío"), solo lista las tareas de esa persona
 * (el avance del objetivo se calcula igual sobre todas sus tareas).
 */
export async function getObjectivesByProject(
  teamId: string,
  projectId: string,
  assigneeId?: string
): Promise<ObjectiveWithStats[]> {
  const supabase = await createClient();
  const { data: objectives } = await supabase
    .from("objectives")
    .select("*")
    .eq("team_id", teamId)
    .eq("project_id", projectId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  const objs = objectives ?? [];
  if (objs.length === 0) return [];

  const ids = objs.map((o) => o.id);
  const kpiMap = await getKpisByObjectives(teamId, ids);

  let query = supabase
    .from("tasks")
    .select(
      "id, objective_id, title, progress, done, scheduled_date, assignee_rows:task_assignees(profile:profiles!task_assignees_profile_id_fkey(id, full_name, avatar_color, avatar_url))"
    )
    .eq("team_id", teamId)
    .in("objective_id", ids)
    .order("created_at", { ascending: true });
  if (assigneeId) {
    // Filtro "solo lo mío": tareas donde soy responsable (join table) O que yo creé.
    const { data: mineRows } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("team_id", teamId)
      .eq("profile_id", assigneeId);
    const mine = (mineRows ?? []).map((r) => r.task_id);
    query =
      mine.length === 0
        ? query.eq("created_by", assigneeId)
        : query.or(`created_by.eq.${assigneeId},id.in.(${mine.join(",")})`);
  }
  const { data: tasks } = await query;

  const rows = tasks ?? [];

  return objs.map((o) => {
    const own = rows.filter((t) => t.objective_id === o.id);
    const progress =
      own.length === 0
        ? 0
        : Math.round(own.reduce((s, t) => s + (t.done ? 100 : t.progress), 0) / own.length);
    const list: ObjectiveTaskLite[] = own.map((t) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      progress: t.progress,
      scheduled_date: t.scheduled_date,
      assignees: ((t.assignee_rows ?? []) as { profile: AssigneeProfile | null }[])
        .map((a) => a.profile)
        .filter((p): p is AssigneeProfile => p !== null),
    }));
    return { ...o, progress, taskCount: own.length, tasks: list, kpis: kpiMap.get(o.id) ?? [] };
  });
}

/** Objetivos del equipo (id, nombre, proyecto), para los selectores. */
export async function getObjectivesForPicker(
  teamId: string
): Promise<{ id: string; name: string; icon: string; project_id: string; project_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("objectives")
    .select("id, name, icon, project_id, project:projects!objectives_project_id_fkey(name)")
    .eq("team_id", teamId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  return (data ?? []).map((o) => {
    const p = o.project as unknown as { name: string } | null;
    return {
      id: o.id,
      name: o.name,
      icon: o.icon,
      project_id: o.project_id,
      project_name: p?.name ?? "",
    };
  });
}

export type CreateObjectiveInput = {
  teamId: string;
  projectId: string;
  name: string;
  kpi?: string;
  targetDate?: string | null;
  icon?: string;
  color?: string;
};

export async function createObjective(input: CreateObjectiveInput): Promise<Objective | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectives")
    .insert({
      team_id: input.teamId,
      project_id: input.projectId,
      name: input.name.trim(),
      kpi: input.kpi?.trim() ?? "",
      target_date: input.targetDate ?? null,
      icon: input.icon ?? "🎯",
      color: input.color ?? "#0057FF",
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) console.error("createObjective:", error.message);
  return data ?? null;
}

/**
 * Archiva el objetivo Y BORRA sus tareas (el usuario espera que desaparezcan
 * de backlog/semana/hoy; el objetivo queda como historial archivado).
 */
export async function archiveObjective(objectiveId: string): Promise<void> {
  const supabase = await createClient();
  // RPC atómica (SECURITY DEFINER): borra tareas y archiva el objetivo en una
  // sola transacción, así nunca quedan tareas huérfanas si algo falla a medias.
  const { error } = await supabase.rpc("archive_objective", { obj: objectiveId });
  if (error) throw error;
}

/** Archiva el proyecto en cascada: borra tareas, archiva objetivos y proyecto. */
export async function archiveProjectCascade(teamId: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  // RPC atómica: toda la cascada en una transacción. `teamId` ya no se usa (la
  // función deriva el equipo del proyecto), pero se mantiene por compatibilidad.
  void teamId;
  const { error } = await supabase.rpc("archive_project_cascade", { proj: projectId });
  if (error) throw error;
}

export async function updateObjective(
  objectiveId: string,
  patch: { name?: string; kpi?: string; targetDate?: string | null; color?: string }
): Promise<void> {
  const supabase = await createClient();
  const update: TablesUpdate<"objectives"> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.kpi !== undefined) update.kpi = patch.kpi.trim();
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;
  if (patch.color !== undefined) update.color = patch.color;
  const { error } = await supabase.from("objectives").update(update).eq("id", objectiveId);
  if (error) throw error;
}
