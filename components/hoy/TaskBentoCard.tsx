"use client";

import { useState, useTransition } from "react";
import { MessageSquare, MoreHorizontal, Trash2, Check } from "lucide-react";
import type { TaskWithMeta } from "@/lib/queries/tasks";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { setProgressAction, setNoteAction, deleteTaskAction } from "@/app/(app)/hoy/actions";

const STATUS_STEPS = [0, 25, 50, 75, 100] as const;

/** Avance 0–100% como track fino y calmado. Los pasos se vuelven visibles al
 *  pasar el mouse; en reposo es solo una línea sutil. */
function ProgressSteps({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center gap-1">
        {STATUS_STEPS.slice(1).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            onPointerDown={(e) => e.stopPropagation()}
            className={`h-1 flex-1 rounded-full transition-all duration-200 ${
              value >= step
                ? "bg-accent-mint/80"
                : "bg-white/8 group-hover:bg-white/15"
            }`}
            aria-label={`${step}%`}
          />
        ))}
      </div>
      <span className="w-7 shrink-0 text-right font-body text-[10px] tabular-nums text-fg-muted">
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
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
        done
          ? "border-transparent bg-[var(--color-success)] text-white"
          : "border-white/15 bg-transparent text-transparent hover:border-[var(--color-success)] hover:text-[var(--color-success)]"
      }`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-white/10"
      style={{ background: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function TaskBentoCard({
  task,
  size = "md",
}: {
  task: TaskWithMeta;
  size?: "sm" | "md" | "lg";
}) {
  const [done, setDone] = useState(task.done);
  const [progress, setProgress] = useState(task.progress);
  const [note, setNote] = useState(task.note ?? "");
  const [savedNote, setSavedNote] = useState(task.note ?? "");
  const [showNote, setShowNote] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleDone() {
    const next = !done;
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  function commitProgress(v: number) {
    setProgress(v);
    startTransition(() => setProgressAction(task.id, v));
    // Al llegar a 100% se marca la tarea como completada automáticamente
    if (v === 100 && !done) {
      setDone(true);
      startTransition(() => toggleDoneAction(task.id, true));
    }
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

  const projectColor = task.project?.color ?? "#0cc0df";

  const minH = size === "lg" ? "min-h-[220px]" : size === "sm" ? "min-h-[150px]" : "min-h-[184px]";
  const titleSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";

  return (
    <article
      style={{ ["--proj" as string]: projectColor }}
      className={`card-soft proj-glow group relative flex h-full flex-col gap-3 rounded-[26px] p-5 transition-all duration-300 hover:-translate-y-0.5 ${minH} ${
        done ? "opacity-55" : ""
      }`}
    >
      {/* Top: proyecto (sutil) + done */}
      <div className="flex items-start justify-between gap-2">
        {task.project ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/8 py-0.5 pl-1.5 pr-2.5 font-body text-[11px] font-medium text-fg-secondary">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none"
              style={{ background: `${projectColor}33` }}
            >
              {task.project.icon}
            </span>
            <span className="truncate">{task.project.name}</span>
          </span>
        ) : (
          <span />
        )}
        <DoneCircle done={done} onToggle={toggleDone} />
      </div>

      {/* Título: protagonista */}
      <h3
        className={`flex-1 font-primary font-black leading-tight tracking-[-0.02em] ${titleSize} ${
          done ? "text-fg-muted line-through" : "text-fg"
        }`}
      >
        {task.title}
      </h3>

      {/* Avance fino */}
      <ProgressSteps value={progress} onChange={commitProgress} />

      {/* Bottom: avatar + controles secundarios (ocultos hasta hover) */}
      <div className="flex items-center justify-between pt-0.5">
        {task.assignee ? (
          <Avatar name={task.assignee.full_name} color={task.assignee.avatar_color} />
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setShowNote((s) => !s)}
            aria-label="Nota"
            className={`relative flex items-center rounded-full p-1.5 transition-colors ${
              showNote || note ? "text-accent-mint" : "text-fg-disabled hover:text-fg-muted"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {note && !showNote && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent-mint" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((s) => !s)}
              aria-label="Opciones"
              className="flex items-center rounded-full p-1.5 text-fg-disabled transition-colors hover:text-fg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-elevated shadow-[var(--shadow-2)]">
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

      {/* Nota expandible */}
      {showNote && (
        <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="¿Qué avancé? ¿Algún problema?"
            rows={2}
            className="w-full resize-none rounded-2xl border border-white/8 bg-black/20 px-3 py-2 font-body text-sm text-fg-secondary placeholder:text-fg-disabled focus:border-[var(--border-active)] focus:outline-none"
          />
          {note !== savedNote && (
            <button
              type="button"
              onClick={saveNote}
              className="self-end rounded-full bg-white/8 px-3 py-1.5 font-body text-xs font-semibold text-fg-muted hover:text-fg"
            >
              Guardar nota
            </button>
          )}
        </div>
      )}
    </article>
  );
}
