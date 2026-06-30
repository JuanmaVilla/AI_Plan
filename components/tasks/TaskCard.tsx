"use client";

import { useState, useTransition } from "react";
import type { TaskWithProject } from "@/lib/queries/tasks";
import { ProgressSlider } from "@/components/tasks/ProgressSlider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setProgressAction, setNoteAction, deleteTaskAction } from "@/app/(app)/hoy/actions";

type NoteState = "idle" | "saving" | "saved";

export function TaskCard({ task }: { task: TaskWithProject }) {
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState(task.note);
  const [savedNote, setSavedNote] = useState(task.note);
  const [noteState, setNoteState] = useState<NoteState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function commitProgress(v: number) {
    setProgress(v);
    startTransition(() => setProgressAction(task.id, v));
  }

  async function saveNote() {
    if (note === savedNote) return;
    setNoteState("saving");
    await setNoteAction(task.id, note);
    setSavedNote(note);
    setNoteState("saved");
    setTimeout(() => setNoteState("idle"), 2000);
  }

  function remove() {
    startTransition(() => deleteTaskAction(task.id));
  }

  return (
    <div className="glass-card rounded-2xl p-4 transition-colors">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-body text-base font-medium text-fg">{task.title}</span>
          {task.project && (
            <span className="font-body text-xs text-fg-muted">
              {task.project.icon} {task.project.name}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Eliminar tarea"
          className="font-body text-sm text-fg-disabled transition-colors hover:text-[var(--color-error)]"
        >
          ✕
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <ProgressSlider value={progress} onChange={setProgress} onCommit={commitProgress} />
        <span className="w-12 shrink-0 text-right font-body text-sm tabular-nums text-accent-cyan">
          {progress}%
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
            Nota
          </span>
          <span className="font-body text-xs text-fg-muted" aria-live="polite">
            {noteState === "saving" && "Guardando…"}
            {noteState === "saved" && <span className="text-accent-mint">Guardado ✓</span>}
          </span>
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="¿Qué avancé? ¿Algún problema?"
          rows={2}
          className="resize-none border-[var(--border-default)] bg-surface font-body text-sm text-fg-secondary"
        />
        {note !== savedNote && (
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={saveNote}
              disabled={noteState === "saving"}
            >
              {noteState === "saving" ? "Guardando…" : "Guardar nota"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar esta tarea?</DialogTitle>
            <DialogDescription>
              Vas a eliminar <strong>{task.title}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                remove();
                setConfirmOpen(false);
              }}
              disabled={pending}
            >
              Sí, borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
