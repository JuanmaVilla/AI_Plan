"use client";

import { useState, useTransition } from "react";
import { createProjectAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ProjectType } from "@/lib/queries/projects";
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from "@/lib/projectColors";

const ICONS = ["📌", "🚀", "🎯", "💡", "📈", "🛠️", "📣", "💰", "🧩", "❤️", "🔥", "🌱"];

export function NewProjectDialog({ type }: { type: ProjectType }) {
  const isObjetivo = type === "objetivo";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kpi, setKpi] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName("");
    setKpi("");
    setIcon(ICONS[0]);
    setColor(DEFAULT_PROJECT_COLOR);
    setError(null);
  }

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre.");
      return;
    }
    startTransition(async () => {
      const res = await createProjectAction({ name, type, kpi, icon, color });
      if (res.ok) {
        reset();
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {isObjetivo ? "Nuevo objetivo" : "Nuevo proyecto"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isObjetivo ? "Nuevo objetivo" : "Nuevo proyecto"}</DialogTitle>
            <DialogDescription>
              {isObjetivo
                ? "Un objetivo grande con su forma de medir el éxito."
                : "Un proyecto con su forma de medir el éxito."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Labeled label="Nombre">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder={isObjetivo ? "Crecer la comunidad" : "Lanzar la web"}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
              />
            </Labeled>

            <Labeled label="KPI — ¿cómo se mide el éxito?">
              <input
                value={kpi}
                onChange={(e) => setKpi(e.target.value)}
                placeholder="Ej: 1.000 visitas / mes"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
              />
            </Labeled>

            <Labeled label="Ícono">
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
            </Labeled>

            <Labeled label="Color">
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: color === c ? "2px solid #fff" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </Labeled>

            {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
