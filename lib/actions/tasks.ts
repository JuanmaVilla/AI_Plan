"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getObjectivesForPicker } from "@/lib/queries/objectives";
import { createTask, updateTaskDone } from "@/lib/queries/tasks";

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

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const user = await getCurrentUser();
  // Si tiene día, me la asigno (la estoy tomando); si va al backlog, sin asignar.
  const assigneeId = input.scheduledDate ? (user?.id ?? null) : null;

  const task = await createTask({
    teamId: team.team_id,
    objectiveId: input.objectiveId,
    title,
    assigneeId,
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
