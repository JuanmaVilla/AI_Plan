"use client";

import { useRef, useState, useTransition } from "react";
import type { ProjectWithStats } from "@/lib/queries/projects";
import { addBacklogTaskAction, archiveProjectAction } from "@/lib/actions/projects";
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
  const [title, setTitle] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="glass-card flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.icon}</span>
          <div className="flex flex-col">
            <span className="font-primary text-lg font-bold text-fg">{project.name}</span>
            {project.kpi && (
              <span className="font-body text-xs text-fg-muted">🎯 {project.kpi}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Archivar"
          className="font-body text-sm text-fg-disabled transition-colors hover:text-[var(--color-error)]"
        >
          ✕
        </button>
      </div>

      {/* Avance derivado */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between font-body text-xs text-fg-muted">
          <span>Avance ({project.taskCount} tareas)</span>
          <span className="tabular-nums text-accent-cyan">{project.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${project.progress}%`,
              background: "var(--brand-gradient)",
            }}
          />
        </div>
      </div>

      {/* Backlog */}
      {project.backlog.length > 0 && (
        <ul className="flex flex-col gap-1">
          {project.backlog.map((t) => (
            <li
              key={t.id}
              className="rounded-[var(--radius-xs)] bg-surface px-3 py-1.5 font-body text-sm text-fg-secondary"
            >
              {t.title}
            </li>
          ))}
        </ul>
      )}

      {/* Agregar tarea al backlog */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
          placeholder="Agregar tarea al backlog…"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm text-fg outline-none placeholder:text-fg-disabled focus:border-[var(--border-active)]"
        />
        <Button size="sm" variant="outline" onClick={addTask} disabled={pending || !title.trim()}>
          +
        </Button>
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
