"use client";

import { useState, useTransition } from "react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { AssigneeStack } from "@/components/tasks/AssigneePicker";

export function DoneList({ tasks }: { tasks: TaskWithMeta[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
        <span className="text-3xl">✅</span>
        <p className="font-body text-base text-fg-secondary">Todavía no terminaste ninguna tarea.</p>
        <p className="font-body text-sm text-fg-muted">
          Cuando marques una como terminada, aparece acá.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((t) => (
        <Row key={t.id} task={t} />
      ))}
    </div>
  );
}

function Row({ task }: { task: TaskWithMeta }) {
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    // toggleDoneAction (server action) ya auto-refresca la ruta; al desmarcar,
    // la tarea sale de esta lista sin un router.refresh() extra (doble refetch).
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
      {task.assignees.length > 0 && <AssigneeStack assignees={task.assignees} size="xs" />}
    </div>
  );
}
