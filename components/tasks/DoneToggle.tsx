"use client";

import { Check } from "lucide-react";

/** Check redondo de "terminada". Tacha la tarea, no la borra. */
export function DoneToggle({
  done,
  onToggle,
  size = 20,
}: {
  done: boolean;
  onToggle: (next: boolean) => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "Marcar como no terminada" : "Marcar como terminada"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!done);
      }}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        done
          ? "border-transparent bg-[var(--color-success)] text-white"
          : "border-[var(--color-fg-muted)] bg-surface text-[var(--color-fg-disabled)] hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
      }`}
    >
      <Check style={{ width: size * 0.6, height: size * 0.6 }} strokeWidth={3} />
    </button>
  );
}
