import { cache } from "react";
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

/** Perfil mínimo de un responsable (para avatares). */
export type AssigneeProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_color" | "avatar_url"
>;

export type TaskWithMeta = TaskWithProject & {
  /** Responsables de la tarea (multi-responsable, tabla task_assignees). */
  assignees: AssigneeProfile[];
};

const SELECT =
  "*, objective:objectives!tasks_objective_id_fkey(id, name, color, icon, project:projects!objectives_project_id_fkey(name, color, icon)), assignee_rows:task_assignees(profile:profiles!task_assignees_profile_id_fkey(id, full_name, avatar_color, avatar_url))";

/** Aplana objetivo.proyecto en `project` y task_assignees en `assignees`. */
function shape(rows: unknown[]): TaskWithMeta[] {
  return (rows ?? []).map((raw) => {
    const r = raw as TaskWithMeta & {
      assignee_rows?: { profile: AssigneeProfile | null }[] | null;
    };
    const assignees = (r.assignee_rows ?? [])
      .map((a) => a.profile)
      .filter((p): p is AssigneeProfile => p !== null);
    delete r.assignee_rows;
    return { ...r, project: r.objective?.project ?? null, assignees };
  });
}

/**
 * IDs de tareas donde soy responsable. Cacheado por request (React cache): la
 * página Semana lo pide para la semana y para el backlog, así se hace 1 sola
 * consulta a task_assignees en vez de repetirla por cada lista.
 */
const getMyAssignedTaskIds = cache(async (teamId: string, uid: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("team_id", teamId)
    .eq("profile_id", uid);
  return (data ?? []).map((r) => r.task_id);
});

/**
 * Cláusula PostgREST `.or(...)` para el filtro "solo lo mío": tareas donde soy
 * responsable (task_assignees) O que yo creé. Así una tarea recién creada por mí
 * —aunque no tenga responsable— siempre aparece (era la causa de "creé la tarea
 * y no aparece"). Siempre incluye `created_by`, así que nunca queda vacía.
 */
async function mineOrClause(teamId: string, uid: string): Promise<string> {
  const mine = await getMyAssignedTaskIds(teamId, uid);
  return mine.length === 0
    ? `created_by.eq.${uid}`
    : `created_by.eq.${uid},id.in.(${mine.join(",")})`;
}

/** Cláusula "solo lo mío" (responsable O creador) a través de varios espacios. */
async function mineOrClauseForTeams(teamIds: string[], uid: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("profile_id", uid)
    .in("team_id", teamIds);
  const mine = (data ?? []).map((r) => r.task_id);
  return mine.length === 0
    ? `created_by.eq.${uid}`
    : `created_by.eq.${uid},id.in.(${mine.join(",")})`;
}

/**
 * Tareas de HOY para las vistas de Hoy/Semana (multi-espacio).
 * `teamIds`: espacios a incluir. `mineUid`: si viene, solo tareas donde soy
 * responsable o creador; si es null, todo el equipo de esos espacios.
 */
export async function getTodayTasksView(
  teamIds: string[],
  mineUid: string | null,
  /** "Hoy" en la zona del usuario (yyyy-MM-dd). */
  today: string
): Promise<TaskWithMeta[]> {
  if (teamIds.length === 0) return [];
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .in("team_id", teamIds)
    .eq("scheduled_date", today);
  if (mineUid) q = q.or(await mineOrClauseForTeams(teamIds, mineUid));
  const { data } = await q.order("created_at", { ascending: true });
  return shape(data ?? []);
}

/** Tareas de la semana (rango) para las vistas de Semana (multi-espacio). */
export async function getWeekTasksView(
  teamIds: string[],
  start: string,
  end: string,
  mineUid: string | null
): Promise<TaskWithMeta[]> {
  if (teamIds.length === 0) return [];
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .in("team_id", teamIds)
    .gte("scheduled_date", start)
    .lte("scheduled_date", end);
  if (mineUid) q = q.or(await mineOrClauseForTeams(teamIds, mineUid));
  const { data } = await q.order("created_at", { ascending: true });
  return shape(data ?? []);
}

/** Backlog (sin día) para las vistas de Semana (multi-espacio). */
export async function getBacklogTasksView(
  teamIds: string[],
  mineUid: string | null
): Promise<TaskWithMeta[]> {
  if (teamIds.length === 0) return [];
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(SELECT)
    .in("team_id", teamIds)
    .is("scheduled_date", null);
  if (mineUid) q = q.or(await mineOrClauseForTeams(teamIds, mineUid));
  const { data } = await q.order("created_at", { ascending: true });
  return shape(data ?? []);
}

/**
 * Tareas de HOY del usuario logueado en su equipo.
 * Hoy = scheduled_date == fecha de hoy, donde soy responsable o creador.
 */
export async function getTodayTasks(teamId: string): Promise<TaskWithMeta[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("team_id", teamId)
    .eq("scheduled_date", todayISO())
    .or(await mineOrClause(teamId, user.id))
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
  if (assigneeId) q = q.or(await mineOrClause(teamId, assigneeId));
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
  if (assigneeId) q = q.or(await mineOrClause(teamId, assigneeId));
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
  if (assigneeId) q = q.or(await mineOrClause(teamId, assigneeId));
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

/**
 * Fija la lista completa de responsables de una tarea (borra los que sobran,
 * agrega los que faltan). RLS: un no-admin solo puede tocarse a sí mismo,
 * y su UI solo le ofrece eso, así que el diff nunca toca a otros.
 */
export async function setTaskAssignees(
  taskId: string,
  teamId: string,
  profileIds: string[]
): Promise<void> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("task_assignees")
    .select("profile_id")
    .eq("task_id", taskId);

  const currentIds = (current ?? []).map((r) => r.profile_id);
  const toRemove = currentIds.filter((id) => !profileIds.includes(id));
  const toAdd = profileIds.filter((id) => !currentIds.includes(id));

  if (toRemove.length > 0) {
    await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("profile_id", toRemove);
  }
  if (toAdd.length > 0) {
    await supabase
      .from("task_assignees")
      .insert(toAdd.map((profileId) => ({ task_id: taskId, profile_id: profileId, team_id: teamId })));
  }
}

/** Agrega un responsable (idempotente). */
export async function addTaskAssignee(
  taskId: string,
  teamId: string,
  profileId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("task_assignees")
    .upsert(
      { task_id: taskId, profile_id: profileId, team_id: teamId },
      { onConflict: "task_id,profile_id", ignoreDuplicates: true }
    );
}

export type CreateTaskInput = {
  teamId: string;
  objectiveId: string;
  title: string;
  /** Responsables iniciales (vacío = sin asignar, típico del backlog). */
  assigneeIds?: string[];
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
      scheduled_date:
        input.scheduledDate === undefined ? todayISO() : input.scheduledDate,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (data && input.assigneeIds && input.assigneeIds.length > 0) {
    await supabase.from("task_assignees").insert(
      input.assigneeIds.map((profileId) => ({
        task_id: data.id,
        profile_id: profileId,
        team_id: input.teamId,
      }))
    );
  }

  return data ?? null;
}

/** Renombra una tarea. */
export async function updateTaskTitle(taskId: string, title: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").update({ title: title.trim() }).eq("id", taskId);
}

/** Datos mínimos de una tarea para duplicarla. */
export async function getTaskForDuplicate(taskId: string): Promise<{
  title: string;
  objective_id: string;
  team_id: string;
  assigneeIds: string[];
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("title, objective_id, team_id, assignee_rows:task_assignees(profile_id)")
    .eq("id", taskId)
    .maybeSingle();
  if (!data) return null;
  return {
    title: data.title,
    objective_id: data.objective_id,
    team_id: data.team_id,
    assigneeIds: ((data.assignee_rows ?? []) as { profile_id: string }[]).map(
      (r) => r.profile_id
    ),
  };
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
