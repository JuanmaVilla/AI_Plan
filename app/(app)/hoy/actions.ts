"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { getOrCreateGeneralProject } from "@/lib/queries/projects";
import {
  createTask,
  updateTaskProgress,
  updateTaskNote,
  deleteTask,
} from "@/lib/queries/tasks";

/** Crea una tarea para hoy, asignada a mí, en el proyecto General. */
export async function createTodayTaskAction(title: string) {
  const clean = title.trim();
  if (!clean) return { ok: false as const, error: "Escribí algo." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const project = await getOrCreateGeneralProject(team.team_id);
  if (!project) return { ok: false as const, error: "No se pudo preparar el proyecto." };

  const task = await createTask({
    teamId: team.team_id,
    projectId: project.id,
    title: clean,
  });

  if (!task) return { ok: false as const, error: "No se pudo crear la tarea." };

  revalidatePath("/hoy");
  return { ok: true as const };
}

export async function setProgressAction(taskId: string, progress: number) {
  await updateTaskProgress(taskId, progress);
  revalidatePath("/hoy");
}

export async function setNoteAction(taskId: string, note: string) {
  await updateTaskNote(taskId, note);
  revalidatePath("/hoy");
}

export async function deleteTaskAction(taskId: string) {
  await deleteTask(taskId);
  revalidatePath("/hoy");
}
