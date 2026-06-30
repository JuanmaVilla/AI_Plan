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
  listProjectsAction,
  createTaskAction,
  type PickProject,
} from "@/lib/actions/tasks";
import { createProjectAction } from "@/lib/actions/projects";
import type { ProjectType } from "@/lib/queries/projects";
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
  const [projects, setProjects] = useState<PickProject[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKpi, setNewKpi] = useState("");
  const [newType, setNewType] = useState<ProjectType>("proyecto");
  const [dayChoice, setDayChoice] = useState<DayChoice>(defaultDay);
  const [dateValue, setDateValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDayChoice(defaultDay); // respetar el día preseleccionado cada vez que se abre
    listProjectsAction().then((ps) => {
      setProjects(ps);
      setCreatingNew(ps.length === 0); // si no hay ninguno, arrancá creando
    });
  }, [open, defaultDay]);

  function reset() {
    setTitle("");
    setProjectId("");
    setCreatingNew(false);
    setNewName("");
    setNewKpi("");
    setNewType("proyecto");
    setDayChoice(defaultDay);
    setDateValue("");
    setError(null);
  }

  function createInline() {
    const name = newName.trim();
    if (!name) {
      setError("Poné un nombre al proyecto/objetivo.");
      return;
    }
    startTransition(async () => {
      const res = await createProjectAction({
        name,
        type: newType,
        kpi: newKpi.trim(),
        icon: newType === "objetivo" ? "🎯" : "📌",
      });
      if (res.ok) {
        const created: PickProject = {
          id: res.id,
          name: res.name,
          type: newType,
          icon: res.icon,
        };
        setProjects((prev) => [...prev, created]);
        setProjectId(created.id);
        setCreatingNew(false);
        setNewName("");
        setError(null);
      } else {
        setError(res.error);
      }
    });
  }

  function submit() {
    if (!title.trim()) {
      setError("Escribí la tarea.");
      return;
    }
    if (!projectId) {
      setError("Elegí un proyecto u objetivo (o creá uno).");
      return;
    }
    let scheduledDate: string | null = null;
    if (dayChoice === "hoy") scheduledDate = todayISO();
    else if (dayChoice === "fecha") {
      if (!dateValue) {
        setError("Elegí una fecha o cambiá a Backlog/Hoy.");
        return;
      }
      scheduledDate = dateValue;
    }
    startTransition(async () => {
      const res = await createTaskAction({ title, projectId, scheduledDate });
      if (res.ok) {
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Se guarda en el Backlog. Después la agendás arrastrándola en Semana.
          </DialogDescription>
        </DialogHeader>

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

          <div className="flex flex-col gap-1">
            <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
              Proyecto u objetivo (obligatorio)
            </span>

            {!creatingNew ? (
              <div className="flex items-center gap-2">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
                >
                  <option value="" disabled>
                    Elegí…
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name} · {p.type}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => setCreatingNew(true)}>
                  ＋ Nuevo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-surface p-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre del proyecto u objetivo"
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-base px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
                />
                <input
                  value={newKpi}
                  onChange={(e) => setNewKpi(e.target.value)}
                  placeholder="KPI — ¿cómo se mide el éxito? (opcional)"
                  className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-base px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
                />
                <div className="flex gap-2">
                  {(["proyecto", "objetivo"] as ProjectType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`flex-1 rounded-[var(--radius-sm)] border px-3 py-1.5 font-body text-sm capitalize transition-colors ${
                        newType === t
                          ? "border-[var(--border-active)] bg-[var(--accent-blue-dim)] text-fg"
                          : "border-[var(--border-default)] text-fg-muted hover:text-fg"
                      }`}
                    >
                      {t === "objetivo" ? "🎯 Objetivo" : "📌 Proyecto"}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  {projects.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setCreatingNew(false)}>
                      Cancelar
                    </Button>
                  )}
                  <Button size="sm" onClick={createInline} disabled={pending}>
                    Crear y usar
                  </Button>
                </div>
              </div>
            )}
          </div>

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
                onChange={(e) => setDateValue(e.target.value)}
                className="mt-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
              />
            )}
          </div>

          {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Guardando…" : "Crear tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
