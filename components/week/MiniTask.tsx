"use client";

import { useState, useTransition } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Copy } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import type { Member } from "@/lib/queries/members";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { DuplicateTaskDialog } from "@/components/tasks/DuplicateTaskDialog";

export function MiniTask({
  task,
  members,
  currentUserId,
  canReassign,
  onAssigneesChange,
  workspaceName,
}: {
  task: TaskWithMeta;
  members: Member[];
  currentUserId: string;
  /** Admin reasigna a cualquiera; empleado solo se asigna/quita a sí mismo. */
  canReassign: boolean;
  onAssigneesChange: (task: TaskWithMeta, ids: string[]) => void;
  /** Nombre del espacio, solo cuando la vista abarca varios (chip). */
  workspaceName?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const [done, setDone] = useState(task.done);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  const proj = task.project?.color ?? "#5b8def";
  const style = {
    ["--proj" as string]: proj,
    borderLeftColor: proj,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card proj-glow flex cursor-grab touch-none flex-col gap-2 rounded-[22px] border-l-[3px] p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <DoneToggle done={done} onToggle={toggleDone} size={16} />
          <span
            className={`min-w-0 break-words [overflow-wrap:anywhere] font-primary text-sm font-black leading-tight tracking-[-0.01em] xl:text-base ${
              done ? "text-fg-muted line-through" : "text-fg"
            }`}
          >
            {task.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowDuplicate(true)}
            aria-label="Duplicar tarea"
            title="Duplicar (ej: repetir la próxima semana)"
            className="text-fg-disabled transition-colors hover:text-fg"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <AssigneePicker
            members={members}
            selected={task.assignees.map((a) => a.id)}
            onChange={(ids) => onAssigneesChange(task, ids)}
            canReassign={canReassign}
            currentUserId={currentUserId}
            size="xs"
          />
        </div>
      </div>

      {/* Espacio (chip) cuando la vista abarca varios espacios */}
      {workspaceName && (
        <span className="w-fit rounded-full bg-white/10 px-2 py-0.5 font-body text-[10px] font-semibold text-fg-secondary">
          {workspaceName}
        </span>
      )}

      {/* Proyecto (color + nombre), para identificar de un vistazo */}
      {task.project && (
        <span className="flex items-center gap-1.5 font-body text-[11px] text-fg-muted">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: proj }} />
          <span className="truncate">
            {task.project.icon} {task.project.name}
          </span>
        </span>
      )}

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full"
            style={{ width: `${task.progress}%`, background: proj }}
          />
        </div>
        <span className="font-body text-[11px] tabular-nums text-fg-muted">
          {task.progress}%
        </span>
      </div>

      <div onPointerDown={(e) => e.stopPropagation()}>
        <DuplicateTaskDialog
          open={showDuplicate}
          onOpenChange={setShowDuplicate}
          taskId={task.id}
          taskTitle={task.title}
        />
      </div>
    </div>
  );
}
