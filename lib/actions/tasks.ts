"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getObjectivesForPicker } from "@/lib/queries/objectives";
import {
  createTask,
  updateTaskDone,
  updateTaskTitle,
  getTaskForDuplicate,
} from "@/lib/queries/tasks";
import { isAdmin } from "@/lib/roles";
import { getServerToday } from "@/lib/queries/today";

/** Objetivo para el selector de nueva tarea (con su proyecto). */
export type PickObjective = {
  id: string;
  name: string;
  icon: string;
  project_id: string;
  project_name: string;
};

function revalidateAll() {
  revalidatePath("/hoy");
  revalidatePath("/semana");
  revalidatePath("/backlog");
  revalidatePath("/proyectos");
  revalidatePath("/metas");
  revalidatePath("/done");
}

/** Lista los objetivos del equipo (con su proyecto) para elegir dónde cuelga la tarea. */
export async function listObjectivesAction(): Promise<PickObjective[]> {
  const team = await getMyTeam();
  if (!team) return [];
  return getObjectivesForPicker(team.team_id);
}

/**
 * Crea una tarea dentro de un objetivo (obligatorio: jerarquía estricta).
 * scheduledDate null = Backlog; 'yyyy-MM-dd' = ese día (y se auto-asigna a mí).
 */
export async function createTaskAction(input: {
  title: string;
  objectiveId: string;
  scheduledDate: string | null;
}) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Escribí la tarea." };
  if (!input.objectiveId) return { ok: false as const, error: "Elegí un objetivo." };
  if (input.scheduledDate !== null && input.scheduledDate < (await getServerToday())) {
    return { ok: false as const, error: "No podés crear tareas en un día que ya pasó." };
  }

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const user = await getCurrentUser();
  // Si tiene día, me la asigno (la estoy tomando); si va al backlog, sin asignar.
  const assigneeIds = input.scheduledDate && user ? [user.id] : [];

  const task = await createTask({
    teamId: team.team_id,
    objectiveId: input.objectiveId,
    title,
    assigneeIds,
    scheduledDate: input.scheduledDate,
  });
  if (!task) return { ok: false as const, error: "No se pudo crear." };

  revalidateAll();
  return { ok: true as const };
}

/** Marca/desmarca terminada (tacha, no borra). */
export async function toggleDoneAction(taskId: string, done: boolean) {
  await updateTaskDone(taskId, done);
  revalidateAll();
}

/** Renombra una tarea. */
export async function renameTaskAction(taskId: string, title: string) {
  const clean = title.trim();
  if (!clean) return { ok: false as const, error: "El nombre no puede quedar vacío." };
  await updateTaskTitle(taskId, clean);
  revalidateAll();
  return { ok: true as const };
}

/**
 * Duplica una tarea (mismo título y objetivo) hacia una nueva fecha o al backlog.
 * Pensado para tareas que se repiten (ej: cada semana): duplicar > reescribir.
 * Responsables: un admin copia los originales; un miembro se asigna a sí mismo
 * si la agenda (RLS no le permite asignar a otros).
 */
export async function duplicateTaskAction(taskId: string, scheduledDate: string | null) {
  if (scheduledDate !== null && scheduledDate < (await getServerToday())) {
    return { ok: false as const, error: "No podés duplicar hacia un día que ya pasó." };
  }

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const original = await getTaskForDuplicate(taskId);
  if (!original || original.team_id !== team.team_id) {
    return { ok: false as const, error: "No se encontró la tarea." };
  }

  const user = await getCurrentUser();
  const assigneeIds = isAdmin(team.role)
    ? original.assigneeIds
    : scheduledDate && user
      ? [user.id]
      : [];

  const task = await createTask({
    teamId: team.team_id,
    objectiveId: original.objective_id,
    title: original.title,
    assigneeIds,
    scheduledDate,
  });
  if (!task) return { ok: false as const, error: "No se pudo duplicar." };

  revalidateAll();
  return { ok: true as const };
}
