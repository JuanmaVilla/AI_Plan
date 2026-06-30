"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { createNewsEntry, deleteNewsEntry } from "@/lib/queries/news";
import { todayISO } from "@/lib/dates";

export async function createNewsAction(input: {
  projectId: string | null;
  advances: string[];
  problem: string;
  nextSteps: string;
  forDate?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const advances = input.advances.filter((a) => a.trim());
  if (advances.length === 0) return { ok: false, error: "Agregá al menos un avance." };

  const team = await getMyTeam();
  if (!team) return { ok: false, error: "Sin equipo." };

  const entry = await createNewsEntry({
    teamId: team.team_id,
    projectId: input.projectId || null,
    advances,
    problem: input.problem || null,
    nextSteps: input.nextSteps || null,
    forDate: input.forDate ?? todayISO(),
  });

  if (!entry) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/novedades");
  return { ok: true };
}

export async function deleteNewsAction(id: string) {
  await deleteNewsEntry(id);
  revalidatePath("/novedades");
}
