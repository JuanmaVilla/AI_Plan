"use server";

import { revalidatePath } from "next/cache";
import { updateTaskSchedule, setTaskAssignees, addTaskAssignee } from "@/lib/queries/tasks";
import { todayISO } from "@/lib/dates";

function revalidate() {
  revalidatePath("/semana");
  revalidatePath("/hoy");
  revalidatePath("/backlog");
  revalidatePath("/proyectos");
}

/** Mueve una tarea a un día ('yyyy-MM-dd') o al backlog (null). */
export async function moveTaskAction(taskId: string, scheduledDate: string | null) {
  // No se pueden agendar tareas en días que ya pasaron.
  if (scheduledDate !== null && scheduledDate < todayISO()) {
    return { ok: false as const, error: "No podés agendar en un día que ya pasó." };
  }
  await updateTaskSchedule(taskId, scheduledDate);
  revalidate();
  return { ok: true as const };
}

/** Fija la lista completa de responsables de una tarea. */
export async function setTaskAssigneesAction(
  taskId: string,
  teamId: string,
  profileIds: string[]
) {
  await setTaskAssignees(taskId, teamId, profileIds);
  revalidate();
}

/** Agrega un responsable sin tocar a los demás (auto-asignación al agendar). */
export async function addTaskAssigneeAction(
  taskId: string,
  teamId: string,
  profileId: string
) {
  await addTaskAssignee(taskId, teamId, profileId);
  revalidate();
}
