"use client";

import { useState } from "react";
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
import { moveTaskAction, assignTaskAction } from "@/lib/actions/week";
import { DayColumn } from "@/components/week/DayColumn";
import { MiniTask } from "@/components/week/MiniTask";
import { BacklogDrawer } from "@/components/backlog/BacklogDrawer";

export function WeekBoard({
  weekDays,
  today,
  initialTasks,
  members,
  currentUserId,
}: {
  weekDays: string[];
  today: string;
  initialTasks: TaskWithMeta[];
  members: Member[];
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    if (!e.over) return;
    const target = String(e.over.id);
    const newDate = target === "backlog" ? null : target;

    const task = tasks.find((t) => t.id === taskId);
    // Al agendar una tarea sin responsable, me la auto-asigno (la estoy tomando).
    const autoAssign = newDate !== null && task && !task.assignee_id;
    const me = members.find((m) => m.id === currentUserId) ?? null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              scheduled_date: newDate,
              ...(autoAssign && me
                ? {
                    assignee_id: me.id,
                    assignee: {
                      id: me.id,
                      full_name: me.full_name,
                      avatar_color: me.avatar_color,
                    },
                  }
                : {}),
            }
          : t
      )
    );

    moveTaskAction(taskId, newDate);
    if (autoAssign && me) assignTaskAction(taskId, me.id);
  }

  function cycleAssign(task: TaskWithMeta) {
    const options: (Member | null)[] = [null, ...members];
    const currentIdx = options.findIndex(
      (o) => (o?.id ?? null) === (task.assignee?.id ?? null)
    );
    const next = options[(currentIdx + 1) % options.length];

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              assignee_id: next?.id ?? null,
              assignee: next
                ? { id: next.id, full_name: next.full_name, avatar_color: next.avatar_color }
                : null,
            }
          : t
      )
    );
    assignTaskAction(task.id, next?.id ?? null);
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
            Tu semana
          </h1>
        </div>
        <button
          type="button"
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
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div
            className={`grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 ${
              drawerOpen ? "lg:grid-cols-4 xl:grid-cols-7" : "lg:grid-cols-7"
            }`}
          >
            {weekDays.map((day) => {
              const dayTasks = byDay(day);
              return (
                <DayColumn
                  key={day}
                  id={day}
                  weekday={format(parseISO(day), "EEE", { locale: es })}
                  dayNum={format(parseISO(day), "d")}
                  isToday={day === today}
                  count={dayTasks.length}
                >
                  {dayTasks.map((t) => (
                    <MiniTask key={t.id} task={t} onCycleAssign={cycleAssign} />
                  ))}
                </DayColumn>
              );
            })}
          </div>

          <BacklogDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            tasks={backlog}
            onCycleAssign={cycleAssign}
          />
        </div>
      </DndContext>
    </div>
  );
}
