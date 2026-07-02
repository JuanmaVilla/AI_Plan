"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { isAdmin } from "@/lib/roles";
import { createMeta, archiveMeta, updateMeta } from "@/lib/queries/metas";

function revalidateMetas() {
  revalidatePath("/metas");
  revalidatePath("/proyectos");
}

export async function createMetaAction(input: {
  name: string;
  kpi: string;
  targetDate?: string | null;
  color?: string;
}) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Poné un nombre a la meta." };

  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tenés equipo." };
  if (!isAdmin(team.role)) return { ok: false as const, error: "Solo un admin puede crear metas." };

  const meta = await createMeta({
    teamId: team.team_id,
    name,
    kpi: input.kpi,
    targetDate: input.targetDate ?? null,
    color: input.color,
  });
  if (!meta) return { ok: false as const, error: "No se pudo crear." };

  revalidateMetas();
  return { ok: true as const, id: meta.id, name: meta.name };
}

export async function archiveMetaAction(metaId: string) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await archiveMeta(metaId);
  revalidateMetas();
  return { ok: true as const };
}

export async function updateMetaAction(
  metaId: string,
  patch: { name?: string; kpi?: string; targetDate?: string | null; color?: string }
) {
  const team = await getMyTeam();
  if (!team || !isAdmin(team.role)) return { ok: false as const, error: "Solo un admin." };
  await updateMeta(metaId, patch);
  revalidateMetas();
  return { ok: true as const };
}
