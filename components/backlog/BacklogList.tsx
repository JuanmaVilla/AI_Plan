"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2, Pencil, Copy } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { todayISO } from "@/lib/dates";
import { moveTaskAction, addTaskAssigneeAction } from "@/lib/actions/week";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { deleteTaskAction } from "@/app/(app)/hoy/actions";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { DuplicateTaskDialog } from "@/components/tasks/DuplicateTaskDialog";
import { AssigneeStack } from "@/components/tasks/AssigneePicker";
import { groupByProjectObjective } from "@/lib/groupTasks";
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
      // Al agendarla sin responsables, me la asigno (la estoy tomando).
      if (t.assignees.length === 0) await addTaskAssigneeAction(t.id, t.team_id, currentUserId);
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

  // Agrupar: proyecto → objetivo → tareas (helper compartido con el panel Semana).
  const groups = groupByProjectObjective(tasks);

  return (
    <>
      <div className="flex flex-col gap-7">
        {groups.map((pg) => (
          <section
            key={pg.key}
            className="flex flex-col gap-3"
            style={{ ["--proj" as string]: pg.color }}
          >
            {/* Encabezado del proyecto, con su color */}
            <div className="flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: `${pg.color}55` }}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                style={{ background: `${pg.color}2e` }}
              >
                {pg.icon}
              </span>
              <span className="font-primary text-xl font-black tracking-[-0.01em] text-fg">
                {pg.name}
              </span>
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 font-body text-xs font-bold tabular-nums"
                style={{ background: `${pg.color}2e`, color: pg.color }}
              >
                {pg.taskCount}
              </span>
            </div>

            {pg.objectives.map((og) => (
              <div key={og.key} className="flex flex-col gap-2 pl-1">
                <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  {og.icon} {og.name}
                </span>
                <div className="flex flex-col gap-2">
                  {og.tasks.map((t) => (
                    <Row
                      key={t.id}
                      task={t}
                      onSchedule={() => scheduleToday(t)}
                      onDelete={() => setToDelete(t)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
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
  const [showEdit, setShowEdit] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  const proj = task.project?.color || "#5b8def";

  return (
    <div
      className="glass-card proj-glow flex items-center gap-4 rounded-[26px] p-4"
      style={{ ["--proj" as string]: proj }}
    >
      <DoneToggle done={done} onToggle={toggleDone} />
      <span
        className={`min-w-0 flex-1 font-primary text-xl font-black leading-tight tracking-[-0.02em] ${
          done ? "text-fg-muted line-through" : "text-fg"
        }`}
      >
        {task.title}
      </span>
      {task.assignees.length > 0 && <AssigneeStack assignees={task.assignees} size="xs" />}
      <Button variant="outline" size="sm" className="gap-2" onClick={onSchedule}>
        <CalendarPlus className="h-4 w-4" />
        Agendar hoy
      </Button>
      <button
        type="button"
        onClick={() => setShowEdit(true)}
        aria-label="Editar"
        className="text-fg-disabled transition-colors hover:text-fg"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setShowDuplicate(true)}
        aria-label="Duplicar"
        className="text-fg-disabled transition-colors hover:text-fg"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar"
        className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <EditTaskDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        taskId={task.id}
        currentTitle={task.title}
      />
      <DuplicateTaskDialog
        open={showDuplicate}
        onOpenChange={setShowDuplicate}
        taskId={task.id}
        taskTitle={task.title}
      />
    </div>
  );
}
