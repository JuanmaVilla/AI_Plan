"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectWithStats } from "@/lib/queries/projects";
import { archiveProjectAction, updateProjectColorAction } from "@/lib/actions/projects";
import { PROJECT_COLORS } from "@/lib/projectColors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProjectCard({
  project,
  canManage = false,
}: {
  project: ProjectWithStats;
  canManage?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [color, setColor] = useState(project.color);
  const [showColors, setShowColors] = useState(false);
  const [pending, startTransition] = useTransition();
  const proj = color || "#5b8def";

  function pickColor(next: string) {
    setColor(next); // optimista
    startTransition(() => {
      updateProjectColorAction(project.id, next);
    });
  }

  function archive() {
    startTransition(async () => {
      await archiveProjectAction(project.id);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative" style={{ ["--proj" as string]: proj }}>
      <Link
        href={`/proyectos/${project.id}`}
        className="glass-card proj-glow flex min-h-[240px] flex-col items-stretch rounded-[26px] p-6 text-left transition-transform hover:scale-[1.01]"
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <ProgressRing progress={project.progress} icon={project.icon} color={proj} />
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-primary text-xl font-bold text-fg">{project.name}</span>
            <span className="font-body text-xs font-semibold tabular-nums" style={{ color: proj }}>
              {project.progress}% completado
            </span>
            <span className="font-body text-xs text-fg-muted">
              {project.objectiveCount} {project.objectiveCount === 1 ? "objetivo" : "objetivos"} ·{" "}
              {project.taskCount} {project.taskCount === 1 ? "tarea" : "tareas"}
            </span>
          </div>
        </div>
        <span className="flex items-center justify-center gap-1.5 font-body text-[11px] text-fg-disabled">
          Abrir para planear objetivos →
        </span>
      </Link>

      {/* Controles de admin (no navegan) */}
      {canManage && (
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColors((v) => !v)}
            aria-label="Cambiar color"
            title="Cambiar color"
            className={`text-sm transition-colors ${showColors ? "text-fg" : "text-fg-disabled hover:text-fg-muted"}`}
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
      )}

      {canManage && showColors && (
        <div className="absolute right-4 top-11 z-10 flex items-center gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-elevated p-2 shadow-[var(--shadow-2)]">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickColor(c)}
              aria-label={`Color ${c}`}
              className="h-4 w-4 rounded-full transition-transform hover:scale-125"
              style={{ background: c, outline: color === c ? "2px solid #fff" : "none", outlineOffset: "1px" }}
            />
          ))}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Archivar {project.name}?</DialogTitle>
            <DialogDescription>
              Se oculta de la lista. Sus objetivos y tareas no se borran.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={archive} disabled={pending}>
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Anillo de progreso sutil con el ícono del proyecto al centro. */
function ProgressRing({ progress, icon, color }: { progress: number; icon: string; color: string }) {
  const size = 92;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, progress));
  const offset = c * (1 - pct / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Pista siempre visible */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={stroke}
        />
        {/* Arco de progreso */}
        {pct > 0 && (
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
            style={{ transition: "stroke-dashoffset 400ms", filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</span>
    </div>
  );
}
