import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { getCurrentUser } from "@/lib/queries/auth";

export type Task = Tables<"tasks">;

/** Tarea con datos mínimos del proyecto del que cuelga (para mostrar contexto). */
export type TaskWithProject = Task & {
  project: Pick<Tables<"projects">, "name" | "color" | "icon"> | null;
};

/**
 * Tareas de HOY del usuario logueado en su equipo.
 * Hoy = scheduled_date == fecha de hoy, asignadas a mí.
 */
export async function getTodayTasks(teamId: string): Promise<TaskWithProject[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*, project:projects(name, color, icon)")
    .eq("team_id", teamId)
    .eq("assignee_id", user.id)
    .eq("scheduled_date", todayISO())
    .order("created_at", { ascending: true });

  return (data as TaskWithProject[]) ?? [];
}

export type CreateTaskInput = {
  teamId: string;
  projectId: string;
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
      project_id: input.projectId,
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

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
}
