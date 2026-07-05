"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { Kpi } from "@/lib/queries/kpis";
import {
  createKpiAction,
  updateKpiAction,
  setKpiValueAction,
  deleteKpiAction,
} from "@/lib/actions/kpis";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

function fmt(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("es") : n.toLocaleString("es", { maximumFractionDigits: 2 });
}

/**
 * KPIs medibles del objetivo, como mini-tarjetas visibles:
 * nombre + valor actual / meta + barra de progreso con el color del objetivo.
 * Click en el valor → editarlo inline (cualquier miembro).
 * Agregar/editar/borrar KPI: solo admin.
 */
export function KpiCards({
  objectiveId,
  projectId,
  kpis,
  color,
  canManage,
}: {
  objectiveId: string;
  projectId: string;
  kpis: Kpi[];
  color: string;
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);

  if (kpis.length === 0 && !canManage) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-body text-xs font-bold uppercase tracking-[0.12em]" style={{ color }}>
          KPIs — cómo se mide el éxito
        </span>
        {canManage && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 font-body text-xs font-semibold text-fg-muted transition-colors hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" /> KPI
          </button>
        )}
      </div>

      {adding && (
        <KpiForm
          objectiveId={objectiveId}
          projectId={projectId}
          onClose={() => setAdding(false)}
        />
      )}

      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} projectId={projectId} color={color} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  kpi,
  projectId,
  color,
  canManage,
}: {
  kpi: Kpi;
  projectId: string;
  color: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editingValue, setEditingValue] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [valueInput, setValueInput] = useState(String(kpi.current_value));
  const [pending, startTransition] = useTransition();

  const hasTarget = kpi.target_value !== null && kpi.target_value > 0;
  const pct = hasTarget
    ? Math.min(100, Math.max(0, Math.round((kpi.current_value / kpi.target_value!) * 100)))
    : null;

  function saveValue() {
    const v = Number(valueInput.replace(",", "."));
    if (Number.isNaN(v)) {
      setEditingValue(false);
      setValueInput(String(kpi.current_value));
      return;
    }
    setEditingValue(false);
    startTransition(async () => {
      await setKpiValueAction(kpi.id, projectId, v);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <KpiForm
        objectiveId={kpi.objective_id}
        projectId={projectId}
        existing={kpi}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="group/kpi flex flex-col gap-1.5 rounded-2xl border border-[var(--border-default)] bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="font-body text-sm font-semibold leading-snug text-fg">{kpi.name}</span>
        {canManage && (
          <span className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/kpi:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar KPI"
              className="text-fg-disabled transition-colors hover:text-fg"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Borrar KPI"
              className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        {editingValue ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              inputMode="decimal"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveValue();
                if (e.key === "Escape") {
                  setEditingValue(false);
                  setValueInput(String(kpi.current_value));
                }
              }}
              className="w-20 rounded-lg border border-[var(--border-active)] bg-surface px-2 py-0.5 font-display text-lg font-bold tabular-nums text-fg outline-none"
            />
            <button type="button" onClick={saveValue} aria-label="Guardar valor" className="text-[var(--color-success)]">
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingValue(false);
                setValueInput(String(kpi.current_value));
              }}
              aria-label="Cancelar"
              className="text-fg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setValueInput(String(kpi.current_value));
              setEditingValue(true);
            }}
            disabled={pending}
            title="Click para actualizar el valor"
            className="rounded-lg font-display text-2xl font-black tabular-nums text-fg underline-offset-4 transition-colors hover:underline"
            style={{ textDecorationColor: color }}
          >
            {fmt(kpi.current_value)}
          </button>
        )}
        {hasTarget && (
          <span className="font-body text-sm text-fg-muted">
            / {fmt(kpi.target_value!)} {kpi.unit}
          </span>
        )}
        {!hasTarget && kpi.unit && <span className="font-body text-sm text-fg-muted">{kpi.unit}</span>}
      </div>

      {pct !== null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <span className="font-body text-[11px] font-semibold tabular-nums" style={{ color }}>
            {pct}%
          </span>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Borrar este KPI?"
        description={
          <>
            Vas a eliminar <strong>{kpi.name}</strong>. No se puede deshacer.
          </>
        }
        onConfirm={async () => {
          await deleteKpiAction(kpi.id, projectId);
          router.refresh();
        }}
      />
    </div>
  );
}

/** Formulario para crear o editar un KPI (nombre + meta numérica + unidad). */
function KpiForm({
  objectiveId,
  projectId,
  existing,
  onClose,
}: {
  objectiveId: string;
  projectId: string;
  existing?: Kpi;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [target, setTarget] = useState(
    existing?.target_value !== null && existing?.target_value !== undefined
      ? String(existing.target_value)
      : ""
  );
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre al KPI.");
      return;
    }
    const targetValue = target.trim() === "" ? null : Number(target.replace(",", "."));
    if (targetValue !== null && Number.isNaN(targetValue)) {
      setError("La meta tiene que ser un número (ej: 1000).");
      return;
    }
    startTransition(async () => {
      const res = existing
        ? await updateKpiAction(existing.id, projectId, { name, targetValue, unit })
        : await createKpiAction({ objectiveId, projectId, name, targetValue, unit });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border-active)] bg-white/[0.04] p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="KPI — ej: Seguidores en Instagram"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
      />
      <div className="flex gap-2">
        <input
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Meta (ej: 1000)"
          className="w-32 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm tabular-nums text-fg outline-none focus:border-[var(--border-active)]"
        />
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unidad (ej: seguidores)"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-1.5 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
        />
      </div>
      {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
          {existing ? "Guardar" : "Agregar KPI"}
        </Button>
      </div>
    </div>
  );
}
