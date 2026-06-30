"use server";

import { revalidatePath } from "next/cache";
import { updateTaskSchedule, updateTaskAssignee } from "@/lib/queries/tasks";

function revalidate() {
  revalidatePath("/semana");
  revalidatePath("/hoy");
}

/** Mueve una tarea a un día ('yyyy-MM-dd') o al backlog (null). */
export async function moveTaskAction(taskId: string, scheduledDate: string | null) {
  await updateTaskSchedule(taskId, scheduledDate);
  revalidate();
}

/** Asigna o desasigna (null) responsable. */
export async function assignTaskAction(taskId: string, assigneeId: string | null) {
  await updateTaskAssignee(taskId, assigneeId);
  revalidate();
}
