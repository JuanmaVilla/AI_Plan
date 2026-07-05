"use client";

import { useDroppable } from "@dnd-kit/core";

export function DayColumn({
  id,
  weekday,
  dayNum,
  isToday,
  isPast = false,
  children,
  count,
}: {
  id: string;
  weekday: string;
  dayNum: string;
  isToday: boolean;
  /** Día ya transcurrido: se ve apagado y no acepta tareas nuevas. */
  isPast?: boolean;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: isPast });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[160px] flex-col gap-2 rounded-2xl border p-2.5 transition-colors ${
        isOver
          ? "border-[var(--border-active)] bg-[var(--accent-cyan-dim)]"
          : isToday
            ? "border-[var(--border-active)] bg-white/[0.03]"
            : isPast
              ? "border-[var(--border-default)] bg-transparent opacity-45"
              : "border-[var(--border-default)] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-baseline justify-between px-1">
        <span
          className={`flex items-baseline gap-1.5 font-body text-xs font-semibold capitalize ${
            isToday ? "text-accent-cyan" : "text-fg-muted"
          }`}
        >
          {weekday}
          {isToday && (
            <span className="rounded-full bg-[var(--accent-blue-dim)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-cyan">
              Hoy
            </span>
          )}
        </span>
        <span
          className={`font-display text-sm font-bold tabular-nums ${
            isToday ? "text-accent-cyan" : "text-fg-secondary"
          }`}
        >
          {dayNum}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
      {count === 0 && (
        <span className="px-1 font-body text-[11px] text-fg-disabled">—</span>
      )}
    </div>
  );
}
