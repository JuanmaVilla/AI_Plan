"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { duplicateTaskAction } from "@/lib/actions/tasks";
import { todayISO } from "@/lib/dates";

type DayChoice = "backlog" | "hoy" | "fecha";

/**
 * Duplicar una tarea hacia otra fecha (o al backlog).
 * Pensado para tareas que se repiten cada semana: copiás en vez de reescribir.
 */
export function DuplicateTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  taskId: string;
  taskTitle: string;
}) {
  const router = useRouter();
  const [dayChoice, setDayChoice] = useState<DayChoice>("fecha");
  const [dateValue, setDateValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setDayChoice("fecha");
      setDateValue("");
      setError(null);
    }
  }, [open]);

  function submit() {
    let scheduledDate: string | null = null;
    if (dayChoice === "hoy") scheduledDate = todayISO();
    else if (dayChoice === "fecha") {
      if (!dateValue) {
        setError("Elegí la fecha de la copia (ej: el mismo día de la próxima semana).");
        return;
      }
      if (dateValue < todayISO()) {
        setError("Esa fecha ya pasó. Elegí hoy o un día futuro.");
        return;
      }
      scheduledDate = dateValue;
    }
    startTransition(async () => {
      const res = await duplicateTaskAction(taskId, scheduledDate);
      if (res.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar tarea</DialogTitle>
          <DialogDescription>
            Se crea una copia de <strong>{taskTitle}</strong> en el mismo objetivo. Elegí
            para cuándo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["fecha", "Elegir fecha"],
                ["hoy", "Hoy"],
                ["backlog", "Backlog"],
              ] as [DayChoice, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDayChoice(value)}
                className={`rounded-[var(--radius-sm)] border px-3 py-1.5 font-body text-sm transition-colors ${
                  dayChoice === value
                    ? "border-[var(--border-active)] bg-[var(--accent-blue-dim)] text-fg"
                    : "border-[var(--border-default)] text-fg-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {dayChoice === "fecha" && (
            <input
              type="date"
              value={dateValue}
              min={todayISO()}
              onChange={(e) => setDateValue(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
            />
          )}
          {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Duplicando…" : "Duplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
