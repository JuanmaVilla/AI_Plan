"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getProjects } from "@/lib/queries/projects";
import { createTask, updateTaskDone } from "@/lib/queries/tasks";

export type PickProject = { id: string; name: string; type: string; icon: string };

function revalidateAll() {
  revalidatePath("/hoy");
  revalidatePath("/semana");
  revalidatePath("/backlog");
  revalidatePath("/proyectos");
  revalidatePath("/objetivos");
  revalidatePath("/done");
}

/** Lista proyectos y objetivos del equipo para el selector de nueva tarea. */
export async function listProjectsAction(): Promise<PickProject[]> {
  const team = await getMyTeam();
  if (!team) return [];
  const projects = await getProjects(team.team_id);
  return projects.map((p) => ({ id: p.id, name: p.name, type: p.type, icon: p.icon }));
}

/**
 * Crea una tarea en un proyecto/objetivo (obligatorio).
 * scheduledDate null = Backlog; 'yyyy-MM-dd' = ese día (y se auto-asigna a mí).
 */
export async function createTaskAction(input: {
  title: string;
  projectId: string;
  scheduledDate: string | null;
}) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Escribí la tarea." };
  if (!input.projectId) return { ok: false as const, error: "Elegí un proyecto u objetivo." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const user = await getCurrentUser();
  // Si tiene día, me la asigno (la estoy tomando); si va al backlog, sin asignar.
  const assigneeId = input.scheduledDate ? (user?.id ?? null) : null;

  const task = await createTask({
    teamId: team.team_id,
    projectId: input.projectId,
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
