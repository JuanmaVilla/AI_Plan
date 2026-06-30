"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { DoneToggle } from "@/components/tasks/DoneToggle";

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
  const router = useRouter();
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(async () => {
      await toggleDoneAction(task.id, next);
      router.refresh(); // al desmarcar, se va de esta lista
    });
  }

  const a = task.assignee;
  const initial = a?.full_name?.charAt(0).toUpperCase() ?? "";

  return (
    <div className="glass-card flex items-center gap-4 rounded-[26px] p-5">
      <DoneToggle done={done} onToggle={toggleDone} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`font-primary text-base font-bold leading-snug ${
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
      {a && (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: a.avatar_color }}
          title={a.full_name}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
