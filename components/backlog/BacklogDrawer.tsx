"use client";

import { useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { MiniTask } from "@/components/week/MiniTask";

export function BacklogDrawer({
  open,
  onClose,
  tasks,
  onCycleAssign,
}: {
  open: boolean;
  onClose: () => void;
  tasks: TaskWithMeta[];
  onCycleAssign?: (task: TaskWithMeta) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" });

  if (!open) return null;

  return (
    <aside className="liquid-glass flex w-full shrink-0 flex-col gap-3 self-start rounded-[24px] p-4 lg:sticky lg:top-3 lg:w-[300px]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
            Backlog
          </span>
          <span className="font-primary text-lg font-bold text-fg">Tareas sin día</span>
          <span className="font-body text-xs text-fg-muted">
            Arrastralas a un día para agendarlas.
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Ocultar backlog"
          className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex max-h-[60vh] flex-1 flex-col gap-2 overflow-y-auto rounded-2xl p-1 transition-colors lg:max-h-[calc(100vh-12rem)] ${
          isOver ? "bg-[var(--accent-cyan-dim)]" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center font-body text-sm text-fg-muted">
            Vacío. Arrastrá una tarea de un día acá para sacarle la fecha.
          </p>
        ) : (
          tasks.map((t) => <MiniTask key={t.id} task={t} onCycleAssign={onCycleAssign} />)
        )}
      </div>
    </aside>
  );
}
