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
import {
  listObjectivesAction,
  createTaskAction,
  type PickObjective,
} from "@/lib/actions/tasks";
import { todayISO } from "@/lib/dates";

type DayChoice = "backlog" | "hoy" | "fecha";

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultDay = "backlog",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Día preseleccionado al abrir. Desde la pantalla Hoy se pasa "hoy". */
  defaultDay?: DayChoice;
}) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<PickObjective[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [dayChoice, setDayChoice] = useState<DayChoice>(defaultDay);
  const [dateValue, setDateValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDayChoice(defaultDay);
    setLoaded(false);
    listObjectivesAction().then((os) => {
      setObjectives(os);
      setLoaded(true);
    });
  }, [open, defaultDay]);

  function reset() {
    setTitle("");
    setObjectiveId("");
    setDayChoice(defaultDay);
    setDateValue("");
    setError(null);
  }

  // Agrupar objetivos por proyecto para el selector.
  const byProject = new Map<string, PickObjective[]>();
  for (const o of objectives) {
    const key = o.project_name || "Proyecto";
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(o);
  }

  function submit() {
    if (!title.trim()) {
      setError("Escribí la tarea.");
      return;
    }
    if (!objectiveId) {
      setError("Elegí el objetivo al que pertenece.");
      return;
    }
    let scheduledDate: string | null = null;
    if (dayChoice === "hoy") scheduledDate = todayISO();
    else if (dayChoice === "fecha") {
      if (!dateValue) {
        setError("Elegí una fecha o cambiá a Backlog/Hoy.");
        return;
      }
      if (dateValue < todayISO()) {
        setError("Esa fecha ya pasó. Elegí hoy o un día futuro.");
        return;
      }
      scheduledDate = dateValue;
    }
    startTransition(async () => {
      const res = await createTaskAction({ title, objectiveId, scheduledDate });
      if (res.ok) {
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const noObjectives = loaded && objectives.length === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Toda tarea vive dentro de un objetivo. Así siempre sabés para qué la hacés.
          </DialogDescription>
        </DialogHeader>

        {noObjectives ? (
          /* Guía suave: no hay dónde colgar la tarea todavía. */
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] px-6 py-8 text-center">
            <span className="text-3xl">🎯</span>
            <p className="font-body text-sm font-semibold text-fg-secondary">
              Primero necesitás un objetivo
            </p>
            <p className="font-body text-sm text-fg-muted">
              Creá un proyecto y ponele al menos un objetivo (con su KPI). Después las tareas
              cuelgan de ahí.
            </p>
            <Button
              onClick={() => {
                onOpenChange(false);
                router.push("/proyectos");
              }}
            >
              Ir a Proyectos
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
                Tarea
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="¿Qué hay que hacer?"
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
                Objetivo (obligatorio)
              </span>
              <select
                value={objectiveId}
                onChange={(e) => setObjectiveId(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
              >
                <option value="" disabled>
                  Elegí…
                </option>
                {[...byProject.entries()].map(([proj, objs]) => (
                  <optgroup key={proj} label={proj}>
                    {objs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.icon} {o.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1">
              <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
                ¿Cuándo?
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["backlog", "Backlog"],
                    ["hoy", "Hoy"],
                    ["fecha", "Elegir fecha"],
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
                  className="mt-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
                />
              )}
            </div>

            {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
          </div>
        )}

        {!noObjectives && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Guardando…" : "Crear tarea"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
