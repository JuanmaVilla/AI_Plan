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
import { renameTaskAction } from "@/lib/actions/tasks";

/** Renombrar una tarea (para typos o cambios de alcance). */
export function EditTaskDialog({
  open,
  onOpenChange,
  taskId,
  currentTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  taskId: string;
  currentTitle: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(currentTitle);
      setError(null);
    }
  }, [open, currentTitle]);

  function save() {
    if (!title.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    startTransition(async () => {
      const res = await renameTaskAction(taskId, title);
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
          <DialogTitle>Editar tarea</DialogTitle>
        </DialogHeader>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
        />
        {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
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
