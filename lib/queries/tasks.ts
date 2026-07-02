import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { getCurrentUser } from "@/lib/queries/auth";

export type Task = Tables<"tasks">;

export type TaskProjectLite = Pick<Tables<"projects">, "name" | "color" | "icon">;
export type TaskObjectiveLite = {
  id: string;
  name: string;
  color: string;
  icon: string;
  project: TaskProjectLite | null;
};

/**
 * Tarea con su objetivo (y, a través de él, el proyecto). `project` se mantiene
 * como atajo = objetivo.proyecto, para las tarjetas que muestran el contexto.
 */
export type TaskWithProject = Task & {
  objective: TaskObjectiveLite | null;
  project: TaskProjectLite | null;
};

export type TaskWithMeta = TaskWithProject & {
  assignee: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_color"> | null;
};

const SELECT =
  "*, objective:objectives!tasks_objective_id_fkey(id, name, color, icon, project:projects!objectives_project_id_fkey(name, color, icon)), assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_color)";

/** Aplana objetivo.proyecto en un `project` de conveniencia. */
function shape(rows: unknown[]): TaskWithMeta[] {
  return (rows ?? []).map((raw) => {
    const r = raw as TaskWithMeta;
    return { ...r, project: r.objective?.project ?? null };
  });
}

/**
 * Tareas de HOY del usuario logueado en su equipo.
 * Hoy = scheduled_date == fecha de hoy, asignadas a mí.
 */
export async function getTodayTasks(teamId: string): Promise<TaskWithMeta[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .eq("assignee_id", user.id)
    .eq("scheduled_date", todayISO())
    .order("created_at", { ascending: true });

  return shape(data ?? []);
}

/**
 * Tareas de la semana (rango de fechas dado) del equipo. Filtra por responsable
 * si se pasa `assigneeId` (para el modo "solo lo mío").
 */
export async function getWeekTasks(
  teamId: string,
  start: string,
  end: string,
  assigneeId?: string
): Promise<TaskWithMeta[]> {
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .gte("scheduled_date", start)
    .lte("scheduled_date", end);
  if (assigneeId) q = q.eq("assignee_id", assigneeId);
  const { data } = await q.order("created_at", { ascending: true });

  return shape(data ?? []);
}

/** Tareas en backlog del equipo (scheduled_date IS NULL). */
export async function getBacklogTasks(
  teamId: string,
  assigneeId?: string
): Promise<TaskWithMeta[]> {
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .is("scheduled_date", null);
  if (assigneeId) q = q.eq("assignee_id", assigneeId);
  const { data } = await q.order("created_at", { ascending: true });

  return shape(data ?? []);
}

/** Tareas terminadas del equipo (done = true), más recientes primero. */
export async function getDoneTasks(
  teamId: string,
  assigneeId?: string
): Promise<TaskWithMeta[]> {
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .eq("done", true);
  if (assigneeId) q = q.eq("assignee_id", assigneeId);
  const { data } = await q.order("created_at", { ascending: false });

  return shape(data ?? []);
}

/** Reagenda una tarea: a un día concreto ('yyyy-MM-dd') o al backlog (null). */
export async function updateTaskSchedule(
  taskId: string,
  scheduledDate: string | null
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ scheduled_date: scheduledDate }).eq("id", taskId);
}

/** Asigna (o desasigna con null) responsable. */
export async function updateTaskAssignee(
  taskId: string,
  assigneeId: string | null
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ assignee_id: assigneeId }).eq("id", taskId);
}

export type CreateTaskInput = {
  teamId: string;
  objectiveId: string;
  title: string;
  /** undefined = a quien la crea; null = sin asignar (backlog). */
  assigneeId?: string | null;
  /** undefined = hoy; null = backlog; 'yyyy-MM-dd' = día concreto. */
  scheduledDate?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<Task | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .insert({
      team_id: input.teamId,
      objective_id: input.objectiveId,
      title: input.title.trim(),
      assignee_id: input.assigneeId === undefined ? user.id : input.assigneeId,
      scheduled_date:
        input.scheduledDate === undefined ? todayISO() : input.scheduledDate,
      created_by: user.id,
    })
    .select("*")
    .single();

  return data ?? null;
}

export async function updateTaskProgress(taskId: string, progress: number): Promise<void> {
  const supabase = await createClient();
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  await supabase.from("tasks").update({ progress: clamped }).eq("id", taskId);
}

export async function updateTaskNote(taskId: string, note: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ note }).eq("id", taskId);
}

/** Marca/desmarca la tarea como terminada (tacha, no borra). */
export async function updateTaskDone(taskId: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ done }).eq("id", taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
}
