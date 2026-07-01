"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2 } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { todayISO } from "@/lib/dates";
import { moveTaskAction, assignTaskAction } from "@/lib/actions/week";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { deleteTaskAction } from "@/app/(app)/hoy/actions";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function BacklogList({
  tasks,
  currentUserId,
}: {
  tasks: TaskWithMeta[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<TaskWithMeta | null>(null);
  const [, startTransition] = useTransition();

  function scheduleToday(t: TaskWithMeta) {
    startTransition(async () => {
      await moveTaskAction(t.id, todayISO());
      if (!t.assignee_id) await assignTaskAction(t.id, currentUserId);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    setToDelete(null);
    startTransition(async () => {
      await deleteTaskAction(id);
      router.refresh();
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] px-6 py-12 text-center font-body text-fg-muted">
        El backlog está vacío. Creá tareas con “Nueva tarea”.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {tasks.map((t) => (
          <Row
            key={t.id}
            task={t}
            onSchedule={() => scheduleToday(t)}
            onDelete={() => setToDelete(t)}
          />
        ))}
      </div>

      <Dialog open={toDelete !== null} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar esta tarea?</DialogTitle>
            <DialogDescription>
              Vas a eliminar <strong>{toDelete?.title}</strong>. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Sí, borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  task,
  onSchedule,
  onDelete,
}: {
  task: TaskWithMeta;
  onSchedule: () => void;
  onDelete: () => void;
}) {
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  const proj = task.project?.color || "#5b8def";

  return (
    <div
      className="glass-card proj-glow flex items-center gap-4 rounded-[26px] p-5"
      style={{ ["--proj" as string]: proj }}
    >
      <DoneToggle done={done} onToggle={toggleDone} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`font-primary text-2xl font-black leading-tight tracking-[-0.02em] ${
            done ? "text-fg-muted line-through" : "text-fg"
          }`}
        >
          {task.title}
        </span>
        {task.project && (
          <span className="font-body text-xs text-fg-muted">
            {task.project.icon} {task.project.name}
          </span>
        )}
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onSchedule}>
        <CalendarPlus className="h-4 w-4" />
        Agendar hoy
      </Button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar"
        className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
