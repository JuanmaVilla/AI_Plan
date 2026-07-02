"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Trash2, Flag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ObjectiveWithStats, ObjectiveTaskLite } from "@/lib/queries/objectives";
import {
  createObjectiveAction,
  archiveObjectiveAction,
  addObjectiveTaskAction,
} from "@/lib/actions/objectives";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { Button } from "@/components/ui/button";

export function ObjectivesPanel({
  projectId,
  objectives,
  canManage,
}: {
  projectId: string;
  objectives: ObjectiveWithStats[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-body text-sm font-semibold text-fg">
          <Target className="h-4 w-4 text-accent-cyan" /> Objetivos ({objectives.length})
        </span>
        {canManage && !adding && (
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Objetivo
          </Button>
        )}
      </div>

      {canManage && adding && (
        <NewObjectiveForm
          projectId={projectId}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {objectives.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
          <span className="text-3xl">🎯</span>
          <p className="font-body text-sm font-semibold text-fg-secondary">
            Este proyecto todavía no tiene objetivos
          </p>
          <p className="font-body text-sm text-fg-muted">
            {canManage
              ? "Creá un objetivo con su KPI (cómo se mide el éxito). Las tareas cuelgan de él."
              : "Cuando un admin defina objetivos, aparecerán acá."}
          </p>
        </div>
      ) : (
        objectives.map((o) => (
          <ObjectiveCard key={o.id} objective={o} projectId={projectId} canManage={canManage} />
        ))
      )}
    </div>
  );
}

function NewObjectiveForm({
  projectId,
  onDone,
  onCancel,
}: {
  projectId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [kpi, setKpi] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre al objetivo.");
      return;
    }
    startTransition(async () => {
      const res = await createObjectiveAction({
        projectId,
        name,
        kpi,
        targetDate: date || null,
      });
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="card-soft flex flex-col gap-3 rounded-[22px] p-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Objetivo — ej: Mezclar el beat completo"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
      />
      <input
        value={kpi}
        onChange={(e) => setKpi(e.target.value)}
        placeholder="KPI — ¿cómo se mide? (ej: 1000 likes en IG)"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
      />
      <label className="flex items-center gap-2 font-body text-sm text-fg-muted">
        Fecha límite (opcional)
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-2 py-1 text-fg outline-none focus:border-[var(--border-active)]"
        />
      </label>
      {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
          Crear objetivo
        </Button>
      </div>
    </div>
  );
}

function ObjectiveCard({
  objective,
  projectId,
  canManage,
}: {
  objective: ObjectiveWithStats;
  projectId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const color = objective.color || "#5b8def";

  function addTask() {
    const clean = title.trim();
    if (!clean) return;
    startTransition(async () => {
      await addObjectiveTaskAction(objective.id, projectId, clean);
      setTitle("");
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      await archiveObjectiveAction(objective.id, projectId);
      router.refresh();
    });
  }

  return (
    <div className="glass-card proj-glow flex flex-col gap-3 rounded-[26px] p-5" style={{ ["--proj" as string]: color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-primary text-lg font-bold text-fg">
            {objective.icon} {objective.name}
          </span>
          {objective.kpi && (
            <span className="font-body text-xs text-fg-muted">KPI: {objective.kpi}</span>
          )}
          {objective.target_date && (
            <span className="flex items-center gap-1 font-body text-xs text-fg-muted">
              <Flag className="h-3 w-3" />
              {format(parseISO(objective.target_date), "d 'de' MMM", { locale: es })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm tabular-nums" style={{ color }}>
            {objective.progress}%
          </span>
          {canManage && (
            <button
              type="button"
              onClick={archive}
              disabled={pending}
              aria-label="Archivar objetivo"
              className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${objective.progress}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 60%, #fff), ${color})` }}
        />
      </div>

      <ul className="flex flex-col gap-1">
        {objective.tasks.length === 0 ? (
          <li className="font-body text-xs text-fg-disabled">Sin tareas todavía.</li>
        ) : (
          objective.tasks.map((t) => <TaskRow key={t.id} task={t} />)
        )}
      </ul>

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Agregar tarea a este objetivo…"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm text-fg outline-none placeholder:text-fg-disabled focus:border-[var(--border-active)]"
        />
        <Button size="sm" variant="outline" onClick={addTask} disabled={pending || !title.trim()}>
          +
        </Button>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: ObjectiveTaskLite }) {
  const [done, setDone] = useState(task.done);
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  return (
    <li className="flex items-center gap-2">
      <DoneToggle done={done} onToggle={toggle} size={16} />
      <span className={`font-body text-sm ${done ? "text-fg-muted line-through" : "text-fg-secondary"}`}>
        {task.title}
      </span>
      {!done && task.progress > 0 && (
        <span className="ml-auto font-body text-[11px] tabular-nums text-fg-muted">
          {task.progress}%
        </span>
      )}
    </li>
  );
}
