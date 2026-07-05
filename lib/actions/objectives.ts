"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { isAdmin } from "@/lib/roles";
import { createObjective, archiveObjective, updateObjective } from "@/lib/queries/objectives";
import { createTask } from "@/lib/queries/tasks";
import { createKpi } from "@/lib/queries/kpis";

function revalidateProject(projectId: string) {
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/metas");
}

export async function createObjectiveAction(input: {
  projectId: string;
  name: string;
  /** Primer KPI (opcional): se crea en la tabla kpis, con meta numérica si viene. */
  kpi: string;
  kpiTarget?: number | null;
  kpiUnit?: string;
  targetDate?: string | null;
  color?: string;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Poné un nombre al objetivo." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };
  if (!isAdmin(team.role)) return { ok: false as const, error: "Solo un admin puede crear objetivos." };

  const obj = await createObjective({
    teamId: team.team_id,
    projectId: input.projectId,
    name,
    targetDate: input.targetDate ?? null,
    color: input.color,
  });
  if (!obj) return { ok: false as const, error: "No se pudo crear." };

  // El KPI vive en su propia tabla (medible: meta + valor actual).
  if (input.kpi.trim()) {
    await createKpi({
      teamId: team.team_id,
      objectiveId: obj.id,
      name: input.kpi,
      targetValue: input.kpiTarget ?? null,
      unit: input.kpiUnit,
    });
  }

  revalidateProject(input.projectId);
  return { ok: true as const, id: obj.id, name: obj.name };
}

export async function archiveObjectiveAction(objectiveId: string, projectId: string) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  // Archiva el objetivo y BORRA sus tareas (aparecen avisadas en el ConfirmDialog).
  await archiveObjective(objectiveId);
  revalidateProject(projectId);
  revalidatePath("/backlog");
  revalidatePath("/semana");
  revalidatePath("/hoy");
  revalidatePath("/done");
  return { ok: true as const };
}

export async function updateObjectiveAction(
  objectiveId: string,
  projectId: string,
  patch: { name?: string; kpi?: string; targetDate?: string | null; color?: string }
) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateObjective(objectiveId, patch);
  revalidateProject(projectId);
  return { ok: true as const };
}

/** Agrega una tarea al backlog de un objetivo (sin día, sin responsable). */
export async function addObjectiveTaskAction(
  objectiveId: string,
  projectId: string,
  title: string
) {
  const clean = title.trim();
  if (!clean) return { ok: false as const, error: "Escribí algo." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };

  const task = await createTask({
    teamId: team.team_id,
    objectiveId,
    title: clean,
    assigneeIds: [],
    scheduledDate: null,
  });
  if (!task) return { ok: false as const, error: "No se pudo agregar." };

  revalidateProject(projectId);
  revalidatePath("/backlog");
  return { ok: true as const };
}
