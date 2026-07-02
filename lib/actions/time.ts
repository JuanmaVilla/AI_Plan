"use server";

import { revalidatePath } from "next/cache";
import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { startSession, stopSession, getActiveSession } from "@/lib/queries/time";

function revalidateAll() {
  revalidatePath("/hoy");
  revalidatePath("/semana");
  revalidatePath("/tiempos");
}

/** Inicia el cronómetro de trabajo del día (sin tarea). */
export async function startWorkTimerAction(): Promise<
  { ok: true; sessionId: string; startedAt: string } | { ok: false; error: string }
> {
  const [user, team] = await Promise.all([getCurrentUser(), getMyTeam()]);
  if (!user || !team) return { ok: false, error: "Sin sesión." };

  // Si ya hay una activa, devolverla (no crear otra)
  const active = await getActiveSession(user.id);
  if (active) return { ok: true, sessionId: active.id, startedAt: active.started_at };

  const session = await startSession(null, team.team_id, user.id);
  if (!session) return { ok: false, error: "No se pudo iniciar." };

  revalidateAll();
  return { ok: true, sessionId: session.id, startedAt: session.started_at };
}

/** Pausa el cronómetro de trabajo (cierra la sesión activa). */
export async function pauseWorkTimerAction(
  sessionId: string
): Promise<{ ok: true; minutes: number } | { ok: false; error: string }> {
  const minutes = await stopSession(sessionId);
  revalidateAll();
  return { ok: true, minutes };
}

/** Inicia/para cronómetro POR TAREA (per-task timer). */
export async function startTimerAction(
  taskId: string
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const [user, team] = await Promise.all([getCurrentUser(), getMyTeam()]);
  if (!user || !team) return { ok: false, error: "Sin sesión." };

  const active = await getActiveSession(user.id);
  if (active) await stopSession(active.id);

  const session = await startSession(taskId, team.team_id, user.id);
  if (!session) return { ok: false, error: "No se pudo iniciar." };

  revalidateAll();
  return { ok: true, sessionId: session.id };
}

export async function stopTimerAction(
  sessionId: string
): Promise<{ ok: true; minutes: number } | { ok: false; error: string }> {
  const minutes = await stopSession(sessionId);
  revalidateAll();
  return { ok: true, minutes };
}
