"use client";

import { useState, useTransition } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { DoneToggle } from "@/components/tasks/DoneToggle";

export function MiniTask({
  task,
  onCycleAssign,
}: {
  task: TaskWithMeta;
  onCycleAssign: (task: TaskWithMeta) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const a = task.assignee;
  const initial = a?.full_name?.charAt(0).toUpperCase() ?? "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card flex cursor-grab touch-none flex-col gap-2 rounded-[22px] p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <DoneToggle done={done} onToggle={toggleDone} size={16} />
          <span
            className={`font-primary text-sm font-bold leading-snug ${
              done ? "text-fg-muted line-through" : "text-fg"
            }`}
          >
            {task.title}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onCycleAssign(task)}
          aria-label="Asignar responsable"
          className="shrink-0"
        >
          {a ? (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: a.avatar_color }}
              title={a.full_name}
            >
              {initial}
            </span>
          ) : (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--fg-disabled)] text-[11px] text-fg-muted"
              title="Sin asignar"
            >
              +
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {task.project && <span className="text-xs">{task.project.icon}</span>}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full"
            style={{ width: `${task.progress}%`, background: "var(--brand-gradient)" }}
          />
        </div>
        <span className="font-body text-[11px] tabular-nums text-fg-muted">
          {task.progress}%
        </span>
      </div>
    </div>
  );
}
