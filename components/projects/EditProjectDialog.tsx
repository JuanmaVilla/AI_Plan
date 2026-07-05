"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PROJECT_COLORS } from "@/lib/projectColors";

const ICONS = ["📌", "🚀", "🎯", "💡", "📈", "🛠️", "📣", "💰", "🧩", "❤️", "🔥", "🌱"];

/** Editar nombre, ícono y color de un proyecto (solo admin). */
export function EditProjectDialog({
  open,
  onOpenChange,
  projectId,
  currentName,
  currentIcon,
  currentColor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  currentName: string;
  currentIcon: string;
  currentColor: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [icon, setIcon] = useState(currentIcon);
  const [color, setColor] = useState(currentColor);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(currentName);
      setIcon(currentIcon);
      setColor(currentColor);
      setError(null);
    }
  }, [open, currentName, currentIcon, currentColor]);

  function save() {
    if (!name.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    startTransition(async () => {
      const res = await updateProjectAction(projectId, { name, icon, color });
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
          <DialogTitle>Editar proyecto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Nombre
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Ícono
            </span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border text-lg transition-colors ${
                    icon === e
                      ? "border-[var(--border-active)] bg-[var(--glass-bg)]"
                      : "border-[var(--border-default)] hover:border-[var(--border-active)]"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: color === c ? "2px solid #fff" : "none", outlineOffset: "2px" }}
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
