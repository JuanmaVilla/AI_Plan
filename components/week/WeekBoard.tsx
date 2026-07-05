"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Inbox } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import type { Member } from "@/lib/queries/members";
import {
  moveTaskAction,
  setTaskAssigneesAction,
  addTaskAssigneeAction,
} from "@/lib/actions/week";
import { DayColumn } from "@/components/week/DayColumn";
import { MiniTask } from "@/components/week/MiniTask";
import { BacklogDrawer } from "@/components/backlog/BacklogDrawer";
import { HsViewSelector, type WorkspaceLite } from "@/components/layout/HsViewSelector";
import type { HsView } from "@/lib/queries/hsView";

export function WeekBoard({
  weekDays,
  monthDays,
  today,
  initialTasks,
  members,
  currentUserId,
  canReassign = true,
  hsView,
  workspaces,
  selectedSpaces,
  teamNames,
  multiSpace = false,
}: {
  weekDays: string[];
  monthDays: string[];
  today: string;
  initialTasks: TaskWithMeta[];
  members: Member[];
  currentUserId: string;
  /** Solo los admin pueden reasignar tareas a otras personas. */
  canReassign?: boolean;
  hsView: HsView;
  workspaces: WorkspaceLite[];
  selectedSpaces: string[] | null;
  /** team_id → nombre del espacio (para el chip en vista multi-espacio). */
  teamNames: Record<string, string>;
  multiSpace?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [range, setRange] = useState<"7" | "30">("7");

  // Resincronizar cuando el servidor manda datos nuevos (cambio de filtro, realtime, etc.).
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const days = range === "7" ? weekDays : monthDays;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    if (!e.over) return;
    const target = String(e.over.id);
    const newDate = target === "backlog" ? null : target;

    // No se pueden agendar tareas en días que ya pasaron.
    if (newDate !== null && newDate < today) return;

    const task = tasks.find((t) => t.id === taskId);
    const prevDate = task?.scheduled_date ?? null;
    // Al agendar una tarea sin responsables, me la auto-asigno (la estoy tomando).
    const autoAssign = newDate !== null && task && task.assignees.length === 0;
    const me = members.find((m) => m.id === currentUserId) ?? null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              scheduled_date: newDate,
              ...(autoAssign && me
                ? {
                    assignees: [
                      {
                        id: me.id,
                        full_name: me.full_name,
                        avatar_color: me.avatar_color,
                        avatar_url: me.avatar_url,
                      },
                    ],
                  }
                : {}),
            }
          : t
      )
    );

    moveTaskAction(taskId, newDate).then((res) => {
      if (!res.ok) {
        // El servidor rechazó el cambio: revertir.
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, scheduled_date: prevDate } : t))
        );
      }
    });
    if (autoAssign && me && task) addTaskAssigneeAction(taskId, task.team_id, me.id);
  }

  /** Actualiza los responsables (optimista) y persiste la lista completa. */
  function changeAssignees(task: TaskWithMeta, ids: string[]) {
    const profiles = members
      .filter((m) => ids.includes(m.id))
      .map((m) => ({
        id: m.id,
        full_name: m.full_name,
        avatar_color: m.avatar_color,
        avatar_url: m.avatar_url,
      }));
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, assignees: profiles } : t))
    );
    setTaskAssigneesAction(task.id, task.team_id, ids);
  }

  const backlog = tasks.filter((t) => t.scheduled_date === null);
  const byDay = (day: string) => tasks.filter((t) => t.scheduled_date === day);

  return (
    <div className="flex flex-col gap-6 px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Semana
          </span>
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            {range === "7" ? "Tu semana" : "Tus 30 días"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3" data-tour="semana-view">
          <HsViewSelector view={hsView} workspaces={workspaces} selectedSpaces={selectedSpaces} />
          <div className="flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-white/5 p-1">
            {(["7", "30"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition-colors ${
                  range === r ? "bg-white/12 text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {r === "7" ? "7 días" : "30 días"}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-tour="semana-backlog"
            onClick={() => setDrawerOpen((o) => !o)}
          className="flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-white/5 px-4 py-2.5 font-body text-sm font-semibold text-fg-secondary transition-colors hover:border-[var(--border-active)]"
        >
          <Inbox className="h-4 w-4" />
          Backlog
            {backlog.length > 0 && (
              <span className="rounded-full bg-[var(--accent-blue-dim)] px-2 text-xs text-accent-cyan">
                {backlog.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div
            className={`grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 ${
              drawerOpen ? "lg:grid-cols-4 xl:grid-cols-7" : "lg:grid-cols-7"
            }`}
          >
            {days.map((day) => {
              const dayTasks = byDay(day);
              return (
                <DayColumn
                  key={day}
                  id={day}
                  weekday={format(parseISO(day), "EEE", { locale: es })}
                  dayNum={format(parseISO(day), "d")}
                  isToday={day === today}
                  isPast={day < today}
                  count={dayTasks.length}
                >
                  {dayTasks.map((t) => (
                    <MiniTask
                      key={t.id}
                      task={t}
                      members={members}
                      currentUserId={currentUserId}
                      canReassign={canReassign}
                      onAssigneesChange={changeAssignees}
                      workspaceName={multiSpace ? teamNames[t.team_id] : undefined}
                    />
                  ))}
                </DayColumn>
              );
            })}
          </div>

          <BacklogDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            tasks={backlog}
            members={members}
            currentUserId={currentUserId}
            canReassign={canReassign}
            onAssigneesChange={changeAssignees}
            teamNames={multiSpace ? teamNames : undefined}
          />
        </div>
      </DndContext>
    </div>
  );
}
