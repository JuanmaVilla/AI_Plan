"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { isAdmin } from "@/lib/roles";
import { createKpi, updateKpi, deleteKpi } from "@/lib/queries/kpis";

function revalidateKpis(projectId: string) {
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/metas");
}

/** Crea un KPI en un objetivo (solo admin). */
export async function createKpiAction(input: {
  objectiveId: string;
  projectId: string;
  name: string;
  targetValue?: number | null;
  unit?: string;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Poné un nombre al KPI." };

  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };

  const kpi = await createKpi({
    teamId: team.team_id,
    objectiveId: input.objectiveId,
    name,
    targetValue: input.targetValue ?? null,
    unit: input.unit,
  });
  if (!kpi) return { ok: false as const, error: "No se pudo crear." };

  revalidateKpis(input.projectId);
  return { ok: true as const };
}

/** Edita nombre / meta / unidad de un KPI (solo admin). */
export async function updateKpiAction(
  kpiId: string,
  projectId: string,
  patch: { name?: string; targetValue?: number | null; unit?: string }
) {
  if (patch.name !== undefined && !patch.name.trim()) {
    return { ok: false as const, error: "El nombre no puede quedar vacío." };
  }
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateKpi(kpiId, patch);
  revalidateKpis(projectId);
  return { ok: true as const };
}

/** Actualiza el valor actual de un KPI (cualquier miembro del equipo). */
export async function setKpiValueAction(kpiId: string, projectId: string, value: number) {
  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };
  await updateKpi(kpiId, { currentValue: value });
  revalidateKpis(projectId);
  return { ok: true as const };
}

/** Borra un KPI (solo admin). */
export async function deleteKpiAction(kpiId: string, projectId: string) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await deleteKpi(kpiId);
  revalidateKpis(projectId);
  return { ok: true as const };
}
