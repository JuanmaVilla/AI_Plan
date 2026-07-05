"use client";

import { useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import type { Member } from "@/lib/queries/members";
import { MiniTask } from "@/components/week/MiniTask";
import { groupByProjectObjective } from "@/lib/groupTasks";

export function BacklogDrawer({
  open,
  onClose,
  tasks,
  members,
  currentUserId,
  canReassign,
  onAssigneesChange,
  teamNames,
}: {
  open: boolean;
  onClose: () => void;
  tasks: TaskWithMeta[];
  members: Member[];
  currentUserId: string;
  canReassign: boolean;
  onAssigneesChange: (task: TaskWithMeta, ids: string[]) => void;
  /** team_id → nombre; si viene, muestra chip de espacio (vista multi-espacio). */
  teamNames?: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" });

  if (!open) return null;

  // Agrupar por proyecto → objetivo (mismo helper que la página /backlog).
  const groups = groupByProjectObjective(tasks);

  return (
    <aside className="liquid-glass flex w-full shrink-0 flex-col gap-3 self-start rounded-[24px] p-4 lg:sticky lg:top-3 lg:w-[320px]">
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
        className={`flex max-h-[60vh] flex-1 flex-col gap-4 overflow-y-auto rounded-2xl p-1 transition-colors lg:max-h-[calc(100vh-12rem)] ${
          isOver ? "bg-[var(--accent-cyan-dim)]" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center font-body text-sm text-fg-muted">
            Vacío. Arrastrá una tarea de un día acá para sacarle la fecha.
          </p>
        ) : (
          groups.map((pg) => (
            <section key={pg.key} className="flex flex-col gap-2">
              {/* Encabezado del proyecto, con su color */}
              <div
                className="flex items-center gap-2 border-b pb-1.5"
                style={{ borderColor: `${pg.color}55` }}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pg.color }} />
                <span className="min-w-0 flex-1 truncate font-primary text-sm font-black text-fg">
                  {pg.icon} {pg.name}
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 font-body text-[11px] font-bold tabular-nums"
                  style={{ background: `${pg.color}2e`, color: pg.color }}
                >
                  {pg.taskCount}
                </span>
              </div>

              {pg.objectives.map((og) => (
                <div key={og.key} className="flex flex-col gap-2">
                  <span className="font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                    {og.icon} {og.name}
                  </span>
                  {og.tasks.map((t) => (
                    <MiniTask
                      key={t.id}
                      task={t}
                      members={members}
                      currentUserId={currentUserId}
                      canReassign={canReassign}
                      onAssigneesChange={onAssigneesChange}
                      workspaceName={teamNames?.[t.team_id]}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </aside>
  );
}
