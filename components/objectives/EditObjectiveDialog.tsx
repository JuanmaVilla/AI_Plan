"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateObjectiveAction } from "@/lib/actions/objectives";
import { PROJECT_COLORS } from "@/lib/projectColors";

/** Editar nombre, fecha límite y color de un objetivo (solo admin). */
export function EditObjectiveDialog({
  open,
  onOpenChange,
  objectiveId,
  projectId,
  currentName,
  currentTargetDate,
  currentColor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  objectiveId: string;
  projectId: string;
  currentName: string;
  currentTargetDate: string | null;
  currentColor: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [date, setDate] = useState(currentTargetDate ?? "");
  const [color, setColor] = useState(currentColor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(currentName);
      setDate(currentTargetDate ?? "");
      setColor(currentColor);
      setError(null);
    }
  }, [open, currentName, currentTargetDate, currentColor]);

  function save() {
    if (!name.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    startTransition(async () => {
      const res = await updateObjectiveAction(objectiveId, projectId, {
        name,
        targetDate: date || null,
        color,
      });
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
          <DialogTitle>Editar objetivo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Nombre
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Fecha límite (opcional)
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color === c}
                  aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-[var(--border-active)]" : "hover:scale-105"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
