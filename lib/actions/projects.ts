"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { isAdmin } from "@/lib/roles";
import {
  createProject,
  updateProject,
  updateProjectColor,
  updateProjectMeta,
} from "@/lib/queries/projects";
import { archiveProjectCascade } from "@/lib/queries/objectives";

function revalidateProjects() {
  revalidatePath("/proyectos");
  revalidatePath("/metas");
}

export async function createProjectAction(input: {
  name: string;
  icon?: string;
  color?: string;
  companyObjectiveId?: string | null;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Poné un nombre." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };
  if (!isAdmin(team.role)) return { ok: false as const, error: "Solo un admin puede crear proyectos." };

  const project = await createProject({
    teamId: team.team_id,
    name,
    icon: input.icon,
    color: input.color,
    companyObjectiveId: input.companyObjectiveId ?? null,
  });
  if (!project) return { ok: false as const, error: "No se pudo crear." };

  revalidateProjects();
  return { ok: true as const, id: project.id, name: project.name, icon: project.icon };
}

export async function archiveProjectAction(projectId: string) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  // Cascada: borra las tareas, archiva los objetivos y el proyecto.
  await archiveProjectCascade(team.team_id, projectId);
  revalidateProjects();
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/backlog");
  revalidatePath("/semana");
  revalidatePath("/hoy");
  revalidatePath("/done");
  return { ok: true as const };
}

/** Edita nombre / icono / color del proyecto. */
export async function updateProjectAction(
  projectId: string,
  patch: { name?: string; icon?: string; color?: string }
) {
  if (patch.name !== undefined && !patch.name.trim()) {
    return { ok: false as const, error: "El nombre no puede quedar vacío." };
  }
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateProject(projectId, patch);
  revalidateProjects();
  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true as const };
}

export async function updateProjectColorAction(projectId: string, color: string) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateProjectColor(projectId, color);
  revalidateProjects();
  return { ok: true as const };
}

/** Vincula (o desvincula con null) el proyecto a una Meta de empresa. */
export async function setProjectMetaAction(projectId: string, companyObjectiveId: string | null) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateProjectMeta(projectId, companyObjectiveId);
  revalidateProjects();
  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true as const };
}
