"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { ProjectWithStats, ProjectTaskLite } from "@/lib/queries/projects";
import {
  addBacklogTaskAction,
  archiveProjectAction,
  updateProjectColorAction,
} from "@/lib/actions/projects";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { PROJECT_COLORS } from "@/lib/projectColors";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProjectCard({ project }: { project: ProjectWithStats }) {
  const [flipped, setFlipped] = useState(false);
  const [title, setTitle] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [color, setColor] = useState(project.color);
  const [showColors, setShowColors] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  const proj = color || "#5b8def";

  // La card mide lo que mide la cara activa; crece al darse vuelta si hay
  // muchas tareas, y al desplegar la paleta de colores.
  useLayoutEffect(() => {
    function measure() {
      const el = flipped ? backRef.current : frontRef.current;
      if (el) setHeight(el.offsetHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [flipped, showColors, project.tasks.length, project.kpi]);

  // Recalcula cuando deja de hacer giro/transición pendiente.
  useEffect(() => {
    const el = flipped ? backRef.current : frontRef.current;
    if (el) setHeight(el.offsetHeight);
  }, [flipped, showColors, pending, project.tasks.length]);

  function addTask() {
    const clean = title.trim();
    if (!clean) return;
    startTransition(async () => {
      const res = await addBacklogTaskAction(project.id, clean);
      if (res.ok) {
        setTitle("");
        inputRef.current?.focus();
      }
    });
  }

  function pickColor(next: string) {
    setColor(next); // optimista
    startTransition(() => {
      updateProjectColorAction(project.id, next);
    });
  }

  return (
    <div
      className={`flip-card ${flipped ? "is-flipped" : ""}`}
      style={{ ["--proj" as string]: proj, height }}
    >
      <div className="flip-inner">
        {/* ─── FRENTE: mínimo y limpio ─── */}
        <button
          ref={frontRef}
          type="button"
          onClick={() => setFlipped(true)}
          aria-label={`Abrir ${project.name}`}
          className="glass-card proj-glow flip-face flip-face-front min-h-[272px] cursor-pointer items-stretch rounded-[26px] p-6 text-left"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <ProgressRing progress={project.progress} icon={project.icon} color={proj} />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-primary text-xl font-bold text-fg">{project.name}</span>
              {project.kpi && (
                <span className="font-body text-xs text-fg-muted">KPIs: {project.kpi}</span>
              )}
            </div>
          </div>
          <span className="flex items-center justify-center gap-1.5 font-body text-[11px] text-fg-disabled">
            Tocá para ver tareas
            <span aria-hidden className="text-fg-muted">↻</span>
          </span>
        </button>

        {/* ─── REVERSO: tareas + progreso + color ─── */}
        <div
          ref={backRef}
          className="glass-card proj-glow flip-face flip-face-back rounded-[26px] p-5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="Volver"
              className="flex items-center gap-1.5 font-body text-sm text-fg-muted transition-colors hover:text-fg"
            >
              <span aria-hidden>←</span>
              <span className="font-primary font-bold text-fg">{project.name}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowColors((v) => !v)}
                aria-label="Cambiar color"
                title="Cambiar color"
                className={`text-sm transition-colors ${
                  showColors ? "text-fg" : "text-fg-disabled hover:text-fg-muted"
                }`}
              >
                🎨
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                aria-label="Archivar"
                className="font-body text-sm text-fg-disabled transition-colors hover:text-[var(--color-error)]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Paleta de color (oculta tras el ícono 🎨) */}
          {showColors && (
            <div className="mb-3 flex items-center gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => pickColor(c)}
                  aria-label={`Color ${c}`}
                  className="h-4 w-4 rounded-full transition-transform hover:scale-125"
                  style={{
                    background: c,
                    outline: color === c ? "2px solid #fff" : "none",
                    outlineOffset: "1px",
                  }}
                />
              ))}
            </div>
          )}

          {/* Avance */}
          <div className="mb-3 flex flex-col gap-1">
            <div className="flex items-center justify-between font-body text-xs text-fg-muted">
              <span>Avance ({project.taskCount} tareas)</span>
              <span className="tabular-nums" style={{ color: proj }}>
                {project.progress}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${project.progress}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${proj} 60%, #ffffff) 0%, ${proj} 100%)`,
                }}
              />
            </div>
          </div>

          {/* Tareas (todas visibles; la card crece) */}
          <ul className="flex flex-col gap-1">
            {project.tasks.length === 0 ? (
              <li className="font-body text-xs text-fg-disabled">Sin tareas todavía.</li>
            ) : (
              project.tasks.map((t) => <TaskRow key={t.id} task={t} />)
            )}
          </ul>

          {/* Agregar tarea al backlog */}
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="Agregar tarea…"
              className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm text-fg outline-none placeholder:text-fg-disabled focus:border-[var(--border-active)]"
            />
            <Button size="sm" variant="outline" onClick={addTask} disabled={pending || !title.trim()}>
              +
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Archivar {project.name}?</DialogTitle>
            <DialogDescription>
              Se oculta de la lista. Sus tareas no se borran.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                startTransition(() => archiveProjectAction(project.id));
                setConfirmOpen(false);
              }}
              disabled={pending}
            >
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Anillo de progreso sutil con el ícono del proyecto al centro. */
function ProgressRing({
  progress,
  icon,
  color,
}: {
  progress: number;
  icon: string;
  color: string;
}) {
  const size = 76;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, progress)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</span>
    </div>
  );
}

function TaskRow({ task }: { task: ProjectTaskLite }) {
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggleDone(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  return (
    <li className="flex items-center gap-2 rounded-[var(--radius-xs)] bg-surface px-3 py-1.5">
      <DoneToggle done={done} onToggle={toggleDone} size={16} />
      <span
        className={`flex-1 font-body text-sm ${
          done ? "text-fg-muted line-through" : "text-fg-secondary"
        }`}
      >
        {task.title}
      </span>
      {task.scheduled_date === null && (
        <span className="font-body text-[10px] uppercase tracking-wide text-fg-disabled">
          backlog
        </span>
      )}
    </li>
  );
}
