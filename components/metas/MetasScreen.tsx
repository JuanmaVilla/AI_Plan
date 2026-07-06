"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Flag, Trash2, X, Link2, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { MetaWithProjects } from "@/lib/queries/metas";
import { createMetaAction, archiveMetaAction, updateMetaAction } from "@/lib/actions/metas";
import { setProjectMetaAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type ProjectLite = {
  id: string;
  name: string;
  icon: string;
  company_objective_id: string | null;
};

export function MetasScreen({
  metas,
  allProjects,
  canManage,
}: {
  metas: MetaWithProjects[];
  allProjects: ProjectLite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Empresa
          </span>
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            Metas
          </h1>
          <p className="font-body text-sm text-fg-muted">
            Las grandes metas de la empresa. Tus proyectos aportan a ellas.
          </p>
        </div>
        {canManage && !adding && (
          <Button data-tour="metas-new" className="gap-1" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Nueva meta
          </Button>
        )}
      </header>

      {canManage && adding && (
        <NewMetaForm
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {metas.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-[var(--border-default)] px-6 py-16 text-center">
          <span className="text-4xl">🏁</span>
          <p className="font-body text-base font-semibold text-fg-secondary">
            Todavía no hay metas de empresa
          </p>
          <p className="font-body text-sm text-fg-muted">
            {canManage
              ? "Ej: “Tener 20 clientes”, “Ser rentables”. Después conectás proyectos a cada meta."
              : "Cuando un admin defina las metas, aparecerán acá."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {metas.map((m) => (
            <MetaCard key={m.id} meta={m} allProjects={allProjects} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewMetaForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [kpi, setKpi] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError("Poné un nombre a la meta.");
      return;
    }
    startTransition(async () => {
      const res = await createMetaAction({ name, kpi, targetDate: date || null });
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
        placeholder="Meta — ej: Llegar a 20 clientes"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
      />
      <input
        value={kpi}
        onChange={(e) => setKpi(e.target.value)}
        placeholder="KPI — ¿cómo se mide? (ej: 20 clientes activos)"
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
      />
      <label className="flex items-center gap-2 font-body text-sm text-fg-muted">
        Fecha objetivo (opcional)
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
          Crear meta
        </Button>
      </div>
    </div>
  );
}

function MetaCard({
  meta,
  allProjects,
  canManage,
}: {
  meta: MetaWithProjects;
  allProjects: ProjectLite[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const color = meta.color || "#5b8def";

  // Proyectos que todavía no apuntan a esta meta (para vincular).
  const available = allProjects.filter((p) => p.company_objective_id !== meta.id);

  function archive() {
    startTransition(async () => {
      await archiveMetaAction(meta.id);
      router.refresh();
    });
  }

  function link(projectId: string) {
    if (!projectId) return;
    startTransition(async () => {
      await setProjectMetaAction(projectId, meta.id);
      setLinking(false);
      router.refresh();
    });
  }

  function unlink(projectId: string) {
    startTransition(async () => {
      await setProjectMetaAction(projectId, null);
      router.refresh();
    });
  }

  return (
    <div data-tour="meta-card" className="glass-card proj-glow flex flex-col gap-3 rounded-[26px] p-5" style={{ ["--proj" as string]: color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-primary text-lg font-bold text-fg">
            {meta.icon} {meta.name}
          </span>
          {meta.kpi && <span className="font-body text-xs text-fg-muted">KPI: {meta.kpi}</span>}
          {meta.target_date && (
            <span className="flex items-center gap-1 font-body text-xs text-fg-muted">
              <Flag className="h-3 w-3" />
              {format(parseISO(meta.target_date), "d 'de' MMM", { locale: es })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm tabular-nums" style={{ color }}>
            {meta.progress}%
          </span>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={pending}
                aria-label="Editar meta"
                className="text-fg-disabled transition-colors hover:text-fg"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={archive}
                disabled={pending}
                aria-label="Archivar meta"
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
          style={{ width: `${meta.progress}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 60%, #fff), ${color})` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">
          Proyectos ({meta.projects.length})
        </span>
        {meta.projects.length === 0 ? (
          <span className="font-body text-xs text-fg-disabled">
            Ningún proyecto apunta a esta meta todavía.
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {meta.projects.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-white/5 pl-3 pr-2 py-1 font-body text-xs text-fg-secondary"
              >
                <Link href={`/proyectos/${p.id}`} className="flex items-center gap-1.5 transition-colors hover:text-fg">
                  <span>{p.icon}</span>
                  {p.name}
                  <span className="tabular-nums text-fg-muted">{p.progress}%</span>
                </Link>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => unlink(p.id)}
                    disabled={pending}
                    aria-label={`Desvincular ${p.name}`}
                    className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Vincular un proyecto existente a esta meta (solo admin) */}
        {canManage &&
          (linking ? (
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => link(e.target.value)}
              disabled={pending || available.length === 0}
              className="w-fit rounded-xl border border-[var(--border-default)] bg-surface px-2.5 py-1.5 font-body text-xs text-fg outline-none focus:border-[var(--border-active)]"
            >
              <option value="" disabled>
                {available.length === 0 ? "No hay proyectos libres" : "Elegí un proyecto…"}
              </option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setLinking(true)}
              className="flex w-fit items-center gap-1.5 font-body text-xs font-semibold text-accent-cyan transition-colors hover:text-fg"
            >
              <Link2 className="h-3.5 w-3.5" /> Añadir proyecto
            </button>
          ))}
      </div>

      {canManage && (
        <EditMetaDialog
          open={editing}
          onOpenChange={setEditing}
          meta={meta}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

/** Editar nombre, KPI y fecha de una meta (solo admin). */
function EditMetaDialog({
  open,
  onOpenChange,
  meta,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meta: MetaWithProjects;
  onSaved: () => void;
}) {
  const [name, setName] = useState(meta.name);
  const [kpi, setKpi] = useState(meta.kpi);
  const [date, setDate] = useState(meta.target_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    startTransition(async () => {
      const res = await updateMetaAction(meta.id, {
        name,
        kpi,
        targetDate: date || null,
      });
      if (res.ok) {
        onOpenChange(false);
        onSaved();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la meta"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
          />
          <input
            value={kpi}
            onChange={(e) => setKpi(e.target.value)}
            placeholder="KPI — ¿cómo se mide?"
            className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
          />
          <label className="flex items-center gap-2 font-body text-sm text-fg-muted">
            Fecha objetivo (opcional)
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-2 py-1 text-fg outline-none focus:border-[var(--border-active)]"
            />
          </label>
          {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
