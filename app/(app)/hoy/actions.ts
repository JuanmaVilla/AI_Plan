"use server";

import { revalidatePath } from "next/cache";
import {
  updateTaskProgress,
  updateTaskNote,
  deleteTask,
} from "@/lib/queries/tasks";

export async function setProgressAction(taskId: string, progress: number) {
  await updateTaskProgress(taskId, progress);
  revalidatePath("/hoy");
}

export async function setNoteAction(taskId: string, note: string) {
  await updateTaskNote(taskId, note);
  revalidatePath("/hoy");
}

export async function deleteTaskAction(taskId: string) {
  await deleteTask(taskId);
  revalidatePath("/hoy");
}
