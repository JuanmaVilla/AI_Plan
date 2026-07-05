"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from "@/lib/projectColors";

const ICONS = ["📌", "🚀", "🎯", "💡", "📈", "🛠️", "📣", "💰", "🧩", "❤️", "🔥", "🌱"];

export type MetaOption = { id: string; name: string; icon: string };

export function NewProjectDialog({ metas }: { metas: MetaOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);
  const [metaId, setMetaId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setName("");
    setIcon(ICONS[0]);
    setColor(DEFAULT_PROJECT_COLOR);
    setMetaId("");
    setError(null);
  }

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre.");
      return;
    }
    startTransition(async () => {
      const res = await createProjectAction({
        name,
        icon,
        color,
        companyObjectiveId: metaId || null,
      });
      if (res.ok) {
        reset();
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button data-tour="proyectos-new" onClick={() => setOpen(true)}>Nuevo proyecto</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Un proyecto agrupa objetivos. Después, dentro del proyecto, definís sus objetivos con KPI.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Labeled label="Nombre">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="Ej: Canción A"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
              />
            </Labeled>

            {metas.length > 0 && (
              <Labeled label="¿Aporta a una meta de empresa? (opcional)">
                <select
                  value={metaId}
                  onChange={(e) => setMetaId(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
                >
                  <option value="">Sin meta</option>
                  {metas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.name}
                    </option>
                  ))}
                </select>
              </Labeled>
            )}

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
                    style={{ background: c, outline: color === c ? "2px solid #fff" : "none", outlineOffset: "2px" }}
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
      <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">{label}</span>
      {children}
    </label>
  );
}
