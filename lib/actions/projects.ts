"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import {
  createProject,
  archiveProject,
  updateProjectColor,
  type ProjectType,
} from "@/lib/queries/projects";
import { createTask } from "@/lib/queries/tasks";

function revalidateProjects() {
  revalidatePath("/proyectos");
  revalidatePath("/objetivos");
}

export async function createProjectAction(input: {
  name: string;
  type: ProjectType;
  kpi: string;
  icon: string;
  color?: string;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Poné un nombre." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const project = await createProject({
    teamId: team.team_id,
    name,
    type: input.type,
    kpi: input.kpi,
    icon: input.icon,
    color: input.color,
  });
  if (!project) return { ok: false as const, error: "No se pudo crear." };

  revalidateProjects();
  return { ok: true as const, id: project.id, name: project.name, icon: project.icon };
}

/** Agrega una tarea al backlog del proyecto (sin día, sin responsable). */
export async function addBacklogTaskAction(projectId: string, title: string) {
  const clean = title.trim();
  if (!clean) return { ok: false as const, error: "Escribí algo." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const task = await createTask({
    teamId: team.team_id,
    projectId,
    title: clean,
    assigneeId: null,
    scheduledDate: null,
  });
  if (!task) return { ok: false as const, error: "No se pudo agregar." };

  revalidateProjects();
  return { ok: true as const };
}

export async function archiveProjectAction(projectId: string) {
  await archiveProject(projectId);
  revalidateProjects();
}

export async function updateProjectColorAction(projectId: string, color: string) {
  await updateProjectColor(projectId, color);
  revalidateProjects();
  return { ok: true as const };
}
