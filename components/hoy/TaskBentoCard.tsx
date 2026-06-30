"use client";

import { useState, useTransition } from "react";
import { MessageSquare, MoreHorizontal, Trash2, Check } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { setProgressAction, setNoteAction, deleteTaskAction } from "@/app/(app)/hoy/actions";

const STATUS_STEPS = [0, 25, 50, 75, 100] as const;

function ProgressSteps({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => onChange(step)}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            value >= step
              ? "bg-accent-cyan"
              : "bg-[var(--border-default)] hover:bg-fg-disabled"
          }`}
          aria-label={`${step}%`}
        />
      ))}
      <span className="ml-2 w-8 shrink-0 text-right font-body text-xs tabular-nums text-fg-muted">
        {value}%
      </span>
    </div>
  );
}

function DoneCircle({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        done
          ? "border-transparent bg-[var(--color-success)] text-white shadow-[0_0_12px_rgba(25,169,107,0.5)]"
          : "border-[var(--border-default)] bg-transparent text-transparent hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
      }`}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ background: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: "Completada", cls: "text-[var(--color-success)] bg-[rgba(25,169,107,0.12)]" },
  full: { label: "100%", cls: "text-accent-cyan bg-[var(--accent-cyan-dim)]" },
  progress: { label: "En progreso", cls: "text-accent-cyan bg-[var(--accent-cyan-dim)]" },
  pending: { label: "Pendiente", cls: "text-fg-muted bg-[var(--border-default)]" },
};

function getStatus(done: boolean, progress: number) {
  if (done) return STATUS_LABEL.done;
  if (progress === 100) return STATUS_LABEL.full;
  if (progress > 0) return STATUS_LABEL.progress;
  return STATUS_LABEL.pending;
}

export function TaskBentoCard({ task }: { task: TaskWithMeta }) {
  const [done, setDone] = useState(task.done);
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState(task.note ?? "");
  const [savedNote, setSavedNote] = useState(task.note ?? "");
  const [showNote, setShowNote] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pending, startTransition] = useTransition();

  const status = getStatus(done, progress);

  function toggleDone() {
    const next = !done;
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  function commitProgress(v: number) {
    setProgress(v);
    startTransition(() => setProgressAction(task.id, v));
  }

  async function saveNote() {
    if (note === savedNote) return;
    await setNoteAction(task.id, note);
    setSavedNote(note);
  }

  function remove() {
    startTransition(() => deleteTaskAction(task.id));
    setShowMenu(false);
  }

  // Project accent color (fallback to cyan)
  const projectColor = task.project?.color ?? "#0cc0df";

  return (
    <article
      className={`glass-card relative flex flex-col gap-3 rounded-[20px] p-4 transition-all duration-300 ${
        done ? "opacity-60" : ""
      }`}
      style={{
        borderLeft: `3px solid ${projectColor}40`,
      }}
    >
      {/* Top row: project + done */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          {task.project && (
            <span
              className="inline-flex items-center gap-1 font-body text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: projectColor }}
            >
              <span>{task.project.icon}</span>
              <span className="truncate">{task.project.name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${status.cls}`}
          >
            {status.label}
          </span>
          <DoneCircle done={done} onToggle={toggleDone} />
        </div>
      </div>

      {/* Title */}
      <h3
        className={`font-primary text-base font-bold leading-snug ${
          done ? "text-fg-muted line-through" : "text-fg"
        }`}
      >
        {task.title}
      </h3>

      {/* Progress */}
      <ProgressSteps value={progress} onChange={commitProgress} />

      {/* Bottom row: avatar + actions */}
      <div className="flex items-center justify-between pt-1">
        {task.assignee ? (
          <Avatar name={task.assignee.full_name} color={task.assignee.avatar_color} />
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {/* Comment icon */}
          <button
            type="button"
            onClick={() => setShowNote((s) => !s)}
            aria-label="Nota"
            className={`flex items-center gap-1 rounded-lg px-2 py-1 font-body text-xs transition-colors ${
              showNote || note
                ? "text-accent-cyan"
                : "text-fg-disabled hover:text-fg-muted"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {note && !showNote && (
              <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
            )}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((s) => !s)}
              aria-label="Opciones"
              className="flex items-center rounded-lg p-1 text-fg-disabled transition-colors hover:text-fg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border border-[var(--border-default)] bg-elevated shadow-[var(--shadow-2)]">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="flex w-full items-center gap-2 px-3 py-2.5 font-body text-sm text-[var(--color-error)] transition-colors hover:bg-[rgba(255,77,106,0.1)] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Note expandible */}
      {showNote && (
        <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="¿Qué avancé? ¿Algún problema?"
            rows={2}
            className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg-secondary placeholder:text-fg-disabled focus:border-[var(--border-active)] focus:outline-none"
          />
          {note !== savedNote && (
            <button
              type="button"
              onClick={saveNote}
              className="self-end rounded-lg bg-elevated px-3 py-1.5 font-body text-xs font-semibold text-fg-muted hover:text-fg"
            >
              Guardar nota
            </button>
          )}
        </div>
      )}
    </article>
  );
}
