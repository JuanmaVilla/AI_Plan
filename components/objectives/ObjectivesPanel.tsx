"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Trash2, Flag, Pencil, Copy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ObjectiveWithStats, ObjectiveTaskLite } from "@/lib/queries/objectives";
import {
  createObjectiveAction,
  archiveObjectiveAction,
  addObjectiveTaskAction,
} from "@/lib/actions/objectives";
import { toggleDoneAction } from "@/lib/actions/tasks";
import { setTaskAssigneesAction } from "@/lib/actions/week";
import { deleteTaskAction } from "@/app/(app)/hoy/actions";
import { DoneToggle } from "@/components/tasks/DoneToggle";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { DuplicateTaskDialog } from "@/components/tasks/DuplicateTaskDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditObjectiveDialog } from "@/components/objectives/EditObjectiveDialog";
import { KpiCards } from "@/components/objectives/KpiCards";
import type { Member } from "@/lib/queries/members";
import { Button } from "@/components/ui/button";

export function ObjectivesPanel({
  projectId,
  teamId,
  objectives,
  canManage,
  members,
  currentUserId,
}: {
  projectId: string;
  teamId: string;
  objectives: ObjectiveWithStats[];
  canManage: boolean;
  members: Member[];
  currentUserId: string;
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
          <Button data-tour="obj-add" size="sm" variant="outline" className="gap-1" onClick={() => setAdding(true)}>
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
          <ObjectiveCard
            key={o.id}
            objective={o}
            projectId={projectId}
            teamId={teamId}
            canManage={canManage}
            members={members}
            currentUserId={currentUserId}
          />
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
  const [kpiTarget, setKpiTarget] = useState("");
  const [kpiUnit, setKpiUnit] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre al objetivo.");
      return;
    }
    const target = kpiTarget.trim() === "" ? null : Number(kpiTarget.replace(",", "."));
    if (target !== null && Number.isNaN(target)) {
      setError("La meta del KPI tiene que ser un número (ej: 1000).");
      return;
    }
    startTransition(async () => {
      const res = await createObjectiveAction({
        projectId,
        name,
        kpi,
        kpiTarget: target,
        kpiUnit,
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
        placeholder="Primer KPI — ¿cómo se mide? (ej: Likes en IG)"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
      />
      {kpi.trim() && (
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            value={kpiTarget}
            onChange={(e) => setKpiTarget(e.target.value)}
            placeholder="Meta (ej: 1000)"
            className="w-32 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm tabular-nums text-fg outline-none focus:border-[var(--border-active)]"
          />
          <input
            value={kpiUnit}
            onChange={(e) => setKpiUnit(e.target.value)}
            placeholder="Unidad (ej: likes)"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
          />
        </div>
      )}
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
  teamId,
  canManage,
  members,
  currentUserId,
}: {
  objective: ObjectiveWithStats;
  projectId: string;
  teamId: string;
  canManage: boolean;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
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

  async function archive() {
    await archiveObjectiveAction(objective.id, projectId);
    router.refresh();
  }

  return (
    <div className="glass-card proj-glow flex flex-col gap-3 rounded-[26px] p-5" style={{ ["--proj" as string]: color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-primary text-2xl font-black leading-tight tracking-[-0.01em] text-fg">
            {objective.icon} {objective.name}
          </span>
          {objective.target_date && (
            <span className="flex items-center gap-1 font-body text-sm text-fg-muted">
              <Flag className="h-3.5 w-3.5" />
              {format(parseISO(objective.target_date), "d 'de' MMM", { locale: es })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm tabular-nums" style={{ color }}>
            {objective.progress}%
          </span>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                disabled={pending}
                aria-label="Editar objetivo"
                className="text-fg-disabled transition-colors hover:text-fg"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                disabled={pending}
                aria-label="Archivar objetivo"
                className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${objective.progress}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 60%, #fff), ${color})` }}
        />
      </div>

      <div data-tour="obj-kpi">
        <KpiCards
          objectiveId={objective.id}
          projectId={projectId}
          kpis={objective.kpis}
          color={color}
          canManage={canManage}
        />
      </div>

      <ul className="flex flex-col gap-1.5">
        {objective.tasks.length === 0 ? (
          <li className="font-body text-xs text-fg-disabled">Sin tareas todavía.</li>
        ) : (
          objective.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              teamId={teamId}
              members={members}
              currentUserId={currentUserId}
              canReassign={canManage}
            />
          ))
        )}
      </ul>

      <div data-tour="obj-task" className="flex items-center gap-2">
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

      <EditObjectiveDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        objectiveId={objective.id}
        projectId={projectId}
        currentName={objective.name}
        currentTargetDate={objective.target_date}
        currentColor={objective.color}
      />
      <ConfirmDialog
        open={showArchive}
        onOpenChange={setShowArchive}
        title={`¿Archivar “${objective.name}”?`}
        description={
          objective.taskCount > 0 ? (
            <>
              Se archiva el objetivo y{" "}
              <strong>
                se borran también sus {objective.taskCount}{" "}
                {objective.taskCount === 1 ? "tarea" : "tareas"}
              </strong>{" "}
              (desaparecen del backlog, la semana y hoy). Esta acción no se puede deshacer.
            </>
          ) : (
            <>Se archiva el objetivo. No tiene tareas, así que no se borra nada más.</>
          )
        }
        confirmLabel="Sí, archivar todo"
        onConfirm={archive}
      />
    </div>
  );
}

function TaskRow({
  task,
  teamId,
  members,
  currentUserId,
  canReassign,
}: {
  task: ObjectiveTaskLite;
  teamId: string;
  members: Member[];
  currentUserId: string;
  canReassign: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(task.done);
  const [assigneeIds, setAssigneeIds] = useState(task.assignees.map((a) => a.id));
  const [showEdit, setShowEdit] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [, startTransition] = useTransition();

  function toggle(next: boolean) {
    setDone(next);
    startTransition(() => toggleDoneAction(task.id, next));
  }

  function changeAssignees(ids: string[]) {
    setAssigneeIds(ids);
    startTransition(() => setTaskAssigneesAction(task.id, teamId, ids));
  }

  return (
    <li className="group/task flex items-center gap-2">
      <DoneToggle done={done} onToggle={toggle} size={16} />
      <span className={`min-w-0 flex-1 truncate font-body text-base ${done ? "text-fg-muted line-through" : "text-fg-secondary"}`}>
        {task.title}
      </span>
      {!done && task.progress > 0 && (
        <span className="font-body text-[11px] tabular-nums text-fg-muted">
          {task.progress}%
        </span>
      )}
      <span className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          aria-label="Editar tarea"
          className="text-fg-disabled transition-colors hover:text-fg"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowDuplicate(true)}
          aria-label="Duplicar tarea"
          className="text-fg-disabled transition-colors hover:text-fg"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          aria-label="Borrar tarea"
          className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </span>
      <AssigneePicker
        members={members}
        selected={assigneeIds}
        onChange={changeAssignees}
        canReassign={canReassign}
        currentUserId={currentUserId}
        size="xs"
      />

      <EditTaskDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        taskId={task.id}
        currentTitle={task.title}
      />
      <DuplicateTaskDialog
        open={showDuplicate}
        onOpenChange={setShowDuplicate}
        taskId={task.id}
        taskTitle={task.title}
      />
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="¿Borrar esta tarea?"
        description={
          <>
            Vas a eliminar <strong>{task.title}</strong>. No se puede deshacer.
          </>
        }
        onConfirm={async () => {
          await deleteTaskAction(task.id);
          router.refresh();
        }}
      />
    </li>
  );
}
